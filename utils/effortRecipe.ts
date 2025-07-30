// utils/effortRecipe.ts

import { ContentMetadata } from "./runEffortScore"; // Ensure ContentMetadata is imported

/**
 * Calculates a Proof-of-Human score from social metadata and fraud signals.
 * This is the core of EVE's "Proof of Human" recipe.
 *
 * @param metadata The collected content metadata from runEffortScore (including Decodos data, potentially Arkham/Plaid).
 * @returns An object containing the score (0–100), fraud tags, and reasons.
 */
export async function calculateEffortScore(metadata: ContentMetadata): Promise<{ // ADDED 'async' HERE
  score: number;
  tags: string[];
  reasons: string[];
}> {
  let score = 100; // Start with a perfect score and deduct for issues
  const tags: string[] = [];
  const reasons: string[] = [];

  // --- RAW METRICS (for reference and potential future use in more complex models) ---
  const views = metadata.viewCount || 0;
  const comments = metadata.commentCount || 0;
  const followers = metadata.followerCount || 0;
  const engagementRate = metadata.engagementRate || 0; // Assuming this is a percentage (e.g., 0.05 for 5%)

  // --- 1. Decodos-Derived Signals ---
  // Leverage the raw data from Decodos to find more nuanced signals.
  // You'll need to inspect `metadata.decodosRawData` structure carefully.

  // Example: If Decodos provides an internal authenticity score or specific bot flags
  if (metadata.decodosRawData?.metrics?.authenticity_score && metadata.decodosRawData.metrics.authenticity_score < 70) {
    score -= 15; // Moderate penalty
    tags.push("decodos_low_authenticity");
    reasons.push(`Decodos flagged low content authenticity (${metadata.decodosRawData.metrics.authenticity_score}%).`);
  }
  if (metadata.decodosRawData?.metrics?.bot_activity_flag === true) {
    score -= 25; // Significant penalty
    tags.push("decodos_bot_flag");
    reasons.push("Decodos detected explicit bot activity.");
  }

  // --- 2. Core Proof-of-Human Logic (Behavioral & Content Analysis) ---

  // a. Engagement Rate vs. Follower Count (Sophisticated Check)
  if (followers > 1000) { // Only apply this check for accounts with a decent follower base
    const expectedMinEngagement = 0.01; // Example: Minimum 1% engagement for established accounts
    if (engagementRate < expectedMinEngagement) {
      const penalty = Math.min(20, (expectedMinEngagement - engagementRate) * 500); // Scale penalty
      score -= penalty;
      tags.push("disproportionate_engagement");
      reasons.push(`Engagement rate (${(engagementRate * 100).toFixed(2)}%) is significantly low for follower count.`);
    }
  } else if (followers < 50 && views > 10_000 && comments < 5) {
      // Very high views/low followers/low comments for small accounts
      score -= 30; // High penalty for suspicious inflation
      tags.push("synthetic_reach_inflation");
      reasons.push("Content shows high views with very few followers and comments, indicating synthetic reach.");
  }


  // b. Comment Quality & Quantity (beyond just count)
  if (comments < 3 && views > 5_000) {
    score -= 10;
    tags.push("comment_gap");
    reasons.push("High views with disproportionately few comments.");
  }
  // Future: Analyze actual comment text for generic or bot-like patterns using an LLM
  // if (metadata.decodosRawData?.comments_text) { // Assuming Decodos provides comment text
  //   const aiCommentScore = await analyzeCommentsForAI(metadata.decodosRawData.comments_text);
  //   if (aiCommentScore < 0.3) { // Example: low score means high AI probability
  //     score -= 20;
  //     tags.push("ai_comments_detected");
  //     reasons.push("Comments show patterns of AI or low-effort generation.");
  //   }
  // }


  // c. Content Description/Title Analysis (for AI-generated text)
  if (metadata.description) {
    // This is a conceptual call to an LLM API (like Gemini) for AI text detection
    // You would implement this LLM call as a separate utility.
    try {
      const isAIDescription = await analyzeTextForAI(metadata.description);
      if (isAIDescription) {
        score -= 25; // Significant penalty for AI-generated content
        tags.push("ai_generated_description");
        reasons.push("Description shows patterns of AI-generated content.");
      }
    } catch (llmError) {
      console.warn("Could not analyze description for AI:", llmError);
      reasons.push("Description AI analysis failed (check LLM API).");
      // Don't penalize score if analysis fails, but note it.
    }
  } else {
    score -= 5;
    tags.push("missing_description");
    reasons.push("Content is missing a description.");
  }


  // d. Time-based Growth Anomalies (requires historical data, but can infer from uploadDate/views)
  // If you later store historical data for a creator, you can compare current growth to their baseline.
  // For now, a simple check:
  if (metadata.uploadDate) {
    const uploadTime = new Date(metadata.uploadDate).getTime();
    const ageInHours = (Date.now() - uploadTime) / (1000 * 60 * 60);

    if (ageInHours < 72 && views > 500_000 && engagementRate < 0.005) { // Very high views in short time, very low engagement
      score -= 20;
      tags.push("rapid_synthetic_growth");
      reasons.push("Unnaturally rapid view growth with extremely low engagement within 72 hours.");
    }
  }


  // --- 3. Arkham Intelligence Signals (for Web3/DeFi Niche) ---
  if (metadata.arkhamData) {
    if (metadata.arkhamData.blockchainSignals?.includes('sybil_activity_detected')) {
      score -= 40; // High impact fraud
      tags.push("web3_sybil_attack");
      reasons.push("Arkham Intelligence detected Sybil activity associated with this content/wallet.");
    }
    if (metadata.arkhamData.blockchainSignals?.includes('wash_trading_pattern')) {
      score -= 35;
      tags.push("web3_wash_trading");
      reasons.push("Arkham Intelligence flagged potential wash trading patterns.");
    }
    if (metadata.arkhamData.blockchainSignals?.includes('known_scam_address_interaction')) {
      score -= 50; // Very high impact
      tags.push("web3_scam_interaction");
      reasons.push("Arkham Intelligence detected interaction with a known scam address.");
    }
  }


  // --- 4. Plaid Signals (for Financial Identity/Fraud) ---
  if (metadata.plaidData) {
    if (metadata.plaidData.plaidRiskScore && metadata.plaidData.plaidRiskScore > 0.75) {
      score -= 30; // Significant financial risk
      tags.push("plaid_high_risk");
      reasons.push(`Plaid indicated high financial risk (${(metadata.plaidData.plaidRiskScore * 100).toFixed(0)}%).`);
    }
    if (metadata.plaidData.plaidIdentityMismatch === true) {
      score -= 50; // Critical identity fraud
      tags.push("plaid_identity_mismatch");
      reasons.push("Plaid detected a critical identity mismatch for the associated financial account.");
    }
    if (metadata.plaidData.plaidBeaconSignals?.includes('known_fraudster')) {
      score -= 60; // Severe fraudster identification
      tags.push("plaid_known_fraudster");
      reasons.push("Plaid Beacon identified the associated identity as a known fraudster.");
    }
  }

  // --- FINALIZE SCORE ---
  score = Math.max(0, Math.min(100, Math.round(score))); // Clamp between 0 and 100

  // Add a general tag if score is low
  if (score < 70) {
    tags.push("low_effort_or_fraud");
  } else {
    tags.push("human_effort_detected");
  }

  return {
    score,
    tags,
    reasons: reasons.length > 0 ? reasons : ["No specific red flags detected."] // Ensure reasons is never empty
  };
}

