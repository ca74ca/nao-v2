// utils/effortRecipe.ts

// Define the expected input structure for your scoring logic
interface ContentMetadata {
  platform: string;
  url: string;
  followerCount?: number;
  engagementRate?: number;
  commentCount?: number;
  viewCount?: number;
  uploadDate?: string;
  description?: string;
  decodosRawData?: any;
  arkhamData?: any; // Data from Arkham Intelligence
  plaidData?: any;  // Data from Plaid
}

interface EffortScoreResult {
  score: number;
  reasons: string[];
}

/**
 * Calculates the "human effort" score based on various metadata and signals.
 * This is the core of EVE's "Proof of Human" recipe.
 *
 * @param metadata The collected content metadata from runEffortScore (including Decodos data, potentially Arkham/Plaid).
 * @returns An EffortScoreResult containing the score and reasons for it.
 */
export function calculateEffortScore(metadata: ContentMetadata): EffortScoreResult {
  let score = 100; // Start with a perfect score
  const reasons: string[] = [];

  // --- 1. Evaluate Decodos Authenticity Signals ---
  // Decodos's raw data or specific signals from `decodosRawData` can be parsed here.
  // Assuming Decodos provides a general authenticity metric or specific fraud indicators.

  // Example: If Decodos provides a direct authenticity score (e.g., 0-100)
  if (metadata.decodosRawData && typeof metadata.decodosRawData.authenticity_score === 'number') {
    const decodosAuthScore = metadata.decodosRawData.authenticity_score;
    // Adjust overall score based on Decodos's assessment
    score = Math.min(score, decodosAuthScore); // Take the lower of current score and Decodos's
    if (decodosAuthScore < 80) { // Example threshold for Decodos's direct score
      reasons.push(`Decodos flagged low authenticity (${decodosAuthScore}%).`);
    }
  }

  // Example: Specific fraud indicators from Decodos
  if (metadata.decodosRawData && Array.isArray(metadata.decodosRawData.fraud_indicators)) {
    metadata.decodosRawData.fraud_indicators.forEach((indicator: string) => {
      reasons.push(`Decodos signal: ${indicator}`);
      score -= 10; // Penalize for each specific fraud indicator (adjust weight)
    });
  }


  // --- 2. Implement your "Proof of Human" Logic (Behavioral & Content Analysis) ---
  // This is where your proprietary algorithms come in.
  // Example rules based on typical bot/low-effort patterns:

  // Low Engagement Rate relative to Follower Count (common for purchased followers)
  if (metadata.followerCount && metadata.engagementRate) {
    const expectedEngagement = metadata.followerCount * 0.02; // Example: 2% engagement
    if (metadata.engagementRate < (expectedEngagement / metadata.followerCount * 100) * 0.5) { // If engagement is less than 50% of expected
      score -= 15;
      reasons.push('Unusually low engagement rate for follower count (potential fake engagement).');
    }
  }

  // Very high comment/view count with very recent upload date (could be bot-boosted)
  if (metadata.viewCount && metadata.uploadDate) {
    const uploadDateTime = new Date(metadata.uploadDate).getTime();
    const now = Date.now();
    const ageInHours = (now - uploadDateTime) / (1000 * 60 * 60);

    if (ageInHours < 24 && metadata.viewCount > 100000 && (metadata.commentCount || 0) < 100) {
      score -= 20;
      reasons.push('High view count very soon after upload with disproportionately low comments (potential bot views).');
    }
  }

  // Content analysis (conceptual - would involve another AI model or NLP)
  if (metadata.description && metadata.description.length < 20 && metadata.platform === 'youtube') {
    score -= 5;
    reasons.push('Very short description for YouTube content (could indicate low effort).');
  }
  // Add more sophisticated NLP/AI checks here for AI-generated text patterns.
  // This is where you might integrate with a separate LLM for text analysis.

  // --- 3. Integrate Arkham Intelligence Data (for Web3/DeFi niche) ---
  if (metadata.arkhamData) {
    if (metadata.arkhamData.blockchainSignals?.includes('sybil_activity_detected')) {
      score -= 30; // High penalty for confirmed Sybil activity
      reasons.push('Arkham Intelligence detected Sybil activity associated with this content/wallet.');
    }
    if (metadata.arkhamData.blockchainSignals?.includes('suspicious_tx_pattern')) {
      score -= 20;
      reasons.push('Arkham Intelligence flagged suspicious transaction patterns.');
    }
    // Add more Arkham-specific checks
  }

  // --- 4. Integrate Plaid Data (for financial identity/fraud signals) ---
  if (metadata.plaidData) {
    if (metadata.plaidData.plaidRiskScore && metadata.plaidData.plaidRiskScore > 0.7) { // Example risk score threshold
      score -= 25;
      reasons.push(`Plaid indicated high financial risk (${metadata.plaidData.plaidRiskScore}).`);
    }
    if (metadata.plaidData.plaidIdentityMatch === false) {
      score -= 40; // Severe penalty for identity mismatch
      reasons.push('Plaid detected identity mismatch for associated financial account.');
    }
    // Add more Plaid-specific checks (e.g., Beacon signals)
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  return {
    score: Math.round(score), // Round to nearest whole number
    reasons: reasons.length > 0 ? reasons : ['No specific red flags detected.']
  };
}
