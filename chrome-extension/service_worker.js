// ============================================================
// TRUSTE — FULL PRODUCTION SERVICE WORKER (ADVANCED + STABLE)
// Combines Tito's heuristic engine + unified batch system
// ============================================================

const DEBUG = true;
const dlog = (...a) => DEBUG && console.log("[TRUSTE SW]", ...a);

// ============================================================
// Running Calibration (your full system)
// ============================================================
let CAL = { mu: 0.55, sigma: 0.18, alpha: 0.02 };

function updateRunningCalibrators(raw) {
  CAL.mu = (1 - CAL.alpha) * CAL.mu + CAL.alpha * raw;
  const dev = raw - CAL.mu;
  const newVar = (1 - CAL.alpha) * (CAL.sigma ** 2) + CAL.alpha * (dev ** 2);
  CAL.sigma = Math.max(0.08, Math.sqrt(newVar));
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function universalCalibrate(raw) {
  const z = (raw - CAL.mu) / CAL.sigma;
  let s = sigmoid(0.9 * z);
  s = clamp(s, 0, 1);
  s += (Math.random() - 0.5) * 0.03; // slight jitter
  return clamp(s, 0, 1);
}

// ============================================================
// Port Management (the missing fix)
// ============================================================
let ports = [];

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "TRUSTE_PORT") return;

  ports.push(port);
  dlog("Port connected. Active ports =", ports.length);

  port.onDisconnect.addListener(() => {
    ports = ports.filter((p) => p !== port);
    dlog("Port disconnected. Active ports =", ports.length);
  });

  port.onMessage.addListener(async (msg) => {
    try {
      // -----------------------------------------
      // Legacy single-score fallback support
      // -----------------------------------------
      if (msg.type === "TRUSTE_SCORE") {
        const raw = computeHeuristicScore(msg.text);
        updateRunningCalibrators(raw);
        const finalScore = universalCalibrate(raw);

        port.postMessage({
          type: "TRUSTE_RESULT",
          elPath: msg.elPath,
          score: finalScore,
        });
        return;
      }

      // -----------------------------------------
      // BATCH SCORING (your content.js uses this)
      // -----------------------------------------
      if (msg.type === "TRUSTE_SCORE_BATCH") {
        dlog("Batch received:", msg.items.length, "from", msg.origin);

        const results = await Promise.all(
          msg.items.map(async (it) => {
            const raw = computeHeuristicScore(it.text || "");
            updateRunningCalibrators(raw);
            const finalScore = universalCalibrate(raw);
            return { elPath: it.elPath, score: finalScore };
          })
        );

        port.postMessage({
          type: "TRUSTE_BATCH_RESULT",
          results,
        });

        return;
      }
    } catch (err) {
      console.error("[TRUSTE ERROR]", err);
    }
  });
});

// ============================================================
// Heuristic scoring (your full advanced engine)
// ============================================================
function computeHeuristicScore(text) {
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

  if (len > 80 && punctuation >= 1) score = Math.max(score, 0.62);

  return clamp(score, 0, 1);
}

function clamp(x, a, b) {
  return Math.min(Math.max(x, a), b);
}

// Heartbeat
setInterval(() => dlog("TRUSTE heartbeat", new Date().toISOString()), 600000);
