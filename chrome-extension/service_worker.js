// EVE TRUSTE — Background (MV3 Service Worker)
const DEBUG = false;
const dlog = (...a) => DEBUG && console.log("[TRUSTE:SW]", ...a);

// Simple in-memory backoff per origin
const backoff = new Map(); // origin -> { delay, until }

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("keepalive", { periodInMinutes: 0.9 });
});

chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === "keepalive") {
    // no-op ping to keep worker warm
    dlog("keepalive");
  }
});

// Port channel
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "TRUSTE_PORT") return;

  dlog("Port connected");

  // Try to inject page-level passive shim into the main world for this tab.
  try {
    const tabId = port.sender?.tab?.id;
    if (typeof tabId === 'number') {
      chrome.scripting.executeScript({
        target: { tabId },
        files: ['inject-passive-shim.js'],
        world: 'MAIN'
      }).then(() => dlog('injected passive shim into tab', tabId)).catch(e => dlog('inject passive shim failed', e));
    }
  } catch (e) {
    dlog('scripting.executeScript not available', e);
  }

  port.onMessage.addListener(async (msg) => {
    if (msg?.type === "TRUSTE_SCORE_BATCH") {
      const origin = new URL(port.sender?.url || location.origin).origin;
      await maybeWaitBackoff(origin);

      try {
        // Score via remote API (fallback to heuristic on failure)
        let results;
        try {
          results = await scoreRemote(msg.items);
          if (!results || !results.length) throw new Error('empty results');
        } catch (e) {
          dlog('scoreRemote failed, falling back to heuristic', e);
          results = msg.items.map((it) => ({ elPath: it.elPath, score: heuristicScore(it.text) }));
        }

        // Adaptive backoff: if batch large, chill a bit
        setBackoff(origin, Math.min(2000, 200 + msg.items.length * 10));

        port.postMessage({ type: "TRUSTE_BATCH_RESULT", results });
      } catch (e) {
        setBackoff(origin, 1500);
        dlog("batch error", e);
        port.postMessage({ type: "TRUSTE_BATCH_RESULT", results: msg.items.map(it => ({ elPath: it.elPath, score: 0.5 })) });
      }
    }
  });
});

// Heuristic placeholder — deterministic & fast
function heuristicScore(text) {
  const t = text.toLowerCase();
  let s = 0.6;
  if (/\bfree\b|\bwin\b|\bcrypto\b/.test(t)) s -= 0.2;
  if (/\blink\b|http/.test(t)) s -= 0.1;
  if (t.length > 300) s += 0.05;
  return Math.max(0, Math.min(1, s));
}

// Remote scoring API
async function scoreRemote(items) {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch("https://nao-sdk-api.onrender.com/v1/truste/score", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": "<KEY>" },
      body: JSON.stringify({ items }),
      signal: controller.signal
    });
    const json = await res.json();
    return json.results; // [{elPath, score}]
  } finally {
    clearTimeout(to);
  }
}

function setBackoff(origin, ms) {
  backoff.set(origin, { delay: ms, until: Date.now() + ms });
}
async function maybeWaitBackoff(origin) {
  const b = backoff.get(origin);
  if (!b) return;
  const wait = b.until - Date.now();
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
}
