/**
 * News Analysis Agent
 * 
 * Analyzes news from multiple sources to detect bias, propaganda, and suppressed narratives.
 * Specialized in tracking blockchain/crypto adoption signals across chains.
 * 
 * Key Capabilities:
 * - Multi-source news aggregation (crypto, mainstream, alternative, state media)
 * - Bias and propaganda detection using multi-LLM consensus
 * - Blockchain adoption tracking (XRPL, BTC, ETH, Chainlink, Solana, etc.)
 * - Institutional vs retail narrative analysis
 * - Geopolitical impact on crypto assessment
 * - PDF Investment Report Generation
 * 
 * @class NewsAnalysisAgent
 */

import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";
import { consensusCall } from "../llm/multiLlmSystem.js";
import { llmJson } from "../llm/openaiClient.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// Investment market sectors configuration
const MARKET_SECTORS = {
  defense: {
    name: "Defense & Aerospace",
    description: "Military contractors, defense technology, aerospace",
    tickers: [
      { symbol: "LMT", name: "Lockheed Martin", dividend: 2.8, thesis: "F-35, hypersonics, NATO expansion" },
      { symbol: "RTX", name: "Raytheon Technologies", dividend: 2.5, thesis: "Missiles, radar, air defense systems" },
      { symbol: "NOC", name: "Northrop Grumman", dividend: 1.6, thesis: "B-21 bomber, drones, satellites" },
      { symbol: "GD", name: "General Dynamics", dividend: 2.3, thesis: "Tanks, submarines, IT services" },
      { symbol: "LHX", name: "L3Harris Technologies", dividend: 2.1, thesis: "Communications, electronic warfare" },
      { symbol: "BA", name: "Boeing", dividend: 0, thesis: "Military aircraft, recovery play" }
    ],
    warCorrelation: 0.9,
    timing: "immediate",
    catalyst: "Geopolitical conflicts, increased defense budgets"
  },
  energy: {
    name: "Energy & Oil Majors",
    description: "Oil, natural gas, integrated energy companies",
    tickers: [
      { symbol: "XOM", name: "Exxon Mobil", dividend: 3.3, thesis: "Largest integrated, strong dividend" },
      { symbol: "CVX", name: "Chevron", dividend: 4.0, thesis: "Permian basin, LNG exports" },
      { symbol: "SHEL", name: "Shell", dividend: 3.8, thesis: "LNG leader, European energy security" },
      { symbol: "COP", name: "ConocoPhillips", dividend: 3.5, thesis: "Pure-play E&P, low cost" },
      { symbol: "OXY", name: "Occidental Petroleum", dividend: 1.2, thesis: "Buffett position, Permian" },
      { symbol: "DVN", name: "Devon Energy", dividend: 5.5, thesis: "Variable dividend, shale focus" }
    ],
    warCorrelation: 0.85,
    timing: "immediate",
    catalyst: "Supply disruptions, sanctions, demand surge"
  },
  uranium: {
    name: "Uranium & Nuclear",
    description: "Nuclear fuel, uranium miners, reactor builders",
    tickers: [
      { symbol: "CCJ", name: "Cameco", dividend: 0.3, thesis: "Largest Western producer, supply deficit" },
      { symbol: "URA", name: "Global X Uranium ETF", dividend: 0, thesis: "Diversified uranium exposure" },
      { symbol: "UUUU", name: "Energy Fuels", dividend: 0, thesis: "US domestic, rare earths exposure" },
      { symbol: "DNN", name: "Denison Mines", dividend: 0, thesis: "High-grade Canadian projects" },
      { symbol: "NXE", name: "NexGen Energy", dividend: 0, thesis: "Rook I project, tier-1 asset" }
    ],
    warCorrelation: 0.7,
    timing: "6-12 months",
    catalyst: "Nuclear renaissance, energy security, decarbonization"
  },
  commodities: {
    name: "Commodities & Precious Metals",
    description: "Gold, silver, copper, mining companies",
    tickers: [
      { symbol: "GLD", name: "SPDR Gold Trust", dividend: 0, thesis: "Direct gold exposure, inflation hedge" },
      { symbol: "GOLD", name: "Barrick Gold", dividend: 2.1, thesis: "Largest gold miner, low cost" },
      { symbol: "NEM", name: "Newmont", dividend: 3.8, thesis: "Diversified miner, copper exposure" },
      { symbol: "SLV", name: "iShares Silver Trust", dividend: 0, thesis: "Industrial + monetary metal" },
      { symbol: "FCX", name: "Freeport-McMoRan", dividend: 1.5, thesis: "Copper king, electrification play" }
    ],
    warCorrelation: 0.75,
    timing: "immediate to 6 months",
    catalyst: "Inflation, currency debasement, safe haven demand"
  },
  crypto: {
    name: "Cryptocurrency & Blockchain",
    description: "Digital assets, crypto equities, blockchain infrastructure",
    tickers: [
      { symbol: "XRP", name: "XRP/Ripple", dividend: 0, thesis: "Cross-border payments, CBDC infrastructure" },
      { symbol: "BTC", name: "Bitcoin", dividend: 0, thesis: "Digital gold, nation-state adoption" },
      { symbol: "ETH", name: "Ethereum", dividend: 3.5, thesis: "Smart contracts, DeFi, staking yield" },
      { symbol: "LINK", name: "Chainlink", dividend: 0, thesis: "Oracle monopoly, SWIFT integration" },
      { symbol: "SOL", name: "Solana", dividend: 0, thesis: "High throughput, payment rails" },
      { symbol: "MSTR", name: "MicroStrategy", dividend: 0, thesis: "Bitcoin treasury proxy" },
      { symbol: "COIN", name: "Coinbase", dividend: 0, thesis: "Crypto exchange, US regulatory moat" }
    ],
    warCorrelation: 0.5,
    timing: "variable",
    catalyst: "Institutional adoption, regulatory clarity, halving cycles"
  },
  dividendKings: {
    name: "Dividend Kings & Stability",
    description: "25+ years of dividend increases, defensive positions",
    tickers: [
      { symbol: "JNJ", name: "Johnson & Johnson", dividend: 3.0, thesis: "Healthcare diversified, recession-proof" },
      { symbol: "KO", name: "Coca-Cola", dividend: 3.1, thesis: "Global brand, pricing power" },
      { symbol: "PG", name: "Procter & Gamble", dividend: 2.5, thesis: "Consumer staples king" },
      { symbol: "MMM", name: "3M Company", dividend: 5.5, thesis: "Industrial conglomerate, turnaround" },
      { symbol: "PEP", name: "PepsiCo", dividend: 2.7, thesis: "Snacks + beverages, defensive" },
      { symbol: "CL", name: "Colgate-Palmolive", dividend: 2.3, thesis: "Global consumer staples" }
    ],
    warCorrelation: 0.3,
    timing: "always",
    catalyst: "Recession hedge, income stability, compounding"
  },
  veteranSpecific: {
    name: "SDVOSB Contract Opportunities",
    description: "Federal contracting sectors for service-disabled veteran-owned businesses",
    sectors: [
      { name: "IT/Cybersecurity", naics: "541512", avgContract: "$2M-$10M", timeline: "3-6 months" },
      { name: "Staffing/Recruiting", naics: "561320", avgContract: "$500K-$50M", timeline: "1-3 months" },
      { name: "Manufacturing", naics: "339999", avgContract: "$500K-$20M", timeline: "6-12 months" },
      { name: "Logistics/Supply", naics: "493110", avgContract: "$1M-$100M", timeline: "3-6 months" },
      { name: "Construction", naics: "236220", avgContract: "$5M-$50M", timeline: "6-12 months" },
      { name: "Management Consulting", naics: "541611", avgContract: "$100K-$5M", timeline: "1-3 months" }
    ],
    primeContractors: ["Lockheed Martin", "Raytheon", "Northrop Grumman", "General Dynamics", "BAE Systems", "Leidos", "Booz Allen Hamilton"],
    keyAdvantages: [
      "3% federal contract goal reserved for SDVOSBs",
      "Sole-source contracts up to $5M (no competition)",
      "Subcontracting requirements for prime contractors",
      "VA set-aside contracts exclusive to veterans"
    ]
  }
};

