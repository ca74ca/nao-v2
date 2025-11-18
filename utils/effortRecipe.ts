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
      const penalty = Math.min(
        20,
        (expectedMinEngagement - engagementRate) * 500
      );
      score -= penalty;
      tags.push("disproportionate_engagement");
      reasons.push(
        `Engagement rate (${(engagementRate * 100).toFixed(
          2
        )}%) is significantly low for follower count.`
      );
    }
  } else if (followers < 50 && views > 10_000 && comments < 5) {
    score -= 30;
    tags.push("synthetic_reach_inflation");
    reasons.push(
      "Content shows high views with very few followers and comments, indicating synthetic reach."
    );
  }

  // b. Comment Quality & Quantity
  if (comments < 3 && views > 5_000) {
    score -= 10;
    tags.push("comment_gap");
    reasons.push("High views with disproportionately few comments.");
  }

  // c. Content Description/Title Analysis (for AI-generated text via LLM)
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
      reasons.push(
        "Unnaturally rapid view growth with extremely low engagement within 72 hours."
      );
    }
  }

  // Arkham Intelligence Signals (Web3/DeFi Niche)
  if (metadata.arkhamData) {
    if (metadata.arkhamData.blockchainSignals?.includes("sybil_activity_detected")) {
      score -= 40;
      tags.push("web3_sybil_attack");
      reasons.push(
        "Arkham Intelligence detected Sybil activity associated with this content/wallet."
      );
    }
    if (metadata.arkhamData.blockchainSignals?.includes("wash_trading_pattern")) {
      score -= 35;
      tags.push("web3_wash_trading");
      reasons.push(
        "Arkham Intelligence flagged potential wash trading patterns."
      );
    }
    if (metadata.arkhamData.blockchainSignals?.includes("known_scam_address_interaction")) {
      score -= 50;
      tags.push("web3_scam_interaction");
      reasons.push(
        "Arkham Intelligence detected interaction with a known scam address."
      );
    }
  }

  // Plaid Signals (Financial Identity/Fraud)
  if (metadata.plaidData) {
    if (metadata.plaidData.plaidRiskScore && metadata.plaidData.plaidRiskScore > 0.75) {
      score -= 30;
      tags.push("plaid_high_risk");
      reasons.push(
        `Plaid indicated high financial risk (${(
          metadata.plaidData.plaidRiskScore * 100
        ).toFixed(0)}%).`
      );
    }
    if (metadata.plaidData.plaidIdentityMismatch === true) {
      score -= 50;
      tags.push("plaid_identity_mismatch");
      reasons.push(
        "Plaid detected a critical identity mismatch for the associated financial account."
      );
    }
    if (metadata.plaidData.plaidBeaconSignals?.includes("known_fraudster")) {
      score -= 60;
      tags.push("plaid_known_fraudster");
      reasons.push(
        "Plaid Beacon identified the associated identity as a known fraudster."
      );
    }
  }

  // --- NEW: EVE Human-Signal Micro-Engine (text, username, context) ---

  const humanSignal = computeHumanSignalFromMetadata(metadata);

  if (humanSignal) {
    const originalScore = score;

    // Blend macro score (behavior + fraud) with micro human-signal score
    score = Math.round(originalScore * 0.6 + humanSignal.score * 0.4);

    // Tag reasons by label
    if (humanSignal.label === "ai" || humanSignal.label === "suspect") {
      tags.push("low_human_signal");
      reasons.push(
        `Human-signal engine flagged this content as "${humanSignal.label}" (micro-score ${humanSignal.score}).`
      );
    } else if (humanSignal.label === "human" || humanSignal.label === "likely-human") {
      tags.push("strong_human_signal");
      reasons.push(
        `Human-signal engine supports authentic effort ("${humanSignal.label}", micro-score ${humanSignal.score}).`
      );
    }
  }

  // --- Final clamp + top-level tag ---
  score = Math.max(0, Math.min(100, Math.round(score)));

  if (score < 70) {
    tags.push("low_effort_or_fraud");
  } else {
    tags.push("human_effort_detected");
  }

  return {
    score,
    tags,
    reasons: reasons.length > 0 ? reasons : ["No specific red flags detected."],
  };
}

// --- Conceptual LLM API Call for AI Text Detection ---
async function analyzeTextForAI(text: string): Promise<boolean> {
  // Placeholder for Gemini/OpenAI/etc — currently disabled
  return false;
}

/* ============================================================
   EVE HUMAN-SIGNAL ENGINE (v2)
   - Text-level & identity-level micro-scoring
   - Totally platform-agnostic, no scraping
   ============================================================ */

type HumanSignalResult = {
  score: number; // 0–100
  label: "human" | "likely-human" | "suspect" | "ai";
};

/**
 * Builds a human-signal score (0–100) from whatever text/identity
 * data we have in ContentMetadata.
 */
