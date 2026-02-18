/**
 * Social Media Agent
 * Generates social media content, strategies, and campaign plans
 * Supports: Twitter/X, LinkedIn, Instagram, Facebook, TikTok, Reddit
 */

import { BaseAgent } from "./baseAgent.js";
import { consensusCall } from "../llm/multiLlmSystem.js";

export class SocialMediaAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "SocialMedia", ...opts });
  }

  async build({ plan, traceId, iteration, context, userInput }) {
    this.info({ traceId, iteration }, "Generating social media content");

    try {
      const result = await consensusCall({
        profile: "balanced", // Use balanced for now, creative profile optional
        system: `You are an expert social media strategist creating engaging content.
Generate platform-specific posts, captions, hashtags, and campaign strategies.
Focus on: engagement, virality, brand voice, and clear calls-to-action.
Output structured JSON with platform recommendations and sample posts.`,
        user: `Create social media content for: ${userInput}

Project: ${context.projectName}
Requirements: ${JSON.stringify(plan.workItems, null, 2)}

Generate:
1. Platform recommendations (Twitter, LinkedIn, Instagram, etc)
2. Overall strategy and positioning
3. 5-8 sample posts with platform-specific formatting
4. Hashtag strategy
5. Content calendar (optional)
6. Image/video suggestions for each post`,
        schema: {
          name: "social_media_content",
          schema: {
            type: "object",
            required: ["platforms", "strategy", "sample_posts"],
            properties: {
              platforms: {
                type: "array",
                items: { type: "string" },
                description: "Recommended platforms (Twitter, LinkedIn, Instagram, Facebook, TikTok, Reddit)"
              },
              target_audience: { type: "string" },
              brand_voice: { type: "string" },
              strategy: { 
                type: "string",
                description: "Overall social media strategy and positioning"
              },
              sample_posts: {
                type: "array",
                items: {
                  type: "object",
                  required: ["platform", "content"],
                  properties: {
                    platform: { type: "string" },
                    content: { type: "string" },
                    hashtags: { 
                      type: "array", 
                      items: { type: "string" } 
                    },
                    timing: { 
                      type: "string",
                      description: "Best time to post (e.g., 'Weekday mornings', 'Tuesday 9am EST')"
                    },
                    image_suggestion: { type: "string" },
                    cta: { 
                      type: "string",
                      description: "Call to action"
                    },
                    engagement_tactics: {
                      type: "array",
                      items: { type: "string" },
                      description: "Tactics to boost engagement (polls, questions, etc)"
                    }
                  }
                }
              },
              content_calendar: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    week: { type: "string" },
                    day: { type: "string" },
                    platform: { type: "string" },
                    post_type: { type: "string" },
                    topic: { type: "string" }
                  }
                }
              },
              hashtag_strategy: { type: "string" },
              kpis: {
                type: "array",
                items: { type: "string" },
                description: "Key performance indicators to track"
              }
            }
          }
        },
        temperature: 0.7 // Higher temperature for creative social media content
      });

      // Format as patches (create social media strategy document)
      const content = result.consensus;
      
      let strategyDoc = `# Social Media Strategy - ${context.projectName}\n\n`;
      
      // Platform recommendations
      strategyDoc += `## 🎯 Recommended Platforms\n`;
      content.platforms.forEach(platform => {
        strategyDoc += `- **${platform}**\n`;
      });
      strategyDoc += `\n`;

      // Audience and voice
      if (content.target_audience) {
        strategyDoc += `## 👥 Target Audience\n${content.target_audience}\n\n`;
      }
      if (content.brand_voice) {
        strategyDoc += `## 🎨 Brand Voice\n${content.brand_voice}\n\n`;
      }

      // Strategy
      strategyDoc += `## 📋 Strategy\n${content.strategy}\n\n`;

      // Hashtag strategy
      if (content.hashtag_strategy) {
        strategyDoc += `## #️⃣ Hashtag Strategy\n${content.hashtag_strategy}\n\n`;
      }

      // Sample posts
      strategyDoc += `## ✍️ Sample Posts\n\n`;
      content.sample_posts.forEach((post, i) => {
        strategyDoc += `### ${i + 1}. ${post.platform}\n\n`;
        strategyDoc += `**Content:**\n\`\`\`\n${post.content}\n\`\`\`\n\n`;
        
        if (post.hashtags && post.hashtags.length > 0) {
          strategyDoc += `**Hashtags:** ${post.hashtags.join(' ')}\n\n`;
        }
        
        if (post.timing) {
          strategyDoc += `**Best Time to Post:** ${post.timing}\n\n`;
        }
        
        if (post.cta) {
          strategyDoc += `**Call to Action:** ${post.cta}\n\n`;
        }
        
        if (post.image_suggestion) {
          strategyDoc += `**Visual Suggestion:** ${post.image_suggestion}\n\n`;
        }
        
        if (post.engagement_tactics && post.engagement_tactics.length > 0) {
          strategyDoc += `**Engagement Tactics:** ${post.engagement_tactics.join(', ')}\n\n`;
        }
        
        strategyDoc += `---\n\n`;
      });

      // Content calendar
      if (content.content_calendar && content.content_calendar.length > 0) {
        strategyDoc += `## 📅 Content Calendar\n\n`;
        strategyDoc += `| Week | Day | Platform | Post Type | Topic |\n`;
        strategyDoc += `|------|-----|----------|-----------|-------|\n`;
        content.content_calendar.forEach(item => {
          strategyDoc += `| ${item.week || 'N/A'} | ${item.day || 'N/A'} | ${item.platform} | ${item.post_type} | ${item.topic} |\n`;
        });
        strategyDoc += `\n`;
      }

      // KPIs
      if (content.kpis && content.kpis.length > 0) {
        strategyDoc += `## 📊 Key Performance Indicators (KPIs)\n`;
        content.kpis.forEach(kpi => {
          strategyDoc += `- ${kpi}\n`;
        });
        strategyDoc += `\n`;
      }

      // Create patches
      const patches = [{
        diff: `*** Add File: social_media_strategy.md\n${strategyDoc}`
      }];

      // Create individual post files for easy copy-paste
      content.sample_posts.forEach((post, i) => {
        const postFileName = `${post.platform.toLowerCase().replace(/[^a-z0-9]/g, '_')}_post_${i + 1}.txt`;
        let postContent = `${post.content}\n\n`;
        if (post.hashtags && post.hashtags.length > 0) {
          postContent += `${post.hashtags.join(' ')}\n`;
        }
        
        patches.push({
          diff: `*** Add File: social_posts/${postFileName}\n${postContent}`
        });
      });

      this.info({ 
        traceId, 
        iteration, 
        platforms: content.platforms.length,
        posts: content.sample_posts.length,
        files: patches.length
      }, "Social media content generated");

      return {
        summary: `Generated social media strategy for ${content.platforms.join(', ')} with ${content.sample_posts.length} sample posts`,
        patches,
        notes: [
          `Platforms: ${content.platforms.join(', ')}`,
          `Posts: ${content.sample_posts.length}`,
          `Files: 1 strategy + ${content.sample_posts.length} individual posts`
        ],
        metadata: result.metadata
      };

    } catch (err) {
      this.error({ traceId, error: err.message }, "Social media generation failed");
      throw err;
    }
  }

  /**
   * Generate quick social posts without full strategy (faster)
   */
  async quickPosts({ topic, platforms = ['Twitter', 'LinkedIn'], count = 3, traceId }) {
    this.info({ traceId, topic, platforms, count }, "Generating quick social posts");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are a social media expert creating engaging posts. Be concise, punchy, and platform-appropriate.",
        user: `Create ${count} social media posts about: ${topic}\n\nPlatforms: ${platforms.join(', ')}\n\nMake them engaging, shareable, and include relevant hashtags.`,
        schema: {
          name: "quick_posts",
          schema: {
            type: "object",
            required: ["posts"],
            properties: {
              posts: {
                type: "array",
                items: {
                  type: "object",
                  required: ["platform", "content"],
                  properties: {
                    platform: { type: "string" },
                    content: { type: "string" },
                    hashtags: { type: "array", items: { type: "string" } }
                  }
                }
              }
            }
          }
        },
        temperature: 0.8
      });

      return result.consensus.posts;

    } catch (err) {
      this.error({ traceId, error: err.message }, "Quick posts generation failed");
      throw err;
    }
  }
}
