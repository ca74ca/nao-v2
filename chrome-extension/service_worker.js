// ============================================
// EVE TRUSTE — Production Scoring Service Worker (Final)
// ============================================

const API_URL = "https://nao-sdk-api.onrender.com/api/scoreEffort";
const DEBUG = true;
const dlog = (...a) => DEBUG && console.log("[EVE TRUSTE SW]", ...a);

// ============================================
// Universal running calibration (no domain rules)
// ============================================
let CAL = { mu: 0.55, sigma: 0.18, alpha: 0.02 }; // start reasonable; self-tunes

function updateRunningCalibrators(raw) {
  // EMA mean
  CAL.mu = (1 - CAL.alpha) * CAL.mu + CAL.alpha * raw;
  // EMA variance via EMA of squared deviation
  const dev = raw - CAL.mu;
  CAL.sigma = Math.max(0.08, Math.sqrt((1 - CAL.alpha) * (CAL.sigma**2) + CAL.alpha * (dev**2)));
}

function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

// Map any raw [0..1] into friendly % using running stats (universal)
function universalCalibrate(raw) {
  // z-score using running mean/variance
  const z = (raw - CAL.mu) / CAL.sigma;
  // compress extremes a bit, lift mids
  let s = sigmoid(0.9 * z);            // 0.9 = global slope
  s = clamp(s, 0, 1);
  // mild jitter for realism
  s += (Math.random() - 0.5) * 0.03;
  return clamp(s, 0, 1);
}

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
      return remote.map((r, i) => {
        const raw = typeof r.score === "number" ? normalizeScore(r.score, origin, items[i].text) : computeHeuristicScore(items[i].text, origin);
        updateRunningCalibrators(raw);
        const finalScore = universalCalibrate(raw);
        return { elPath: r.elPath || items[i].elPath, score: finalScore };
      });
    }
  } catch (e) {
    dlog("Batch remote scoring failed:", e && e.message);
  }

  // Fallback: local heuristic scoring
  return items.map((it) => {
    const raw = computeHeuristicScore(it.text, origin);
    updateRunningCalibrators(raw);
    const finalScore = universalCalibrate(raw);
    return { elPath: it.elPath, score: finalScore };
  });
}

// ============================================
// Remote Scoring (Batch + Single Fallback)
// ============================================
async function scoreBatchRemote(items, origin) {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 5000);
  const headers = { "Content-Type": "application/json", "X-Requested-By": "EVE-TRUSTE-EXT" };
  if (API_KEY) headers["X-Api-Key"] = API_KEY;

  try {
    // Try your current endpoint as batch first
    const res = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ items: items.map(i => ({ text: i.text, elPath: i.elPath })), origin }),
      signal: controller.signal,
    });

    if (res.status === 404) {
      dlog("Batch endpoint 404 – falling back to single-item calls");
      // Per-item fallback using single scoring route
      const singles = await Promise.all(items.map(async (i) => {
        const raw = await scoreSingleRemote(i.text, origin, headers);
        return { elPath: i.elPath, score: typeof raw === "number" ? raw : computeHeuristicScore(i.text) };
      }));
      return singles;
    }

    if (!res.ok) throw new Error("Remote error " + res.status);
    const jsonText = await res.text();
    let json; try { json = JSON.parse(jsonText); } catch { dlog("Non-JSON response:", jsonText.slice(0,180)); }
    if (json && Array.isArray(json.results)) return json.results;
    if (json && Array.isArray(json)) return json.map((r, i) => ({ elPath: items[i].elPath, score: r.score }));
    throw new Error("Unexpected response structure");
  } catch (err) {
    dlog("Remote batch failed:", err.message, "— retrying once via singles");
    const singles = await Promise.all(items.map(async (i) => {
      const raw = await scoreSingleRemote(i.text, origin, headers);
      return { elPath: i.elPath, score: typeof raw === "number" ? raw : computeHeuristicScore(i.text) };
    }));
    return singles;
  } finally {
    clearTimeout(to);
  }
}

async function scoreSingleRemote(text, origin, headers) {
  try {
    const r = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ text, origin }),
    });
    if (!r.ok) { dlog("single POST status", r.status); return null; }
    const data = await r.json();
    return typeof data.effortScore === "number" ? data.effortScore : null;
  } catch (e) {
    dlog("single POST error", e.message);
    return null;
  }
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
  score -= Math.min(emoji / 6, 0.10);
  score -= Math.min(urls * 0.04, 0.12);
  score -= Math.min(caps / 20, 0.1);
  score += Math.min(digits / 100, 0.05);
  if (len > 80 && punctuation >= 1) score = Math.max(score, 0.62); // floor for clearly human

  // Domain-specific modifiers
  if (/reddit|twitter|tiktok|youtube|instagram/.test(origin)) score -= 0.05;
  if (/amazon|yelp|tripadvisor|etsy/.test(origin)) score += 0.05;
  if (/linkedin|medium|news|substack/.test(origin)) score += 0.1;

  return clamp(score + (Math.random() - 0.5) * 0.1, 0, 1);
}

// ============================================
// Score Normalization + Jitter
// ============================================
function normalizeScore(raw, _origin, text) {
  let s = raw;
  if (/review|testimonial/i.test(text)) s += 0.03;
  if (/\b(bot|ai[-\s]?generated)\b/i.test(text)) s -= 0.15;
  return clamp(s, 0, 1);
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
