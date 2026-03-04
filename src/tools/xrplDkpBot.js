import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import xrpl from 'xrpl';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function numberEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number for ${name}: ${raw}`);
  }
  return parsed;
}

function boolEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

function amountToNumber(amount) {
  if (typeof amount === 'string') {
    return Number(xrpl.dropsToXrp(amount));
  }
  return Number(amount.value);
}

function nowIso() {
  return new Date().toISOString();
}

const config = {
  wsUrl: process.env.XRPL_WS_URL || 'wss://s1.ripple.com',
  secret: required('XRPL_SECRET'),
  account: process.env.XRPL_ACCOUNT,
  dkpCurrency: process.env.DKP_CURRENCY || 'DKP',
  dkpIssuer: required('DKP_ISSUER'),
  spendXrpPerOrder: numberEnv('DKP_BOT_SPEND_XRP_PER_ORDER', 1),
  maxOpenOrders: numberEnv('DKP_BOT_MAX_OPEN_ORDERS', 3),
  maxDailySpendXrp: numberEnv('DKP_BOT_MAX_DAILY_SPEND_XRP', 10),
  minXrpBuffer: numberEnv('DKP_BOT_MIN_XRP_BUFFER', 30),
  buyDiscountBps: numberEnv('DKP_BOT_BUY_DISCOUNT_BPS', 100),
  enableSells: boolEnv('DKP_BOT_ENABLE_SELLS', false),
  takeProfitBps: numberEnv('DKP_BOT_TAKE_PROFIT_BPS', 500),
  sellFraction: numberEnv('DKP_BOT_SELL_FRACTION', 0.1),
  loopSeconds: numberEnv('DKP_BOT_LOOP_SECONDS', 60),
  dryRun: boolEnv('DKP_BOT_DRY_RUN', true),
  stateFile: process.env.DKP_BOT_STATE_FILE || '.dkp-bot-state.json'
};

if (config.spendXrpPerOrder <= 0) {
  throw new Error('DKP_BOT_SPEND_XRP_PER_ORDER must be > 0');
}
if (config.maxOpenOrders < 1) {
  throw new Error('DKP_BOT_MAX_OPEN_ORDERS must be >= 1');
}
if (config.sellFraction <= 0 || config.sellFraction > 1) {
  throw new Error('DKP_BOT_SELL_FRACTION must be between 0 and 1');
}

const wallet = xrpl.Wallet.fromSeed(config.secret);
if (config.account && config.account !== wallet.address) {
  throw new Error(`XRPL_ACCOUNT (${config.account}) does not match derived wallet (${wallet.address})`);
}

const statePath = path.resolve(process.cwd(), config.stateFile);

function loadState() {
  if (!fs.existsSync(statePath)) {
    return {
      day: new Date().toISOString().slice(0, 10),
      dailySpentXrp: 0,
      loops: 0
    };
  }
  const parsed = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const today = new Date().toISOString().slice(0, 10);
  if (parsed.day !== today) {
    return {
      day: today,
      dailySpentXrp: 0,
      loops: 0
    };
  }
  return parsed;
}

function saveState(state) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

async function getBalances(client, account) {
  const [info, lines] = await Promise.all([
    client.request({ command: 'account_info', account, ledger_index: 'validated' }),
    client.request({ command: 'account_lines', account, ledger_index: 'validated' })
  ]);

  const xrpBalance = Number(xrpl.dropsToXrp(info.result.account_data.Balance));

  const dkpLine = lines.result.lines.find(
    (line) => line.currency === config.dkpCurrency && line.account === config.dkpIssuer
  );

  const dkpBalance = dkpLine ? Number(dkpLine.balance) : 0;
  return { xrpBalance, dkpBalance };
}

async function getBookTop(client) {
  const askBook = await client.request({
    command: 'book_offers',
    taker_gets: {
      currency: config.dkpCurrency,
      issuer: config.dkpIssuer
    },
    taker_pays: xrpl.xrpToDrops('1'),
    limit: 10,
    ledger_index: 'validated'
  });

  const offers = askBook.result.offers || [];
  if (offers.length === 0) {
    return null;
  }

  let best = null;
  for (const offer of offers) {
    const paysXrp = amountToNumber(offer.TakerPays);
    const getsDkp = amountToNumber(offer.TakerGets);
    if (getsDkp <= 0) {
      continue;
    }
    const px = paysXrp / getsDkp;
    if (!best || px < best.priceXrpPerDkp) {
      best = { priceXrpPerDkp: px, paysXrp, getsDkp };
    }
  }

  return best;
}

async function getOpenOffers(client, account) {
  const response = await client.request({
    command: 'account_offers',
    account,
    ledger_index: 'validated'
  });
  return response.result.offers || [];
}

function classifyOffer(offer) {
  const pays = offer.taker_pays_funded ?? offer.TakerPays;
  const gets = offer.taker_gets_funded ?? offer.TakerGets;

  const paysIsXrp = typeof pays === 'string';
  const getsIsXrp = typeof gets === 'string';

  const paysIsDkp = typeof pays !== 'string' && pays.currency === config.dkpCurrency && pays.issuer === config.dkpIssuer;
  const getsIsDkp = typeof gets !== 'string' && gets.currency === config.dkpCurrency && gets.issuer === config.dkpIssuer;

  if (paysIsXrp && getsIsDkp) {
    return 'buy';
  }
  if (paysIsDkp && getsIsXrp) {
    return 'sell';
  }
  return 'other';
}

async function submitTransaction(client, tx) {
  if (config.dryRun) {
    console.log(`[${nowIso()}] DRY_RUN tx`, JSON.stringify(tx));
    return { dryRun: true };
  }

  const result = await client.submitAndWait(tx, { wallet });
  const txResult = result.result?.meta?.TransactionResult;
  if (txResult !== 'tesSUCCESS') {
    throw new Error(`XRPL tx failed: ${txResult}`);
  }
  return result;
}

async function placeBuy(client, bestAskPrice, state) {
  const targetPrice = bestAskPrice * (1 - config.buyDiscountBps / 10000);
  if (targetPrice <= 0) {
    throw new Error('Target buy price must be > 0');
  }

  const dkpAmount = config.spendXrpPerOrder / targetPrice;

  const tx = {
    TransactionType: 'OfferCreate',
    Account: wallet.address,
    TakerPays: xrpl.xrpToDrops(config.spendXrpPerOrder.toFixed(6)),
    TakerGets: {
      currency: config.dkpCurrency,
      issuer: config.dkpIssuer,
      value: dkpAmount.toFixed(6)
    },
    Flags: 0,
    LastLedgerSequence: null
  };

  await submitTransaction(client, tx);
  state.dailySpentXrp += config.spendXrpPerOrder;
  console.log(`[${nowIso()}] Placed BUY offer: spend ${config.spendXrpPerOrder} XRP for ${dkpAmount.toFixed(6)} ${config.dkpCurrency} @ ${targetPrice.toFixed(8)} XRP/${config.dkpCurrency}`);
}

async function placeSell(client, referenceAskPrice, dkpBalance) {
  if (dkpBalance <= 0) {
    return;
  }

  const sellAmount = dkpBalance * config.sellFraction;
  if (sellAmount <= 0) {
    return;
  }

  const targetSellPrice = referenceAskPrice * (1 + config.takeProfitBps / 10000);
  const targetXrp = sellAmount * targetSellPrice;

  const tx = {
    TransactionType: 'OfferCreate',
    Account: wallet.address,
    TakerPays: {
      currency: config.dkpCurrency,
      issuer: config.dkpIssuer,
      value: sellAmount.toFixed(6)
    },
    TakerGets: xrpl.xrpToDrops(targetXrp.toFixed(6)),
    Flags: 0,
    LastLedgerSequence: null
  };

  await submitTransaction(client, tx);
  console.log(`[${nowIso()}] Placed SELL offer: sell ${sellAmount.toFixed(6)} ${config.dkpCurrency} for ${targetXrp.toFixed(6)} XRP @ ${targetSellPrice.toFixed(8)} XRP/${config.dkpCurrency}`);
}

async function runLoop(client, state) {
  state.loops += 1;

  const balances = await getBalances(client, wallet.address);
  const openOffers = await getOpenOffers(client, wallet.address);
  const best = await getBookTop(client);

  const buyOpen = openOffers.filter((offer) => classifyOffer(offer) === 'buy').length;
  const sellOpen = openOffers.filter((offer) => classifyOffer(offer) === 'sell').length;

  console.log(`[${nowIso()}] Loop #${state.loops}`);
  console.log(`  Balances: ${balances.xrpBalance.toFixed(6)} XRP | ${balances.dkpBalance.toFixed(6)} ${config.dkpCurrency}`);
  console.log(`  Open offers: buy=${buyOpen}, sell=${sellOpen}, total=${openOffers.length}`);
  console.log(`  Daily spent: ${state.dailySpentXrp.toFixed(6)} / ${config.maxDailySpendXrp.toFixed(6)} XRP`);

  if (!best) {
    console.log(`  No market offers found for ${config.dkpCurrency}.${config.dkpIssuer}; skipping.`);
    return;
  }

  console.log(`  Best ask est: ${best.priceXrpPerDkp.toFixed(8)} XRP/${config.dkpCurrency}`);

  const availableToSpend = balances.xrpBalance - config.minXrpBuffer;
  const canAfford = availableToSpend >= config.spendXrpPerOrder;
  const underDailyLimit = state.dailySpentXrp + config.spendXrpPerOrder <= config.maxDailySpendXrp;
  const underOpenLimit = buyOpen < config.maxOpenOrders;

  if (canAfford && underDailyLimit && underOpenLimit) {
    await placeBuy(client, best.priceXrpPerDkp, state);
  } else {
    const reasons = [];
    if (!canAfford) reasons.push('insufficient XRP after buffer');
    if (!underDailyLimit) reasons.push('daily spend cap reached');
    if (!underOpenLimit) reasons.push('max open buy orders reached');
    console.log(`  Buy skipped: ${reasons.join(', ')}`);
  }

  if (config.enableSells && sellOpen < config.maxOpenOrders) {
    await placeSell(client, best.priceXrpPerDkp, balances.dkpBalance);
  }
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('XRPL DKP bot starting...');
  console.log(`  Account: ${wallet.address}`);
  console.log(`  Network: ${config.wsUrl}`);
  console.log(`  Pair: XRP / ${config.dkpCurrency}.${config.dkpIssuer}`);
  console.log(`  Dry run: ${config.dryRun}`);

  const client = new xrpl.Client(config.wsUrl);
  const state = loadState();

  await client.connect();

  let shouldRun = true;
  process.on('SIGINT', () => {
    shouldRun = false;
  });
  process.on('SIGTERM', () => {
    shouldRun = false;
  });

  try {
    while (shouldRun) {
      const today = new Date().toISOString().slice(0, 10);
      if (state.day !== today) {
        state.day = today;
        state.dailySpentXrp = 0;
        console.log(`[${nowIso()}] New UTC day, daily spend reset.`);
      }

      try {
        await runLoop(client, state);
      } catch (error) {
        console.error(`[${nowIso()}] Loop error:`, error.message);
      }

      saveState(state);
      await sleep(config.loopSeconds * 1000);
    }
  } finally {
    saveState(state);
    await client.disconnect();
    console.log('XRPL DKP bot stopped.');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