// --- Conceptual LLM API Call for AI Text Detection ---
// You will need to implement this function to call a real LLM (e.g., Gemini API).
// This is a placeholder to show how it would be integrated.
async function analyzeTextForAI(text: string): Promise<boolean> {
  // In a real implementation, you would make a fetch call to the Gemini API
  // or another AI content detection service here.
  // The prompt would ask the LLM to analyze the text for patterns indicative of AI generation.

  // Example prompt:
  const prompt = `Analyze the following text for patterns indicative of AI generation. Respond with "true" if it strongly appears AI-generated, and "false" if it appears human-written. Do not include any other text.\n\nText: "${text}"`;

  try {
    // Implement exponential backoff for API calls
    const retryFetch = async (url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> => {
      try {
        const response = await fetch(url, options);
        if (!response.ok && response.status === 429 && retries > 0) {
          console.warn(`Rate limit hit. Retrying in ${delay / 1000}s...`);
          await new Promise(res => setTimeout(res, delay));
          return retryFetch(url, options, retries - 1, delay * 2);
        }
        return response;
      } catch (error) {
        if (retries > 0) {
          console.warn(`Fetch failed. Retrying in ${delay / 1000}s...`, error);
          await new Promise(res => setTimeout(res, delay));
          return retryFetch(url, options, retries - 1, delay * 2);
        }
        throw error;
      }
    };

    const apiKey = ""; // Canvas will automatically provide this at runtime if empty
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    type ChatMessage = { role: string; parts: { text: string }[] };
    let chatHistory: ChatMessage[] = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });

    const payload = {
      contents: chatHistory,
      generationConfig: {
        responseMimeType: "text/plain", // Request plain text response
      }
    };

    const response = await retryFetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
      const llmResponseText = result.candidates[0].content.parts[0].text.trim().toLowerCase();
      // Parse the LLM's response to a boolean
      return llmResponseText === 'true';
    } else {
      console.error("LLM response structure unexpected:", result);
      return false; // Default to false if response is malformed
    }
  } catch (error) {
    console.error("Error calling LLM for AI text analysis:", error);
    throw new Error("LLM analysis failed.");
  }
}

// --- Placeholder for Comment AI Analysis ---
// You would implement this similarly to analyzeTextForAI, but for multiple comments.
/*
async function analyzeCommentsForAI(commentsText: string[]): Promise<number> {
  // Logic to send comments to an LLM for analysis of AI patterns.
  // Could return an an average score or a count of suspicious comments.
  console.log("Analyzing comments for AI patterns (conceptual):", commentsText);
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
  return Math.random(); // Mock score
}
*/
