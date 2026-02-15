/**
 * Marketing Strategist Agent
 * Develops marketing and go-to-market strategies for products/companies
 */

import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";
import { consensusCall } from "../llm/multiLlmSystem.js";

export class MarketingStrategistAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "MarketingStrategist", ...opts });
  }

  async analyze({ userInput, targetMarket, traceId, iteration }) {
    this.info({ traceId, iteration, targetMarket }, "Marketing strategy analysis");

    try {
      // Build marketing strategy
      const strategy = await this.developMarketingStrategy(userInput, targetMarket);

      const notes = [
        `Target Market: ${strategy.target_market}`,
        `Key Value Proposition: ${strategy.value_proposition}`,
        `Primary Channels: ${strategy.primary_channels.join(", ")}`,
        `Estimated Timeline: ${strategy.launch_timeline}`
      ];

      if (strategy.key_messaging) {
        notes.push(`Key Messaging: ${strategy.key_messaging}`);
      }

      return makeAgentOutput({
        summary: "Marketing strategy developed",
        notes,
        risks: strategy.market_risks || []
      });
    } catch (err) {
      this.warn({ error: err.message }, "Marketing analysis failed");
      throw err;
    }
  }

  /**
   * Develop complete marketing strategy
   */
  async developMarketingStrategy(product, targetMarket = "general") {
    this.info({ targetMarket }, "Developing marketing strategy with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are an expert marketing strategist developing go-to-market strategies.",
        user: `Develop a marketing strategy for:\nProduct: ${product}\nTarget Market: ${targetMarket}`,
        schema: {
          name: "marketing_strategy",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["target_market", "value_proposition", "primary_channels", "launch_timeline"],
            properties: {
              target_market: { type: "string" },
              value_proposition: { type: "string" },
              key_messaging: { type: "string" },
              primary_channels: {
                type: "array",
                items: { type: "string" },
                description: "Marketing channels (social media, press, partnerships, etc)"
              },
              secondary_channels: {
                type: "array",
                items: { type: "string" }
              },
              launch_timeline: { type: "string" },
              competitive_advantages: {
                type: "array",
                items: { type: "string" }
              },
              market_risks: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        temperature: 0.2 // Some creativity for marketing ideas
      });

      this.info({
        channels: result.consensus.primary_channels.length,
        strategists: result.metadata.totalSuccessful
      }, "Marketing strategy complete");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Marketing strategy development failed");
      throw err;
    }
  }

  /**
   * Analyze competitive landscape
   */
  async analyzeCompetition(product, competitors = "") {
    this.info({ competitors }, "Analyzing competitive landscape");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are a competitive analyst identifying market positioning and differentiation.",
        user: `Analyze competitive landscape for:\nProduct: ${product}\n${competitors ? `Known Competitors: ${competitors}` : ""}`,
        schema: {
          name: "competitive_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["market_position", "competitive_advantages", "differentiation_strategy"],
            properties: {
              market_position: { type: "string" },
              competitive_advantages: {
                type: "array",
                items: { type: "string" }
              },
              differentiation_strategy: { type: "string" },
              competitive_threats: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        temperature: 0.2
      });

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Competitive analysis failed");
      throw err;
    }
  }

  /**
   * Create messaging and positioning
   */
  async createMessaging(product, features, targetAudience) {
    this.info({ targetAudience }, "Creating messaging and positioning");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are a messaging expert creating compelling product positioning.",
        user: `Create messaging for:\nProduct: ${product}\nFeatures: ${features}\nTarget Audience: ${targetAudience}`,
        schema: {
          name: "product_messaging",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["headline", "tagline", "elevator_pitch", "key_messages"],
            properties: {
              headline: { type: "string" },
              tagline: { type: "string" },
              elevator_pitch: { type: "string" },
              key_messages: {
                type: "array",
                items: { type: "string" }
              },
              social_media_copy: {
                type: "object",
                additionalProperties: { type: "string" }
              }
            }
          }
        },
        temperature: 0.3 // Higher for creative messaging
      });

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Messaging creation failed");
      throw err;
    }
  }

  /**
   * Plan marketing budget allocation
   */
  async planBudgetAllocation(totalBudget, productType, channels = "") {
    this.info({ channels }, "Planning budget allocation");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are a marketing budget expert allocating resources efficiently.",
        user: `Allocate a $${totalBudget} budget for a ${productType} product. ${channels ? `Available channels: ${channels}` : ""}`,
        schema: {
          name: "budget_allocation",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["allocations", "roi_expectations", "timeline"],
            properties: {
              allocations: {
                type: "object",
                additionalProperties: {
                  type: "object",
                  properties: {
                    amount: { type: "number" },
                    percentage: { type: "number" },
                    rationale: { type: "string" }
                  }
                }
              },
              roi_expectations: {
                type: "array",
                items: { type: "string" }
              },
              timeline: { type: "string" }
            }
          }
        },
        temperature: 0.15
      });

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Budget allocation failed");
      throw err;
    }
  }
}

export default MarketingStrategistAgent;