// Blockchain tracking configuration
const TRACKED_CHAINS = {
  xrpl: {
    name: "XRP Ledger",
    keywords: ["xrp", "xrpl", "ripple", "rlusd", "xumm", "xaman", "ripplenet", "odl", "on-demand liquidity"],
    competitors: ["swift", "visa", "mastercard", "bank settlements"],
    bullishSignals: ["cbdc", "central bank", "cross-border", "remittance", "institutional", "sec settlement", "regulation clarity"]
  },
  bitcoin: {
    name: "Bitcoin",
    keywords: ["btc", "bitcoin", "lightning", "satoshi", "ordinals", "btc etf", "microstrategy", "strategy"],
    competitors: ["gold", "treasury", "bonds"],
    bullishSignals: ["treasury", "reserve", "etf inflows", "institutional", "nation state", "legal tender"]
  },
  ethereum: {
    name: "Ethereum",
    keywords: ["eth", "ethereum", "vitalik", "eth2", "staking", "defi", "layer 2", "arbitrum", "optimism", "base"],
    competitors: ["solana", "cardano"],
    bullishSignals: ["enterprise", "tokenization", "rwa", "institutional defi", "blackrock"]
  },
  chainlink: {
    name: "Chainlink",
    keywords: ["link", "chainlink", "ccip", "oracle", "price feed", "vrf", "sergey nazarov"],
    competitors: ["band protocol", "api3"],
    bullishSignals: ["swift", "dtcc", "bank adoption", "enterprise", "cross-chain"]
  },
  solana: {
    name: "Solana",
    keywords: ["sol", "solana", "spl", "phantom", "jupiter", "marinade", "jito"],
    competitors: ["ethereum", "avalanche"],
    bullishSignals: ["visa", "shopify", "payment", "high throughput", "institutional"]
  }
};

