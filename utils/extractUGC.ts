// ============================================================
//  UNIVERSAL UGC EXTRACTOR — EVE ENGINE (2026 Edition)
//  Converts ANY platform’s raw metadata into a clean,
//  normalized UGC object for scoring.
// ============================================================

export type NormalizedUGC = {
  platform: string;
  primaryText: string;
  contextText: string;
  username: string;
  hashtags: string[];
  metadata: Record<string, any>;
};

/**
 * Entry point.
 * Takes raw metadata from runEffortScore / scrapers / extensions
 * and returns clean, platform-normalized text + context + signals.
 */
export function extractUGC(raw: any): NormalizedUGC {
  if (!raw) {
    return emptyUGC("unknown");
  }

  const platform = detectPlatform(raw);

  switch (platform) {
    case "tiktok":
      return extractTikTok(raw);

    case "reddit":
      return extractReddit(raw);

    case "youtube":
      return extractYouTube(raw);

    case "amazon":
      return extractAmazon(raw);

    case "twitter":
      return extractTwitter(raw);

    case "instagram":
      return extractInstagram(raw);

    case "discord":
      return extractDiscord(raw);

    default:
      return extractGeneric(raw);
  }
}

// ============================================================
//  PLATFORM DETECTION
// ============================================================

function detectPlatform(raw: any): string {
  const url = (raw.url || "").toLowerCase();

  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("reddit.com")) return "reddit";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("amazon.com")) return "amazon";
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("discord.com")) return "discord";

  return raw.platform || "unknown";
}

// ============================================================
//  TIKTOK EXTRACTOR
// ============================================================

function extractTikTok(raw: any): NormalizedUGC {
  const caption = safe(raw.caption);
  const username = safe(raw.author);
  const sound = safe(raw.soundTitle);
  const hashtags = extractHashtags(caption);

  const context = [sound].filter(Boolean).join(" ");

  return {
    platform: "tiktok",
    primaryText: caption,
    contextText: context,
    username,
    hashtags,
    metadata: {
      soundTitle: sound,
      verifiedCreator: raw.verifiedCreator || false,
      followerCount: raw.followerCount || 0,
      commentCount: raw.commentCount || 0,
      viewCount: raw.viewCount || 0,
    },
  };
}

// ============================================================
//  REDDIT EXTRACTOR
// ============================================================

function extractReddit(raw: any): NormalizedUGC {
  const title = safe(raw.title);
  const body = safe(raw.body || raw.selftext);
  const author = safe(raw.author);
  const flair = safe(raw.flairText);

  const context = [flair].filter(Boolean).join(" ");

  const primary = [title, body].filter(Boolean).join(" — ");

  return {
    platform: "reddit",
    primaryText: primary,
    contextText: context,
    username: author,
    hashtags: [],
    metadata: {
      subreddit: raw.subreddit,
      flair,
      score: raw.score,
      commentCount: raw.num_comments,
      postAgeSeconds: raw.created_utc,
    },
  };
}

// ============================================================
//  YOUTUBE EXTRACTOR
// ============================================================

function extractYouTube(raw: any): NormalizedUGC {
  const title = safe(raw.title);
  const desc = safe(raw.description);
  const channel = safe(raw.channelTitle);

  const context = safe(raw.category);

  const primary = [title, desc].filter(Boolean).join(" — ");

  return {
    platform: "youtube",
    primaryText: primary,
    contextText: context,
    username: channel,
    hashtags: extractHashtags(desc),
    metadata: {
      viewCount: raw.viewCount,
      likeCount: raw.likeCount,
      commentCount: raw.commentCount,
      channelSubscribers: raw.subscriberCount,
    },
  };
}

// ============================================================
//  AMAZON EXTRACTOR — REVIEWS
// ============================================================

function extractAmazon(raw: any): NormalizedUGC {
  const title = safe(raw.reviewTitle);
  const body = safe(raw.reviewBody);
  const author = safe(raw.reviewerName);

  const primary = [title, body].filter(Boolean).join(" — ");

  const verified = Boolean(raw.verifiedPurchase);
  const stars = raw.rating || 0;

  const context = verified ? "verified purchase" : "unverified";

  return {
    platform: "amazon",
    primaryText: primary,
    contextText: context,
    username: author,
    hashtags: [],
    metadata: {
      verifiedPurchase: verified,
      starRating: stars,
      reviewAgeDays: raw.reviewAgeDays || null,
    },
  };
}

// ============================================================
//  TWITTER / X EXTRACTOR
// ============================================================

function extractTwitter(raw: any): NormalizedUGC {
  const text = safe(raw.tweetText);
  const username = safe(raw.username);

  return {
    platform: "twitter",
    primaryText: text,
    contextText: "",
    username,
    hashtags: extractHashtags(text),
    metadata: {
      likes: raw.likeCount,
      retweets: raw.retweetCount,
      replies: raw.replyCount,
      followers: raw.followerCount,
    },
  };
}

// ============================================================
//  INSTAGRAM EXTRACTOR
// ============================================================

function extractInstagram(raw: any): NormalizedUGC {
  const caption = safe(raw.caption);
  const username = safe(raw.username);

  const hashtags = extractHashtags(caption);

  const context = safe(raw.location) || "";

  return {
    platform: "instagram",
    primaryText: caption,
    contextText: context,
    username,
    hashtags,
    metadata: {
      likeCount: raw.likeCount,
      commentCount: raw.commentCount,
      followerCount: raw.followerCount,
    },
  };
}

// ============================================================
//  DISCORD EXTRACTOR
// ============================================================

function extractDiscord(raw: any): NormalizedUGC {
  const text = safe(raw.message);
  const username = safe(raw.username);
  const channel = safe(raw.channelName);

  return {
    platform: "discord",
    primaryText: text,
    contextText: channel,
    username,
    hashtags: extractHashtags(text),
    metadata: {
      role: raw.role,
      messageAgeMs: raw.ageMs,
      attachments: raw.attachments || [],
    },
  };
}

// ============================================================
//  GENERIC FALLBACK
// ============================================================

function extractGeneric(raw: any): NormalizedUGC {
  const text = safe(raw.text || raw.description || raw.caption);
  const username = safe(raw.username || raw.author);

  return {
    platform: raw.platform || "unknown",
    primaryText: text,
    contextText: "",
    username,
    hashtags: extractHashtags(text),
    metadata: raw,
  };
}

// ============================================================
//  UTILITIES
// ============================================================

function safe(val: any): string {
  return typeof val === "string" ? val.trim() : "";
}

function extractHashtags(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/#[\w-]+/g);
  return matches ? matches.map((h) => h.toLowerCase()) : [];
}

function emptyUGC(platform: string): NormalizedUGC {
  return {
    platform,
    primaryText: "",
    contextText: "",
    username: "",
    hashtags: [],
    metadata: {},
  };
}
