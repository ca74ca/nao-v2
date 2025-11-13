// ---- Endpoint auto-discovery + circuit breaker
const API_ORIGIN = "https://nao-sdk-api.onrender.com";
const CANDIDATE_PATHS = [
  "/api/scoreEffort",
  "/api/score-effort",
  "/v1/scoreEffort",
  "/scoreEffort",
];
let WORKING_PATH = null;                   // cached good path
let consecutive404 = 0;
let breakerUntil = 0;                      // epoch ms; while open => local heuristics only

async function pickEndpoint() {
  if (WORKING_PATH) return API_ORIGIN + WORKING_PATH;
  for (const p of CANDIDATE_PATHS) {
    try {
      const url = API_ORIGIN + p;
      const res = await fetch(url, { method: "OPTIONS" }).catch(()=>null);
      if (res && (res.ok || res.status === 405 || res.status === 400)) {
        WORKING_PATH = p;
        dlog("Selected endpoint:", url);
        return url;
      }
    } catch {}
  }
  // fallback to first; real call will decide
  return API_ORIGIN + CANDIDATE_PATHS[0];
}

function breakerOpen() {
  consecutive404++;
  if (consecutive404 >= 3) {
    breakerUntil = Date.now() + 60_000; // 60s cooldown
    dlog("Circuit breaker OPEN for 60s after 3x 404");
  }
}
function breakerMaybeClose(ok) {
  if (ok) { consecutive404 = 0; breakerUntil = 0; }
}

// -------- single-item remote (used by batch fallback too)
async function scoreSingleRemote(text, origin, headers) {
  if (Date.now() < breakerUntil) return null; // breaker open -> skip remote
  const url = await pickEndpoint();
  try {
    const r = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ text, origin }),
    });
    if (r.status === 404) { breakerOpen(); dlog("single POST 404 at", url); return null; }
    if (!r.ok) { dlog("single POST status", r.status); return null; }
    breakerMaybeClose(true);
    const data = await r.json().catch(()=>null);
    return (data && typeof data.effortScore === "number") ? data.effortScore : null;
  } catch (e) {
    dlog("single POST error", e.message);
    return null;
  }
}

// -------- batch remote with auto-discovery + graceful downgrade
async function scoreBatchRemote(items, origin) {
  if (Date.now() < breakerUntil) return []; // breaker open -> skip remote
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 5000);
  const headers = { "Content-Type": "application/json", "X-Requested-By": "EVE-TRUSTE-EXT" };
  if (API_KEY) headers["X-Api-Key"] = API_KEY;

  const url = await pickEndpoint();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ items: items.map(i => ({ text: i.text, elPath: i.elPath })), origin }),
      signal: controller.signal,
    });

    if (res.status === 404) {
      dlog("Batch 404 at", url, "— falling back to singles");
      breakerOpen();
      const singles = await Promise.all(items.map(async (i) => {
        const raw = await scoreSingleRemote(i.text, origin, headers);
        return { elPath: i.elPath, score: typeof raw === "number" ? raw : computeHeuristicScore(i.text) };
      }));
      return singles;
    }

    if (!res.ok) throw new Error("Remote error " + res.status);

    breakerMaybeClose(true);
    const json = await res.json();
    if (Array.isArray(json?.results)) return json.results;
    if (Array.isArray(json)) return json.map((r, i) => ({ elPath: items[i].elPath, score: r.score }));
    throw new Error("Unexpected response structure");
  } catch (err) {
    dlog("Batch remote failed:", err.message, "— using singles");
    const singles = await Promise.all(items.map(async (i) => {
      const raw = await scoreSingleRemote(i.text, origin, headers);
      return { elPath: i.elPath, score: typeof raw === "number" ? raw : computeHeuristicScore(i.text) };
    }));
    return singles;
  } finally {
    clearTimeout(to);
  }
}