// News source configuration with bias profiles
const NEWS_SOURCES = {
  crypto: {
    sources: [
      { name: "CoinDesk", url: "https://www.coindesk.com/", bias: 4, type: "industry" },
      { name: "Cointelegraph", url: "https://cointelegraph.com/", bias: 5, type: "industry" },
      { name: "Decrypt", url: "https://decrypt.co/", bias: 4, type: "industry" },
      { name: "The Block", url: "https://www.theblock.co/", bias: 3, type: "institutional" }
    ],
    typical_bias: "pro-crypto, industry promotion"
  },
  mainstream: {
    sources: [
      { name: "Reuters", url: "https://www.reuters.com/", bias: 5, type: "establishment" },
      { name: "Bloomberg", url: "https://www.bloomberg.com/", bias: 6, type: "financial establishment" },
      { name: "CNBC", url: "https://www.cnbc.com/", bias: 6, type: "financial media" },
      { name: "Wall Street Journal", url: "https://www.wsj.com/", bias: 5, type: "financial establishment" }
    ],
    typical_bias: "establishment, banking-friendly, cautious on crypto"
  },
  alternative: {
    sources: [
      { name: "ZeroHedge", url: "https://zerohedge.com/", bias: 8, type: "contrarian" },
      { name: "Seeking Alpha", url: "https://seekingalpha.com/", bias: 5, type: "investor" }
    ],
    typical_bias: "anti-establishment, doom-focused, gold/commodity friendly"
  },
  stateMedia: {
    sources: [
      { name: "RT (Russia)", url: "https://www.rt.com/", bias: 9, type: "state propaganda" },
      { name: "CGTN (China)", url: "https://www.cgtn.com/", bias: 9, type: "state propaganda" }
    ],
    typical_bias: "anti-Western, geopolitical narrative"
  },
  xrplSpecific: {
    sources: [
      { name: "XRP Community Blog", url: "https://xrpcommunity.blog/", bias: 7, type: "community" },
      { name: "Ripple Insights", url: "https://ripple.com/insights/", bias: 8, type: "corporate" }
    ],
    typical_bias: "pro-XRPL, community-focused"
  }
};

export class NewsAnalysisAgent extends BaseAgent {
  constructor(opts = {}) {
    super({ name: "NewsAnalysis", ...opts });
    this.trackedChains = TRACKED_CHAINS;
    this.newsSources = NEWS_SOURCES;
  }

  /**
   * Main analysis method - analyzes news for bias, propaganda, and blockchain signals
   */
  async analyzeNews({ headlines, rawContent = null, traceId = null }) {
    this.info({ traceId }, "Analyzing news for bias and blockchain signals");

    try {
      const result = await llmJson({
        model: "gpt-4o",
        system: `You are an expert geopolitical and crypto news analyst. Your job is to:
1. Detect bias, propaganda, and suppressed narratives across news sources
2. Identify which blockchains (especially XRPL, Bitcoin, Ethereum, Chainlink, Solana) are being favored by institutions
3. Track adoption signals vs FUD (fear, uncertainty, doubt)
4. Distinguish between retail narratives and institutional positioning
5. Identify who benefits from each narrative

Blockchain adoption signals to watch:
- XRPL: Central bank partnerships, CBDC pilots, cross-border payments, Ripple partnerships, SEC case outcomes
- Bitcoin: Treasury reserves, ETF flows, nation-state adoption, institutional accumulation
- Ethereum: Enterprise tokenization, RWA platforms, Layer 2 adoption, DeFi institutional interest
- Chainlink: SWIFT integration, DTCC partnerships, enterprise oracle adoption
- Solana: Payment integrations, high-throughput use cases, institutional products

Always be direct and don't hedge. Identify the real story behind the headlines.`,
        user: `Analyze these news headlines/content for bias, propaganda, and blockchain adoption signals:

${headlines}

${rawContent ? `\nAdditional context:\n${rawContent}` : ""}

Provide analysis with:
1. suppressed_narratives - What's NOT being reported or downplayed
2. blockchain_signals - Which chains are gaining institutional traction (rate 1-10)
3. who_benefits - Who profits from each major narrative
4. bias_assessment - Rate each source type (crypto/mainstream/alt/state) for bias
5. crypto_vs_banks - The real dynamic between crypto adoption and banking establishment
6. xrpl_specific - Any XRPL/Ripple specific signals (partnerships, regulations, adoption)
7. actionable_insights - What this means for someone tracking crypto adoption
8. reality_check - What's actually happening vs the propaganda framing`,
        schema: {
          name: "news_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["suppressed_narratives", "blockchain_signals", "who_benefits", "bias_assessment", "crypto_vs_banks", "xrpl_specific", "actionable_insights", "reality_check"],
            properties: {
              suppressed_narratives: { type: "array", items: { type: "string" } },
              blockchain_signals: { type: "string" },
              who_benefits: { type: "array", items: { type: "string" } },
              bias_assessment: { type: "string" },
              crypto_vs_banks: { type: "string" },
              xrpl_specific: { type: "string" },
              actionable_insights: { type: "array", items: { type: "string" } },
              reality_check: { type: "string" }
            }
          }
        },
        temperature: 0.3
      });

      this.info({ traceId }, "News analysis complete");
      return {
        success: true,
        analysis: result,
        trackedChains: Object.keys(this.trackedChains),
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      this.logger?.error({ error: err.message, traceId }, "News analysis failed");
      return { success: false, error: err.message };
    }
  }

