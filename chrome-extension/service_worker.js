// ============================================
// EVE TRUSTE — Local-Only Universal Scoring Engine (Stable Reset)
// ============================================

const DEBUG = true;
const dlog = (...a) => DEBUG && console.log("[EVE TRUSTE SW]", ...a);

// ---- Universal running calibration (content-only, no domain hacks)
let CAL = { mu: 0.55, sigma: 0.18, alpha: 0.02 }; // self-tuning

function updateRunningCalibrators(raw) {
  CAL.mu = (1 - CAL.alpha) * CAL.mu + CAL.alpha * raw;
  const dev = raw - CAL.mu;
  const newVar = (1 - CAL.alpha) * (CAL.sigma ** 2) + CAL.alpha * (dev ** 2);
  CAL.sigma = Math.max(0.08, Math.sqrt(newVar));
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

// Map any raw [0..1] into friendly % using running stats (universal)
function universalCalibrate(raw) {
  const z = (raw - CAL.mu) / CAL.sigma;
  let s = sigmoid(0.9 * z);     // global slope
  s = clamp(s, 0, 1);
  s += (Math.random() - 0.5) * 0.03; // tiny jitter
  return clamp(s, 0, 1);
}

// ============================================
// Port connection for batch scoring
// ============================================
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "TRUSTE_PORT") return;
  dlog("Port connected");

  port.onMessage.addListener(async (msg) => {
    if (msg.type === "TRUSTE_SCORE_BATCH") {
      dlog("Scoring batch (local only):", msg.items.length, "items from", msg.origin);
      const results = await handleScoreBatch(msg.items, msg.origin);
      port.postMessage({ type: "TRUSTE_BATCH_RESULT", results });
    }
  });
});

// ============================================
// Main Scoring Logic (NO REMOTE CALLS)
// ============================================
async function handleScoreBatch(items, origin) {
  const results = [];

  for (const it of items) {
    const raw = computeHeuristicScore(it.text || "", origin || "generic");
    updateRunningCalibrators(raw);
    const finalScore = universalCalibrate(raw);
    results.push({ elPath: it.elPath, score: finalScore });
  }

  return results;
}

// ============================================
// Heuristic Engine — for Offline / Backup
// ============================================
function computeHeuristicScore(text, origin = "generic") {
  text = (text || "").trim();
  if (!text) return 0.5;

  const len = text.length;
  const punctuation = (text.match(/[.,!?]/g) || []).length;
  const emoji = (text.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
  const urls = (text.match(/https?:\/\//g) || []).length;
  const caps = (text.match(/[A-Z]{2,}/g) || []).length;
  const digits = (text.match(/\d/g) || []).length;

  let score = 0.4 + Math.min(len / 2000, 0.3);
  score += Math.min(punctuation / 10, 0.1);
  score -= Math.min(emoji / 6, 0.10);
  score -= Math.min(urls * 0.04, 0.12);
  score -= Math.min(caps / 20, 0.1);
  score += Math.min(digits / 100, 0.05);

  // Content-only tweak: clear human-ish floor
  if (len > 80 && punctuation >= 1) score = Math.max(score, 0.62);

  return clamp(score, 0, 1);
}

// ============================================
// Helpers
// ============================================
function clamp(x, a, b) {
  return Math.min(Math.max(x, a), b);
}

// Diagnostics / heartbeat (optional)
setInterval(() => dlog("heartbeat (local-only)", new Date().toISOString()), 600000);
