import { ContentMetadata } from "./runEffortScore";

/**
 * Calculates a Proof-of-Human score from social metadata and fraud signals.
 * This is the core of EVE's "Proof of Human" recipe.
 *
 * @param metadata The collected content metadata from runEffortScore (potentially Arkham/Plaid).
 * @returns An object containing the score (0–100), fraud tags, and reasons.
 */
export async function calculateEffortScore(metadata: ContentMetadata): Promise<{
  score: number;
  tags: string[];
  reasons: string[];
}> {
  let score = 100;
  const tags: string[] = [];
  const reasons: string[] = [];

  // --- RAW METRICS ---
  const views = metadata.viewCount || 0;
  const comments = metadata.commentCount || 0;
  const followers = metadata.followerCount || 0;
  const engagementRate = metadata.engagementRate || 0;

  // --- Proof-of-Human Logic (Behavioral & Content Analysis) ---

  // a. Engagement Rate vs. Follower Count
  if (followers > 1000) {
    const expectedMinEngagement = 0.01;
    if (engagementRate < expectedMinEngagement) {
      const penalty = Math.min(20, (expectedMinEngagement - engagementRate) * 500);
      score -= penalty;
      tags.push("disproportionate_engagement");
      reasons.push(`Engagement rate (${(engagementRate * 100).toFixed(2)}%) is significantly low for follower count.`);
    }
  } else if (followers < 50 && views > 10_000 && comments < 5) {
    score -= 30;
    tags.push("synthetic_reach_inflation");
    reasons.push("Content shows high views with very few followers and comments, indicating synthetic reach.");
  }

  // b. Comment Quality & Quantity
  if (comments < 3 && views > 5_000) {
    score -= 10;
    tags.push("comment_gap");
    reasons.push("High views with disproportionately few comments.");
  }

  // c. Content Description/Title Analysis (for AI-generated text)
  if (metadata.description) {
    try {
      const isAIDescription = await analyzeTextForAI(metadata.description);
      if (isAIDescription) {
        score -= 25;
        tags.push("ai_generated_description");
        reasons.push("Description shows patterns of AI-generated content.");
      }
    } catch (llmError) {
      console.warn("Could not analyze description for AI:", llmError);
      reasons.push("Description AI analysis failed (check LLM API).");
    }
  } else {
    score -= 5;
    tags.push("missing_description");
    reasons.push("Content is missing a description.");
  }

  // d. Time-based Growth Anomalies
  if (metadata.uploadDate) {
    const uploadTime = new Date(metadata.uploadDate).getTime();
    const ageInHours = (Date.now() - uploadTime) / (1000 * 60 * 60);

    if (ageInHours < 72 && views > 500_000 && engagementRate < 0.005) {
      score -= 20;
      tags.push("rapid_synthetic_growth");
      reasons.push("Unnaturally rapid view growth with extremely low engagement within 72 hours.");
    }
  }

  // Arkham Intelligence Signals (Web3/DeFi Niche)
  if (metadata.arkhamData) {
    if (metadata.arkhamData.blockchainSignals?.includes('sybil_activity_detected')) {
      score -= 40;
      tags.push("web3_sybil_attack");
      reasons.push("Arkham Intelligence detected Sybil activity associated with this content/wallet.");
    }
    if (metadata.arkhamData.blockchainSignals?.includes('wash_trading_pattern')) {
      score -= 35;
      tags.push("web3_wash_trading");
      reasons.push("Arkham Intelligence flagged potential wash trading patterns.");
    }
    if (metadata.arkhamData.blockchainSignals?.includes('known_scam_address_interaction')) {
      score -= 50;
      tags.push("web3_scam_interaction");
      reasons.push("Arkham Intelligence detected interaction with a known scam address.");
    }
  }

  // Plaid Signals (Financial Identity/Fraud)
  if (metadata.plaidData) {
    if (metadata.plaidData.plaidRiskScore && metadata.plaidData.plaidRiskScore > 0.75) {
      score -= 30;
      tags.push("plaid_high_risk");
      reasons.push(`Plaid indicated high financial risk (${(metadata.plaidData.plaidRiskScore * 100).toFixed(0)}%).`);
    }
    if (metadata.plaidData.plaidIdentityMismatch === true) {
      score -= 50;
      tags.push("plaid_identity_mismatch");
      reasons.push("Plaid detected a critical identity mismatch for the associated financial account.");
    }
    if (metadata.plaidData.plaidBeaconSignals?.includes('known_fraudster')) {
      score -= 60;
      tags.push("plaid_known_fraudster");
      reasons.push("Plaid Beacon identified the associated identity as a known fraudster.");
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  if (score < 70) {
    tags.push("low_effort_or_fraud");
  } else {
    tags.push("human_effort_detected");
  }

  return {
    score,
    tags,
    reasons: reasons.length > 0 ? reasons : ["No specific red flags detected."]
  };
}

// --- Conceptual LLM API Call for AI Text Detection ---
async function analyzeTextForAI(text: string): Promise<boolean> {
  // Placeholder for Gemini or other LLM API call
  return false;
}