  /**
   * Track specific blockchain adoption signals across headlines
   */
  async trackBlockchainAdoption({ headlines, focusChains = ["xrpl", "bitcoin", "ethereum", "chainlink"] }) {
    this.info({}, "Tracking blockchain adoption signals");

    const chainConfig = focusChains.map(chain => ({
      chain,
      config: this.trackedChains[chain] || { name: chain, keywords: [chain], bullishSignals: [] }
    }));

    try {
      const result = await llmJson({
        model: "gpt-4o",
        system: `You are a blockchain adoption analyst. Track institutional and regulatory signals for specific blockchains.
Focus especially on: ${focusChains.join(", ")}

For each chain, identify:
- Institutional adoption signals (banks, enterprises, governments)
- Regulatory developments (positive or negative)
- Technical partnerships and integrations
- Competitive positioning against other chains
- Central bank / CBDC implications`,
        user: `Analyze these headlines for blockchain adoption signals:

${headlines}

Track adoption for: ${JSON.stringify(chainConfig.map(c => c.config.name))}

Rate each chain's momentum (1-10) based on:
- institutional_momentum: Are banks/enterprises adopting?
- regulatory_momentum: Are regulations becoming favorable?
- partnership_signals: New integrations announced?
- cbdc_relevance: Connection to central bank digital currencies?
- competitive_position: Gaining or losing vs competitors?`,
        schema: {
          name: "blockchain_adoption",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["chain_scores", "top_signals", "xrpl_focus", "institutional_winners", "regulatory_outlook"],
            properties: {
              chain_scores: { type: "string" },
              top_signals: { type: "array", items: { type: "string" } },
              xrpl_focus: { type: "string" },
              institutional_winners: { type: "array", items: { type: "string" } },
              regulatory_outlook: { type: "string" }
            }
          }
        },
        temperature: 0.2
      });

      return { success: true, adoption: result };
    } catch (err) {
      this.logger?.error({ error: err.message }, "Blockchain adoption tracking failed");
      return { success: false, error: err.message };
    }
  }

  /**
   * Compare narratives across source types
   */
  async compareNarratives({ topic, cryptoHeadlines, mainstreamHeadlines, altHeadlines }) {
    this.info({}, "Comparing narratives across source types");

    try {
      const result = await llmJson({
        model: "gpt-4o",
        system: "You analyze how different media types frame the same topic. Identify manipulation, suppression, and who benefits.",
        user: `Compare how different sources cover: ${topic}

CRYPTO MEDIA:
${cryptoHeadlines}

MAINSTREAM MEDIA:
${mainstreamHeadlines}

ALTERNATIVE MEDIA:
${altHeadlines}

Analyze:
1. narrative_divergence - Where do sources disagree most?
2. suppressed_by_mainstream - What crypto media reports that mainstream ignores
3. suppressed_by_crypto - What mainstream reports that crypto media downplays
4. truth_likely - What's probably actually happening
5. follow_the_money - Who benefits from each framing`,
        schema: {
          name: "narrative_comparison",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["narrative_divergence", "suppressed_by_mainstream", "suppressed_by_crypto", "truth_likely", "follow_the_money"],
            properties: {
              narrative_divergence: { type: "array", items: { type: "string" } },
              suppressed_by_mainstream: { type: "array", items: { type: "string" } },
              suppressed_by_crypto: { type: "array", items: { type: "string" } },
              truth_likely: { type: "string" },
              follow_the_money: { type: "array", items: { type: "string" } }
            }
          }
        },
        temperature: 0.3
      });

      return { success: true, comparison: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Generate daily crypto intelligence briefing
   */
  async generateDailyBriefing({ headlines, date = new Date().toISOString().split("T")[0] }) {
    this.info({}, `Generating daily briefing for ${date}`);

    try {
      const result = await llmJson({
        model: "gpt-4o",
        system: `You are a crypto intelligence analyst creating a daily briefing for someone tracking institutional blockchain adoption.
Focus on actionable intelligence, not noise. Prioritize:
1. XRPL/Ripple developments (highest priority)
2. Bitcoin institutional moves
3. Ethereum enterprise adoption
4. Chainlink partnerships
5. Regulatory shifts
6. Geopolitical impacts on crypto`,
        user: `Create a daily intelligence briefing from these headlines (${date}):

${headlines}

Structure the briefing as:
- executive_summary: 2-3 sentence overview
- xrpl_intel: XRPL-specific developments (highest priority)
- institutional_moves: What banks/enterprises are doing
- regulatory_watch: Regulation changes to track
- chain_momentum: Which chains are winning/losing
- suppressed_stories: What media is hiding
- action_items: What to do based on this intel`,
        schema: {
          name: "daily_briefing",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["executive_summary", "xrpl_intel", "institutional_moves", "regulatory_watch", "chain_momentum", "suppressed_stories", "action_items"],
            properties: {
              executive_summary: { type: "string" },
              xrpl_intel: { type: "string" },
              institutional_moves: { type: "array", items: { type: "string" } },
              regulatory_watch: { type: "array", items: { type: "string" } },
              chain_momentum: { type: "string" },
              suppressed_stories: { type: "array", items: { type: "string" } },
              action_items: { type: "array", items: { type: "string" } }
            }
          }
        },
        temperature: 0.2
      });

      return {
        success: true,
        briefing: result,
        date,
        generatedAt: new Date().toISOString()
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Detect FUD vs legitimate concerns
   */
  async detectFUD({ headline, context = "" }) {
    try {
      const result = await llmJson({
        model: "gpt-4o",
        system: "You analyze crypto news to distinguish legitimate concerns from coordinated FUD (fear, uncertainty, doubt) campaigns.",
        user: `Analyze this headline for FUD:

"${headline}"
${context ? `\nContext: ${context}` : ""}

Determine:
- is_fud: true/false
- fud_indicators: Signs of coordinated FUD
- legitimate_concerns: Any real issues to consider
- likely_source: Who might be pushing this narrative
- affected_chains: Which blockchains does this target`,
        schema: {
          name: "fud_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["is_fud", "fud_indicators", "legitimate_concerns", "likely_source", "affected_chains"],
            properties: {
              is_fud: { type: "boolean" },
              fud_indicators: { type: "array", items: { type: "string" } },
              legitimate_concerns: { type: "array", items: { type: "string" } },
              likely_source: { type: "string" },
              affected_chains: { type: "array", items: { type: "string" } }
            }
          }
        },
        temperature: 0.2
      });

      return { success: true, fudAnalysis: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * ASK - Simple query interface for investment intelligence
   * The main method most users will use - just ask a question, get unbiased intel
   * 
   * @param {string} query - What you want to know (e.g., "what's happening with XRP", "should I buy ETH")
   * @param {Object} options - Optional config
   * @returns {Promise<Object>} Investment intelligence response
   */
  async ask(query, options = {}) {
    this.info({}, `Investment intel query: ${query}`);

    try {
      const result = await llmJson({
        model: "gpt-4o",
        system: `You are an unbiased investment intelligence analyst. Your job is to cut through propaganda, hype, and noise to provide actionable investment insights.

CORE PRINCIPLES:
1. NO HYPE - If something sounds too good, it probably is
2. CONTRARIAN AWARENESS - When everyone is bullish, look for bear signals and vice versa
3. JIM CRAMER INDICATOR - Track what mainstream pundits say and consider the opposite
4. FOLLOW THE MONEY - Who benefits from each narrative?
5. INSTITUTIONAL VS RETAIL - What are smart money actually doing (not saying)?
6. TIME HORIZONS - Distinguish short-term noise from long-term trends

BLOCKCHAIN EXPERTISE:
- XRPL: Cross-border payments, CBDC infrastructure, Ripple partnerships, ODL volumes
- Bitcoin: Store of value thesis, ETF flows, nation-state adoption, halving cycles
- Ethereum: DeFi, NFTs, Layer 2 scaling, enterprise tokenization
- Chainlink: Oracle monopoly, SWIFT integration, CCIP cross-chain
- Solana: High throughput, retail activity, VC backing concerns

ANTI-PATTERNS TO FLAG:
- Media pump before insider dump
- "This time is different" narratives
- Retail FOMO signals (Google trends, social volume)
- Regulatory FUD timed with accumulation
- Celebrity endorsements

Be direct. No hedging. Give actual investment thesis, not "it depends."`,
        user: `QUERY: ${query}

Analyze this from an investment perspective and provide:
1. quick_take - 2-3 sentence direct answer
2. bull_case - Why it could go up (with probability estimate)
3. bear_case - Why it could go down (with probability estimate)  
4. contrarian_signal - What does the opposite of consensus suggest?
5. jim_cramer_check - What are mainstream pundits saying? (and why to be skeptical)
6. smart_money - What are institutions actually doing?
7. chains_affected - Which blockchains benefit/suffer
8. action - Specific actionable recommendation (buy/sell/hold/wait with reasoning)
9. time_horizon - When this thesis plays out
10. confidence - Your confidence level 1-10 with reasoning`,
        schema: {
          name: "investment_intel",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["quick_take", "bull_case", "bear_case", "contrarian_signal", "jim_cramer_check", "smart_money", "chains_affected", "action", "time_horizon", "confidence"],
            properties: {
              quick_take: { type: "string" },
              bull_case: { type: "string" },
              bear_case: { type: "string" },
              contrarian_signal: { type: "string" },
              jim_cramer_check: { type: "string" },
              smart_money: { type: "string" },
              chains_affected: { type: "array", items: { type: "string" } },
              action: { type: "string" },
              time_horizon: { type: "string" },
              confidence: { type: "string" }
            }
          }
        },
        temperature: 0.3
      });

      return {
        success: true,
        query,
        intel: result,
        timestamp: new Date().toISOString(),
        disclaimer: "Not financial advice. Do your own research."
      };
    } catch (err) {
      this.logger?.error({ error: err.message }, "Investment intel query failed");
      return { success: false, error: err.message };
    }
  }

  /**
   * Quick sentiment check on a topic
   */
  async sentiment(topic) {
    try {
      const result = await llmJson({
        model: "gpt-4o",
        system: "You analyze market sentiment across multiple sources. Be contrarian-aware.",
        user: `Quick sentiment analysis for: ${topic}

Provide:
- overall: bullish/bearish/neutral with percentage
- retail_sentiment: What retail is saying
- institutional_sentiment: What institutions are doing
- contrarian_play: What the opposite bet would be
- warning_signs: Red flags to watch`,
        schema: {
          name: "sentiment",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["overall", "retail_sentiment", "institutional_sentiment", "contrarian_play", "warning_signs"],
            properties: {
              overall: { type: "string" },
              retail_sentiment: { type: "string" },
              institutional_sentiment: { type: "string" },
              contrarian_play: { type: "string" },
              warning_signs: { type: "array", items: { type: "string" } }
            }
          }
        },
        temperature: 0.2
      });
      return { success: true, sentiment: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Check if something is being "Jim Cramered" (hyped by mainstream before dump)
   */
  async cramerCheck(asset) {
    try {
      const result = await llmJson({
        model: "gpt-4o",
        system: `You track the "Jim Cramer indicator" - when mainstream financial media pumps something, it often precedes a dump. 
This isn't about Jim Cramer specifically, but the pattern of retail-targeted hype preceding insider exits.
Also track: CNBC pump, Bloomberg coverage increases, celebrity endorsements, "to the moon" social spikes.`,
        user: `Cramer Check for: ${asset}

Analyze:
- mainstream_hype_level: 1-10 (10 = extremely hyped)
- recent_pump_signals: Any recent mainstream recommendations to buy?
- insider_activity: Are insiders selling while recommending?
- retail_fomo_indicators: Google trends, social volume, etc.
- inverse_signal: What does betting against the hype suggest?
- recommendation: Based on contrarian analysis`,
        schema: {
          name: "cramer_check",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["mainstream_hype_level", "recent_pump_signals", "insider_activity", "retail_fomo_indicators", "inverse_signal", "recommendation"],
            properties: {
              mainstream_hype_level: { type: "string" },
              recent_pump_signals: { type: "array", items: { type: "string" } },
              insider_activity: { type: "string" },
              retail_fomo_indicators: { type: "string" },
              inverse_signal: { type: "string" },
              recommendation: { type: "string" }
            }
          }
        },
        temperature: 0.2
      });
      return { success: true, cramerCheck: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Get configured sources
   */
  getSources() {
    return this.newsSources;
  }

  /**
   * Get tracked blockchain configurations
   */
  getTrackedChains() {
    return this.trackedChains;
  }

  /**
   * Get market sectors configuration
   */
  getMarketSectors() {
    return MARKET_SECTORS;
  }

  /**
   * Generate comprehensive PDF investment report
   * @param {Object} options - Report configuration
   * @param {string} options.outputPath - Where to save the PDF
   * @param {boolean} options.includeVeteran - Include SDVOSB section
   * @param {string} options.focus - Focus area (all, war, income, crypto)
   */
  async generateInvestmentReport(options = {}) {
    const outputDir = options.outputPath || path.join(process.cwd(), "reports");
    const includeVeteran = options.includeVeteran !== false;
    const focus = options.focus || "all";
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `investment-report-${dateStr}.pdf`;
    const filepath = path.join(outputDir, filename);

    this.info({}, `Generating investment report: ${filepath}`);

    // Get AI analysis for each sector
    const sectorAnalyses = {};
    const sectorsToAnalyze = focus === "all" 
      ? Object.keys(MARKET_SECTORS).filter(k => k !== "veteranSpecific")
      : focus === "war" 
        ? ["defense", "energy", "uranium", "commodities"]
        : focus === "income"
          ? ["dividendKings", "energy", "commodities"]
          : focus === "crypto"
            ? ["crypto"]
            : Object.keys(MARKET_SECTORS).filter(k => k !== "veteranSpecific");

    for (const sectorKey of sectorsToAnalyze) {
      const sector = MARKET_SECTORS[sectorKey];
      if (!sector.tickers) continue;
      
      this.info({}, `Analyzing ${sector.name}...`);
      
      try {
        const analysis = await llmJson({
          model: "gpt-4o",
          system: `You are an expert investment analyst specializing in ${sector.name}. 
Provide specific, actionable investment recommendations with entry prices, target prices, and timing.
Be direct and specific. Use current market conditions and geopolitical factors.
Date: ${new Date().toLocaleDateString()}`,
          user: `Analyze the ${sector.name} sector for investment opportunities.

Tickers to analyze: ${sector.tickers.map(t => t.symbol).join(", ")}

For each ticker provide:
1. current_rating: BUY / HOLD / SELL / WAIT
2. entry_price: Suggested entry price or "market" if buy now
3. target_price: 12-month price target
4. stop_loss: Suggested stop loss level
5. timing: When to enter (immediate, pullback, Q2, etc.)
6. thesis: 1-2 sentence investment thesis
7. risk_level: 1-10 (10 being highest risk)
8. dividend_safety: For dividend stocks, rate safety 1-10

Also provide:
- sector_outlook: Overall sector rating 1-10
- best_pick: Top pick in sector with reasoning
- avoid: Which to avoid and why
- catalyst_timeline: Key upcoming catalysts with dates

Consider current factors:
- War/geopolitical tensions
- Inflation environment  
- Interest rate trajectory
- Supply chain dynamics`,
          schema: {
            name: "sector_analysis",
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["sector_outlook", "best_pick", "avoid", "catalyst_timeline", "ticker_analyses"],
              properties: {
                sector_outlook: { type: "string" },
                best_pick: { type: "string" },
                avoid: { type: "string" },
                catalyst_timeline: { type: "string" },
                ticker_analyses: { type: "string" }
              }
            }
          },
          temperature: 0.3
        });
        sectorAnalyses[sectorKey] = analysis;
      } catch (err) {
        this.logger?.error({ error: err.message }, `Failed to analyze ${sector.name}`);
        sectorAnalyses[sectorKey] = { error: err.message };
      }
    }

    // Create PDF document
    const doc = new PDFDocument({ 
      size: "LETTER",
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    
    const writeStream = fs.createWriteStream(filepath);
    doc.pipe(writeStream);

    // TITLE PAGE
    doc.fontSize(28).font("Helvetica-Bold")
       .text("INVESTMENT INTELLIGENCE REPORT", { align: "center" });
    doc.moveDown();
    doc.fontSize(16).font("Helvetica")
       .text(new Date().toLocaleDateString("en-US", { 
         weekday: "long", year: "numeric", month: "long", day: "numeric" 
       }), { align: "center" });
    doc.moveDown(2);
    
    doc.fontSize(12).font("Helvetica-Oblique")
       .text("War Profit & Income Generation Strategy", { align: "center" });
    doc.moveDown();
    doc.text("Generated by GENIE AI Investment Analysis System", { align: "center" });
    
    doc.moveDown(4);
    
    // DISCLAIMER
    doc.fontSize(8).font("Helvetica")
       .text("DISCLAIMER: This report is for informational purposes only and does not constitute financial advice. " +
             "Past performance is not indicative of future results. Always conduct your own research and consult " +
             "with a qualified financial advisor before making investment decisions.", { align: "center" });

    // EXECUTIVE SUMMARY PAGE
    doc.addPage();
    doc.fontSize(18).font("Helvetica-Bold")
       .text("EXECUTIVE SUMMARY", { underline: true });
    doc.moveDown();
    
    doc.fontSize(11).font("Helvetica");
    doc.text("Market Environment:", { continued: false });
    doc.font("Helvetica").text(
      "• Geopolitical tensions elevated - favoring defense, energy, commodities\n" +
      "• Inflation remains sticky - hard assets and dividend stocks preferred\n" +
      "• Interest rates at multi-decade highs - quality over speculation\n" +
      "• War catalysts creating asymmetric opportunities"
    );
    
    doc.moveDown();
    doc.font("Helvetica-Bold").text("Portfolio Allocation Recommendation:");
    doc.font("Helvetica").text(
      "• Defense & Aerospace: 25%\n" +
      "• Energy (Oil & Gas): 20%\n" +
      "• Commodities (Gold/Uranium): 15%\n" +
      "• Cryptocurrency: 15%\n" +
      "• Dividend Kings (Stability): 15%\n" +
      "• Cash (Dry Powder): 10%"
    );

    // SECTOR PAGES
    for (const sectorKey of sectorsToAnalyze) {
      const sector = MARKET_SECTORS[sectorKey];
      if (!sector.tickers) continue;
      
      doc.addPage();
      
      // Sector header
      doc.fontSize(16).font("Helvetica-Bold")
         .text(sector.name.toUpperCase(), { underline: true });
      doc.fontSize(10).font("Helvetica-Oblique")
         .text(sector.description);
      doc.moveDown();
      
      // War correlation indicator
      const warBar = "█".repeat(Math.round(sector.warCorrelation * 10));
      const emptyBar = "░".repeat(10 - Math.round(sector.warCorrelation * 10));
      doc.fontSize(9).font("Helvetica")
         .text(`War Correlation: ${warBar}${emptyBar} (${(sector.warCorrelation * 100).toFixed(0)}%)`);
      doc.text(`Timing: ${sector.timing.toUpperCase()}`);
      doc.text(`Key Catalyst: ${sector.catalyst}`);
      doc.moveDown();
      
      // AI Analysis
      const analysis = sectorAnalyses[sectorKey];
      if (analysis && !analysis.error) {
        doc.fontSize(10).font("Helvetica-Bold").text("AI ANALYSIS:");
        doc.font("Helvetica");
        doc.text(`Sector Outlook: ${analysis.sector_outlook}`);
        doc.text(`Best Pick: ${analysis.best_pick}`);
        doc.text(`Avoid: ${analysis.avoid}`);
        doc.text(`Catalysts: ${analysis.catalyst_timeline}`);
        doc.moveDown();
      }
      
      // Ticker table header
      doc.fontSize(10).font("Helvetica-Bold");
      const tableTop = doc.y;
      doc.text("TICKER", 50, tableTop, { width: 50 });
      doc.text("COMPANY", 100, tableTop, { width: 120 });
      doc.text("DIV%", 220, tableTop, { width: 40 });
      doc.text("RATING", 260, tableTop, { width: 50 });
      doc.text("THESIS", 310, tableTop, { width: 250 });
      
      doc.moveTo(50, doc.y + 2).lineTo(560, doc.y + 2).stroke();
      doc.moveDown(0.5);
      
      // Ticker rows
      doc.fontSize(9).font("Helvetica");
      for (const ticker of sector.tickers) {
        const y = doc.y;
        doc.text(ticker.symbol, 50, y, { width: 50 });
        doc.text(ticker.name, 100, y, { width: 120 });
        doc.text(ticker.dividend > 0 ? `${ticker.dividend}%` : "-", 220, y, { width: 40 });
        
        // Parse AI analysis for specific ticker rating
        let rating = "ANALYZE";
        if (analysis?.ticker_analyses) {
          const tickerAnalysis = analysis.ticker_analyses.toLowerCase();
          if (tickerAnalysis.includes(ticker.symbol.toLowerCase())) {
            if (tickerAnalysis.includes("buy")) rating = "BUY";
            else if (tickerAnalysis.includes("hold")) rating = "HOLD";
            else if (tickerAnalysis.includes("sell")) rating = "SELL";
          }
        }
        doc.text(rating, 260, y, { width: 50 });
        doc.text(ticker.thesis, 310, y, { width: 250 });
        doc.moveDown(0.8);
      }
      
      // Detailed ticker analysis from AI
      if (analysis?.ticker_analyses) {
        doc.moveDown();
        doc.fontSize(9).font("Helvetica-Bold").text("DETAILED ANALYSIS:");
        doc.font("Helvetica").text(analysis.ticker_analyses);
      }
    }
    
    // VETERAN SECTION
    if (includeVeteran) {
      doc.addPage();
      doc.fontSize(16).font("Helvetica-Bold")
         .text("SDVOSB FEDERAL CONTRACTING OPPORTUNITIES", { underline: true });
      doc.fontSize(10).font("Helvetica-Oblique")
         .text("Service-Disabled Veteran-Owned Small Business");
      doc.moveDown();
      
      const vetSector = MARKET_SECTORS.veteranSpecific;
      
      doc.fontSize(11).font("Helvetica-Bold").text("KEY ADVANTAGES:");
      doc.font("Helvetica");
      for (const adv of vetSector.keyAdvantages) {
        doc.text(`• ${adv}`);
      }
      doc.moveDown();
      
      doc.font("Helvetica-Bold").text("HIGH-PROFIT SECTORS:");
      doc.moveDown(0.5);
      
      // Sector table
      doc.fontSize(9).font("Helvetica-Bold");
      const vetTableTop = doc.y;
      doc.text("SECTOR", 50, vetTableTop, { width: 120 });
      doc.text("NAICS", 170, vetTableTop, { width: 60 });
      doc.text("AVG CONTRACT", 230, vetTableTop, { width: 100 });
      doc.text("TIMELINE", 330, vetTableTop, { width: 80 });
      
      doc.moveTo(50, doc.y + 2).lineTo(420, doc.y + 2).stroke();
      doc.moveDown(0.5);
      
      doc.font("Helvetica");
      for (const s of vetSector.sectors) {
        const y = doc.y;
        doc.text(s.name, 50, y, { width: 120 });
        doc.text(s.naics, 170, y, { width: 60 });
        doc.text(s.avgContract, 230, y, { width: 100 });
        doc.text(s.timeline, 330, y, { width: 80 });
        doc.moveDown(0.6);
      }
      
      doc.moveDown();
      doc.font("Helvetica-Bold").text("PRIME CONTRACTORS TO PARTNER WITH:");
      doc.font("Helvetica").text(vetSector.primeContractors.join(", "));
      
      doc.moveDown();
      doc.font("Helvetica-Bold").text("IMMEDIATE ACTION STEPS:");
      doc.font("Helvetica");
      doc.text("1. Register on SAM.gov (System for Award Management) - FREE");
      doc.text("2. Get VA verification at VetCert.SBA.gov");
      doc.text("3. Apply for GSA Schedule contract");
      doc.text("4. Contact prime contractor SDVOSB liaison officers");
      doc.text("5. Monitor beta.SAM.gov for set-aside opportunities");
    }
    
    // ACTION PLAN PAGE
    doc.addPage();
    doc.fontSize(16).font("Helvetica-Bold")
       .text("30-60-90 DAY ACTION PLAN", { underline: true });
    doc.moveDown();
    
    doc.fontSize(11).font("Helvetica-Bold").text("IMMEDIATE (30 DAYS):");
    doc.font("Helvetica");
    doc.text("□ Open brokerage account if needed (Fidelity/Schwab recommended)");
    doc.text("□ Establish positions in top defense picks (25% allocation)");
    doc.text("□ Add core energy positions (20% allocation)");
    doc.text("□ Set up crypto exchange account (Coinbase/Kraken)");
    doc.text("□ Register on SAM.gov for federal contracting");
    doc.moveDown();
    
    doc.font("Helvetica-Bold").text("SHORT-TERM (60 DAYS):");
    doc.font("Helvetica");
    doc.text("□ Complete SDVOSB certification");
    doc.text("□ Add gold/uranium positions (15% allocation)");
    doc.text("□ Build XRP and ETH positions");
    doc.text("□ Research GSA Schedule application");
    doc.text("□ Contact 3 prime contractors for subcontracting");
    doc.moveDown();
    
    doc.font("Helvetica-Bold").text("MEDIUM-TERM (90 DAYS):");
    doc.font("Helvetica");
    doc.text("□ Dividend king positions established (15% allocation)");
    doc.text("□ First federal contract bid submitted");
    doc.text("□ Portfolio rebalancing based on results");
    doc.text("□ Tax-advantaged account optimization");
    doc.moveDown(2);
    
    // Final disclaimer
    doc.fontSize(8).font("Helvetica-Oblique")
       .text("This report was generated by GENIE AI Investment Analysis System on " + 
             new Date().toISOString() + ". Information may be outdated. Verify all data independently.", 
             { align: "center" });

    // Finalize PDF
    doc.end();
    
    // Wait for write to complete
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    this.info({}, `Report generated: ${filepath}`);
    
    return {
      success: true,
      filepath,
      filename,
      sectors: sectorsToAnalyze,
      analyses: sectorAnalyses,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Build method for orchestration compatibility
   */
  async build({ plan, traceId, iteration, userInput }) {
    this.info({ traceId, iteration }, "NewsAnalysisAgent build called");

    // Check if this is a news analysis request
    const input = (userInput || "").toLowerCase();
    const isNewsRequest = input.includes("news") || input.includes("headlines") || input.includes("crypto") || input.includes("analysis");

    if (!isNewsRequest) {
      return makeAgentOutput({
        summary: "No news analysis work items",
        notes: []
      });
    }

    // Perform analysis on any content in the plan
    const headlines = plan?.context?.headlines || userInput;
    const result = await this.analyzeNews({ headlines, traceId });

    if (result.success) {
      return makeAgentOutput({
        summary: "News analysis complete",
        notes: [
          `Tracked chains: ${result.trackedChains.join(", ")}`,
          `Analysis timestamp: ${result.timestamp}`
        ],
        patches: [{
          type: "file",
          path: `reports/news-analysis-${new Date().toISOString().split("T")[0]}.json`,
          content: JSON.stringify(result.analysis, null, 2)
        }]
      });
    } else {
      return makeAgentOutput({
        summary: `News analysis failed: ${result.error}`,
        notes: ["Analysis could not be completed"]
      });
    }
  }
}

export default NewsAnalysisAgent;
