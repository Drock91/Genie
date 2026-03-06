#!/usr/bin/env node
/**
 * Investment Intel CLI
 * Ask GENIE about any crypto/investment topic
 * 
 * Usage:
 *   node ask-intel.js "what's happening with XRP"
 *   node ask-intel.js "should I buy bitcoin"
 *   node ask-intel.js --sentiment "ethereum"
 *   node ask-intel.js --cramer "solana"
 */

import 'dotenv/config';
import { NewsAnalysisAgent } from './src/agents/newsAnalysisAgent.js';

const agent = new NewsAnalysisAgent({ logger: null }); // silent logger

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  GENIE INVESTMENT INTEL                                    ║
║  Unbiased • Contrarian-Aware • Anti-Hype                  ║
╚════════════════════════════════════════════════════════════╝

Usage:
  node ask-intel.js "your question"           Full investment analysis
  node ask-intel.js --sentiment "topic"       Quick sentiment check
  node ask-intel.js --cramer "asset"          Jim Cramer indicator check
  
Examples:
  node ask-intel.js "what's happening with XRP"
  node ask-intel.js "should I buy bitcoin now"
  node ask-intel.js "is ethereum a good investment"
  node ask-intel.js --sentiment "chainlink"
  node ask-intel.js --cramer "solana"
`);
    process.exit(0);
  }

  const mode = args[0].startsWith('--') ? args[0].slice(2) : 'ask';
  const query = args[0].startsWith('--') ? args.slice(1).join(' ') : args.join(' ');

  if (!query) {
    console.error('Please provide a query');
    process.exit(1);
  }

  console.log('\n🔍 Analyzing...\n');

  try {
    if (mode === 'sentiment') {
      const result = await agent.sentiment(query);
      if (!result.success) throw new Error(result.error);
      
      console.log('═'.repeat(60));
      console.log(`SENTIMENT: ${query.toUpperCase()}`);
      console.log('═'.repeat(60));
      console.log(`\n📊 OVERALL: ${result.sentiment.overall}`);
      console.log(`\n🛒 RETAIL: ${result.sentiment.retail_sentiment}`);
      console.log(`\n🏦 INSTITUTIONAL: ${result.sentiment.institutional_sentiment}`);
      console.log(`\n🔄 CONTRARIAN PLAY: ${result.sentiment.contrarian_play}`);
      console.log('\n⚠️  WARNING SIGNS:');
      result.sentiment.warning_signs.forEach((w, i) => console.log(`   ${i+1}. ${w}`));
      
    } else if (mode === 'cramer') {
      const result = await agent.cramerCheck(query);
      if (!result.success) throw new Error(result.error);
      
      console.log('═'.repeat(60));
      console.log(`JIM CRAMER CHECK: ${query.toUpperCase()}`);
      console.log('═'.repeat(60));
      console.log(`\n📺 HYPE LEVEL: ${result.cramerCheck.mainstream_hype_level}`);
      console.log('\n📢 PUMP SIGNALS:');
      result.cramerCheck.recent_pump_signals.forEach((s, i) => console.log(`   ${i+1}. ${s}`));
      console.log(`\n🕵️ INSIDER ACTIVITY: ${result.cramerCheck.insider_activity}`);
      console.log(`\n📈 RETAIL FOMO: ${result.cramerCheck.retail_fomo_indicators}`);
      console.log(`\n🔄 INVERSE SIGNAL: ${result.cramerCheck.inverse_signal}`);
      console.log(`\n✅ RECOMMENDATION: ${result.cramerCheck.recommendation}`);
      
    } else {
      const result = await agent.ask(query);
      if (!result.success) throw new Error(result.error);
      
      const intel = result.intel;
      console.log('═'.repeat(60));
      console.log('INVESTMENT INTEL');
      console.log('═'.repeat(60));
      console.log(`\n💡 QUICK TAKE:\n   ${intel.quick_take}`);
      console.log(`\n📈 BULL CASE:\n   ${intel.bull_case}`);
      console.log(`\n📉 BEAR CASE:\n   ${intel.bear_case}`);
      console.log(`\n🔄 CONTRARIAN SIGNAL:\n   ${intel.contrarian_signal}`);
      console.log(`\n📺 JIM CRAMER CHECK:\n   ${intel.jim_cramer_check}`);
      console.log(`\n🏦 SMART MONEY:\n   ${intel.smart_money}`);
      console.log('\n⛓️  CHAINS AFFECTED:');
      intel.chains_affected.forEach((c, i) => console.log(`   ${i+1}. ${c}`));
      console.log(`\n✅ ACTION:\n   ${intel.action}`);
      console.log(`\n⏰ TIME HORIZON: ${intel.time_horizon}`);
      console.log(`\n🎯 CONFIDENCE: ${intel.confidence}`);
      console.log('\n' + '─'.repeat(60));
      console.log('⚠️  ' + result.disclaimer);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