function computeHumanSignalFromMetadata(metadata: ContentMetadata): HumanSignalResult | null {
  const anyMeta = metadata as any;

  // Try to find the most "comment-like" or UGC-like text we have
  const text: string =
    anyMeta.rawText ||
    anyMeta.caption ||
    metadata.description ||
    anyMeta.title ||
    "";

  if (!text || text.trim().length === 0) {
    return null;
  }

  const username: string =
    anyMeta.username ||
    anyMeta.author ||
    anyMeta.channelName ||
    anyMeta.handle ||
    "";

  // Context: title + hashtags (if available)
  const hashtags: string[] = anyMeta.hashtags || [];
  const contextParts = [anyMeta.title, hashtags.join(" ")].filter(Boolean);
  const context = contextParts.join(" ");

  const lastMessages: string[] = anyMeta.lastMessages || [];
  const lastMessageTime: number = anyMeta.lastMessageTimeMs ?? 9999;

  return calculateHumanSignalScore({
    text,
    username,
    context,
    lastMessages,
    lastMessageTime,
  });
}

/**
 * Core human-signal scoring recipe.
 * This is local, cheap, and explainable — perfect as a layer
 * on top of your existing fraud/behavior logic.
 */
function calculateHumanSignalScore(input: {
  text: string;
  username?: string;
  context?: string;
  lastMessages?: string[];
  lastMessageTime?: number;
}): HumanSignalResult {
  let {
    text,
    username = "",
    context = "",
    lastMessages = [],
    lastMessageTime = 9999,
  } = input;

  let score = 50; // neutral base

  const t = text.trim();
  const lower = t.toLowerCase();

  // 1️⃣ Linguistic human signals

  // Very rough "typo" detection: weird chars inside words
  const misspellings = lower.match(/[a-z]{3,}[^a-z\s]{1,}/g) || [];
  if (misspellings.length > 0) score += 8;

  const slangWords = /(bro|bruh|lmao|lol|idk|nah|fr|on god|deadass|rn|wtf|omg|gonna|wanna)/i;
  if (slangWords.test(lower)) score += 6;

  const emotionWords = /(crying|dying|wow|pls|omg|wild|insane|hella|crazy|i swear|no way)/i;
  if (emotionWords.test(lower)) score += 6;

  const sentences = t.split(/[.!?]/).filter((s) => s.trim().length > 0);
  if (sentences.length >= 2 && sentences[0].length !== sentences[1]?.length) {
    score += 8;
  }

  const tooPerfect = /^[A-Z].*[a-z]+\.$/.test(t);
  if (tooPerfect && t.length > 25) score -= 6;

  if (t.length < 10) score -= 8;

  // 2️⃣ Repetition patterns

  const repeatedEmoji = /(😂😂|😭😭|🔥🔥|😍😍|💯💯)/;
  if (repeatedEmoji.test(lower)) score -= 10;

  const repeatedChars = /(.)\1{3,}/;
  if (repeatedChars.test(lower)) score -= 6;

  if (/[?!]{2,}|\.{2,}/.test(t)) score += 4;

  // 3️⃣ Human timing model

  if (lastMessageTime < 2000) score -= 12;
  if (lastMessageTime < 1000) score -= 20;
  if (lastMessageTime > 4000) score += 12;

  // 4️⃣ Context matching (title/hashtags vs text)

  if (context) {
    const contextWords = context.toLowerCase().split(/\W+/).filter(Boolean);
    const textWords = lower.split(/\W+/).filter(Boolean);
    const intersection = textWords.filter((w) => contextWords.includes(w));
    if (intersection.length >= 2) score += 10;
    if (intersection.length === 0 && textWords.length >= 3) score -= 10;
  }

  // 5️⃣ Username entropy

  const entropy = usernameEntropy(username);
  if (entropy > 0.75) score -= 12;
  if (entropy < 0.45 && username.trim().length > 0) score += 6;

  // 6️⃣ Comment variety from this user (if available)

  if (lastMessages.length > 0) {
    const lengths = lastMessages.map((m) => m.length);

    if (lengths.every((len) => len < 8)) score -= 6;

    const emojiHeavyCount = lastMessages.filter((m) => /[😂😭🔥😍💯]/.test(m)).length;
    if (emojiHeavyCount >= 3) score -= 4;

    const variance = Math.max(...lengths) - Math.min(...lengths);
    if (variance > 10) score += 6;
  }

  // Final clamp and label
  score = Math.max(0, Math.min(100, Math.round(score)));

  const label: HumanSignalResult["label"] =
    score >= 80 ? "human" :
    score >= 60 ? "likely-human" :
    score >= 40 ? "suspect" :
    "ai";

  return { score, label };
}

// Helper: Username entropy (very rough, normalized 0–1)
function usernameEntropy(name: string): number {
  if (!name) return 0.5;

  const chars = name.split("");
  const freq: Record<string, number> = {};
  chars.forEach((c) => {
    freq[c] = (freq[c] ?? 0) + 1;
  });

  let entropy = 0;
  for (const ch in freq) {
    const p = freq[ch] / chars.length;
    entropy -= p * Math.log2(p);
  }

  return entropy / 5; // normalize
}
