// ============================================
// EVE TRUSTE — Production Scoring Service Worker (Final)
// ============================================

const API_URL = "https://nao-sdk-api.onrender.com/api/scoreEffort";
const DEBUG = true;
const dlog = (...a) => DEBUG && console.log("[EVE TRUSTE SW]", ...a);

// ============================================
// Config: load API key from Chrome storage
// ============================================
let API_KEY = null;
if (chrome?.storage?.sync) {
  chrome.storage.sync.get({ trusteApiKey: null }, (res) => {
    API_KEY = res.trusteApiKey || null;
    dlog("API_KEY loaded?", !!API_KEY);
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    if (changes.trusteApiKey) API_KEY = changes.trusteApiKey.newValue || null;
  });
}

// ============================================
// Port connection for batch scoring
// ============================================
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "TRUSTE_PORT") return;
  dlog("Port connected");

  port.onMessage.addListener(async (msg) => {
    if (msg.type === "TRUSTE_SCORE_BATCH") {
      dlog("Scoring batch:", msg.items.length, "items from", msg.origin);
      const results = await handleScoreBatch(msg.items, msg.origin);
      port.postMessage({ type: "TRUSTE_BATCH_RESULT", results });
    }
  });
});

// ============================================
// Main Scoring Logic
// ============================================
async function handleScoreBatch(items, origin) {
  // Try to score batch remotely first
  try {
    const remote = await scoreBatchRemote(items, origin);
    if (remote && remote.length) {
      return remote.map((r, i) => ({
        elPath: r.elPath || items[i].elPath,
        score:
          typeof r.score === "number"
            ? addJitter(normalizeScore(r.score, origin, items[i].text))
            : computeHeuristicScore(items[i].text, origin),
      }));
    }
  } catch (e) {
    dlog("Batch remote scoring failed:", e && e.message);
  }

  // Fallback: local heuristic scoring
  return items.map((it) => ({
    elPath: it.elPath,
    score: computeHeuristicScore(it.text, origin),
  }));
}

// ============================================
// Remote Scoring (Batch + Retry)
// ============================================
async function scoreBatchRemote(items, origin) {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 5000);

  try {
    const headers = {
      "Content-Type": "application/json",
      "X-Requested-By": "EVE-TRUSTE-EXT",
    };
    if (API_KEY) headers["X-Api-Key"] = API_KEY;

    const res = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        items: items.map((i) => ({ text: i.text, elPath: i.elPath })),
        origin,
      }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error("Remote error " + res.status);

    const json = await res.json();
    if (Array.isArray(json.results)) return json.results;
    if (Array.isArray(json)) return json.map((r, i) => ({ elPath: items[i].elPath, score: r.score }));
    throw new Error("Unexpected response structure");
  } catch (err) {
    dlog("Remote batch failed, retrying once:", err.message);
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));

    try {
      const res2 = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-By": "EVE-TRUSTE-EXT" },
        body: JSON.stringify({
          items: items.map((i) => ({ text: i.text, elPath: i.elPath })),
          origin,
        }),
      });
      if (res2.ok) {
        const json2 = await res2.json();
        if (Array.isArray(json2.results)) return json2.results;
      }
    } catch (e2) {
      dlog("Retry failed:", e2.message);
    }
  } finally {
    clearTimeout(to);
  }

  return [];
}

// ============================================
// Heuristic Engine (Offline / Backup)
// ============================================
function computeHeuristicScore(text, origin = "generic") {
  const len = text.length;
  const punctuation = (text.match(/[.,!?]/g) || []).length;
  const emoji = (text.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
  const urls = (text.match(/https?:\/\//g) || []).length;
  const caps = (text.match(/[A-Z]{2,}/g) || []).length;
  const digits = (text.match(/\d/g) || []).length;

  // Baseline: longer, punctuated text = more human
  let score = 0.4 + Math.min(len / 2000, 0.3);
  score += Math.min(punctuation / 10, 0.1);
  score -= Math.min(emoji / 5, 0.15);
  score -= Math.min(urls * 0.05, 0.2);
  score -= Math.min(caps / 20, 0.1);
  score += Math.min(digits / 100, 0.05);

  // Domain-specific modifiers
  if (/reddit|twitter|tiktok|youtube|instagram/.test(origin)) score -= 0.05;
  if (/amazon|yelp|tripadvisor|etsy/.test(origin)) score += 0.05;
  if (/linkedin|medium|news|substack/.test(origin)) score += 0.1;

  return clamp(score + (Math.random() - 0.5) * 0.1, 0, 1);
}

// ============================================
// Score Normalization + Jitter
// ============================================
function normalizeScore(raw, origin, text) {
  let adj = raw;

  // Adjust by content type
  if (/review|testimonial/.test(text)) adj += 0.05;
  if (/bot|AI|generated/i.test(text)) adj -= 0.2;
  if (/reddit|twitter|tiktok/.test(origin)) adj -= 0.05;
  if (/amazon|yelp/.test(origin)) adj += 0.05;
  if (/news|medium|substack/.test(origin)) adj += 0.05;

  return clamp(adj, 0, 1);
}

function addJitter(score) {
  return clamp(score + (Math.random() - 0.5) * 0.05, 0, 1);
}

function clamp(x, a, b) {
  return Math.min(Math.max(x, a), b);
}

// ============================================
// Diagnostics / Heartbeat
// ============================================
setInterval(() => dlog("heartbeat", new Date().toISOString()), 600000);
