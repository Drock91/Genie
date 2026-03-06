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
 * 
 * @class NewsAnalysisAgent
 */

import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";
import { consensusCall } from "../llm/multiLlmSystem.js";
import { llmJson } from "../llm/openaiClient.js";

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
