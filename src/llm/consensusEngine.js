/**
 * Consensus Engine
 * Advanced consensus mechanisms for merging multiple LLM outputs
 * Provides voting, scoring, ranking, and committee-based consensus
 */

export class ConsensusEngine {
  /**
   * Simple voting consensus
   * Returns response that most LLMs agreed on
   */
  static voting(responses) {
    const votes = new Map();
    
    responses.forEach(response => {
      const key = JSON.stringify(response);
      votes.set(key, (votes.get(key) || 0) + 1);
    });

    let maxVotes = 0;
    let winner = responses[0];

    votes.forEach((count, key) => {
      if (count > maxVotes) {
        maxVotes = count;
        winner = JSON.parse(key);
      }
    });

    return {
      consensus: winner,
      agreementPercentage: (maxVotes / responses.length) * 100,
      totalVotes: maxVotes,
      totalResponses: responses.length
    };
  }

  /**
   * Weighted consensus with quality scoring
   * Ranks LLMs by quality and weight their votes
   */
  static weighted(responses, weights) {
    if (responses.length !== weights.length) {
      throw new Error("Responses and weights must have same length");
    }

    const scoreMap = new Map();
    let totalWeight = 0;

    responses.forEach((response, idx) => {
      const key = JSON.stringify(response);
      const weight = weights[idx] || 1;
      scoreMap.set(key, (scoreMap.get(key) || 0) + weight);
      totalWeight += weight;
    });

    let maxScore = 0;
    let winner = responses[0];

    scoreMap.forEach((score, key) => {
      if (score > maxScore) {
        maxScore = score;
        winner = JSON.parse(key);
      }
    });

    return {
      consensus: winner,
      weightedScore: maxScore,
      normalizedScore: (maxScore / totalWeight) * 100,
      totalWeight
    };
  }

  /**
   * Hybrid consensus with confidence scoring
   * Combines agreement percentage with response confidence
   */
  static hybrid(responses, confidenceScores = null) {
    const votes = new Map();
    
    responses.forEach((response, idx) => {
      const key = JSON.stringify(response);
      const confidence = confidenceScores?.[idx] || 1;
      votes.set(key, (votes.get(key) || 0) + confidence);
    });

    let maxVotes = 0;
    let winner = responses[0];

    votes.forEach((count, key) => {
      if (count > maxVotes) {
        maxVotes = count;
        winner = JSON.parse(key);
      }
    });

    return {
      consensus: winner,
      confidenceScore: maxVotes / responses.length,
      totalResponses: responses.length,
      method: "hybrid"
    };
  }

  /**
   * Committee consensus
   * Groups similar responses and scores each group
   */
  static committee(responses, similarityThreshold = 0.8) {
    if (responses.length === 0) return { consensus: null, groups: [] };

    const groups = [];
    const processed = new Set();

    responses.forEach((response, idx) => {
      if (processed.has(idx)) return;

      const group = [{ response, index: idx }];
      processed.add(idx);

      // Find similar responses
      for (let j = idx + 1; j < responses.length; j++) {
        if (!processed.has(j)) {
          const similarity = ConsensusEngine._calculateSimilarity(response, responses[j]);
          if (similarity >= similarityThreshold) {
            group.push({ response: responses[j], index: j });
            processed.add(j);
          }
        }
      }

      groups.push(group);
    });

    // Return largest group as consensus
    let largestGroup = groups[0];
    groups.forEach(group => {
      if (group.length > largestGroup.length) {
        largestGroup = group;
      }
    });

    return {
      consensus: largestGroup[0].response,
      groups: groups.map(g => ({
        size: g.length,
        percentage: (g.length / responses.length) * 100,
        members: g.map(m => m.index)
      })),
      consensusGroupSize: largestGroup.length,
      totalGroups: groups.length
    };
  }

  /**
   * Ranking consensus
   * Scores responses based on multiple criteria
   */
  static ranking(responses, criteria = {}) {
    const {
      completeness = 0.3,
      clarity = 0.3,
      specificity = 0.2,
      innovation = 0.2
    } = criteria;

    const scores = responses.map((response, idx) => {
      let score = 0;

      // Completeness: longer responses score higher
      const responseStr = JSON.stringify(response);
      score += (responseStr.length / 10000) * completeness;

      // Clarity: penalize if response contains error indicators
      const hasErrors = responseStr.toLowerCase().includes("error") ||
                       responseStr.toLowerCase().includes("unknown");
      score += (hasErrors ? 0.2 : 0.3) * clarity;

      // Specificity: reward concrete values over vague responses
      const hasNumbers = /\d+/.test(responseStr);
      score += (hasNumbers ? 0.2 : 0.1) * specificity;

      // Innovation: responses different from others score higher
      const uniqueness = 1 / (responses.filter(r =>
        JSON.stringify(r) === JSON.stringify(response)
      ).length);
      score += uniqueness * innovation;

      return { response, score, index: idx };
    });

    scores.sort((a, b) => b.score - a.score);

    return {
      consensus: scores[0].response,
      ranking: scores.map((s, rank) => ({
        rank: rank + 1,
        score: s.score,
        index: s.index
      })),
      topResponse: scores[0].response
    };
  }

  /**
   * Augmented consensus with explanations
   * Includes reasoning for consensus choice
   */
  static augmented(responses, llmResponses = null) {
    const basicVoting = ConsensusEngine.voting(responses);
    const committee = ConsensusEngine.committee(responses);

    return {
      consensus: basicVoting.consensus,
      voting: basicVoting,
      committee: committee,
      reasoning: `Consensus reached via voting (${basicVoting.agreementPercentage.toFixed(1)}% agreement) ` +
                `with ${committee.totalGroups} distinct viewpoint${committee.totalGroups > 1 ? 's' : ''}. ` +
                `Largest agreement group: ${committee.consensusGroupSize}/${responses.length} responses.`,
      originalResponses: llmResponses || responses
    };
  }

  /**
   * Calculate similarity between two responses
   */
  static _calculateSimilarity(resp1, resp2) {
    const str1 = JSON.stringify(resp1);
    const str2 = JSON.stringify(resp2);

    if (str1 === str2) return 1;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1;

    const editDistance = ConsensusEngine._levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  static _levenshteinDistance(s1, s2) {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }
}

export default ConsensusEngine;
