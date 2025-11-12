// --- boot logs so we can see activity in DevTools ---
console.log("[TRUSTE] content script loaded on", location.href);

// -------- Site adapters (site-specific selectors) --------
const TRUSTE_SITES = {
  "www.reddit.com": {
    find: () =>
      Array.from(
        document.querySelectorAll(
          // comments often live under data-test-id or data-click-id; cover both
          '[data-test-id="comment"] p, .Comment div[data-click-id="text"], div[id^="t1_"] p'
        )
      ),
    text: (el) => el.innerText || "",
    mount: (el, host) => el.closest('[data-test-id="comment"], .Comment, div[id^="t1_"]')?.appendChild(host),
    platform: "reddit",
  },
  "www.tiktok.com": {
    find: () =>
      Array.from(
        document.querySelectorAll(
          '[data-e2e="comment-level-1"] [data-e2e="comment-level-1-text"], [data-e2e="comment-text"]'
        )
      ),
    text: (el) => el.innerText || "",
    mount: (el, host) => el.parentElement?.appendChild(host),
    platform: "tiktok",
  },
  "www.amazon.com": {
    find: () =>
      Array.from(
        document.querySelectorAll(
          '.review[data-hook="review"] .review-text, [data-hook="review-body"]'
        )
      ),
    text: (el) => el.innerText || "",
    mount: (el, host) => el.parentElement?.insertBefore(host, el),
    platform: "amazon",
  },
};

// -------- Universal fallback (any site) --------
// Pick visible paragraphs/blocks with enough text, avoid nav/footers.
const GENERIC_FALLBACK = {
  find: () => {
    const candidates = Array.from(
      document.querySelectorAll("p, blockquote, article p, .comment, [role='article'] p")
    ).filter((el) => {
      const t = (el.innerText || "").trim();
      const visible = !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      return visible && t.length >= 40; // only non-trivial text
    });
    // Cap to first 12 per scan to avoid spamming API
    return candidates.slice(0, 12);
  },
  text: (el) => el.innerText || "",
  mount: (el, host) => {
    // append in a safe spot
    (el.parentElement || el).appendChild(host);
  },
  platform: "web",
};

const site = TRUSTE_SITES[location.host] || null;
if (!site) console.debug("[TRUSTE] no site adapter, will use fallback:", location.host);

// -------- Badge factory (Shadow DOM) --------
function makeBadge(level = "human", humanScore = 0, reasons = []) {
  const wrap = document.createElement("span");
  const shadow = wrap.attachShadow({ mode: "open" });

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("badge.css");

  const container = document.createElement("span");
  container.className = "eve-wrap";
  const pill = document.createElement("span");
  pill.className = "eve-pill";
  pill.setAttribute("data-level", level);

  const dot = document.createElement("span"); dot.className = "eve-dot";
  const brand = document.createElement("span"); brand.className = "eve-brand"; brand.textContent = "TRUSTE";
  const score = document.createElement("span"); score.className = "eve-score";
  score.textContent = `· ${Math.round(humanScore * 100)}%`;

  pill.append(dot, brand, score);

  const tipWrap = document.createElement("span");
  tipWrap.className = "eve-tip";
  if (reasons?.length) tipWrap.textContent = reasons.slice(0, 3).join(" • ");

  container.append(pill, tipWrap);
  shadow.append(link, container);
  return wrap;
}

// -------- Score normalization --------
function toHumanScore(r) {
  if (typeof r.humanScore === "number") return clamp01(r.humanScore);
  if (typeof r.aiScore === "number") return clamp01(1 - r.aiScore);
  if (typeof r.score === "number") {
    if (r.label && /ai|bot|fake/i.test(r.label)) return clamp01(1 - r.score);
    return clamp01(r.score);
  }
  return 0.5;
}
function clamp01(x) { return Math.max(0, Math.min(1, x)); }

function bucket(h) {
  if (h >= 0.80) return "human";
  if (h >= 0.60) return "likely-human";
  if (h >= 0.40) return "suspect";
  return "ai";
}

// -------- Visibility + batching --------
const seen = new WeakSet();
const io = new IntersectionObserver((entries) => {
  const batch = [];
  for (const { target, isIntersecting } of entries) {
    if (!isIntersecting || seen.has(target)) continue;
    seen.add(target);
    batch.push(target);
  }
  if (batch.length) scoreNodes(batch);
}, { root: null, rootMargin: "0px", threshold: 0.05 });

// -------- Find + observe --------
let initialForcedScoreDone = false;
function scan() {
  console.log("[TRUSTE] scanning for text nodes...");
  // try site adapter first
  let nodes = site ? site.find() : [];
  if (!nodes || nodes.length === 0) {
    // fallback to generic
    nodes = GENERIC_FALLBACK.find();
    if (nodes.length) console.debug("[TRUSTE] using generic fallback, nodes:", nodes.length);
  } else {
    console.debug("[TRUSTE] site adapter matches:", nodes.length, "on", location.host);
  }
  for (const el of nodes) io.observe(el);
  // FORCE a first score for what's already on screen (helps confirm end-to-end)
  // Only do this once per page load to avoid repeated batches on rapid scans
  if (nodes.length && !initialForcedScoreDone) {
    console.log("[TRUSTE] forcing first score for", Math.min(nodes.length, 5), "nodes");
    scoreNodes(nodes.slice(0, 5));
    initialForcedScoreDone = true;
  }
}

// Debounced scanning
let deb;
function scheduleScan(){ clearTimeout(deb); deb = setTimeout(scan, 300); }

scan();
document.addEventListener("scroll", scheduleScan, { passive:true });
new MutationObserver(scheduleScan).observe(document.body, { childList:true, subtree:true });

// -------- Batch scoring --------
function scoreNodes(nodes) {
  // choose active adapter (site or generic)
  const A = (site && site.find().length) ? site : GENERIC_FALLBACK;

  const items = nodes.map((el) => ({
    id: (el.dataset.eveId = el.dataset.eveId || Math.random().toString(36).slice(2)),
    text: A.text(el).slice(0, 1500),
    context: { platform: A.platform, url: location.href },
  })).filter((x) => x.text && x.text.length > 3);

  if (!items.length) return;

  console.log("[TRUSTE] sending batch", items.length, "→ TRUSTE_SCORE_BATCH");
  chrome.runtime.sendMessage({ type: "TRUSTE_SCORE_BATCH", items }, (resp) => {
    if (chrome.runtime.lastError) {
      console.warn("[TRUSTE] sendMessage error:", chrome.runtime.lastError.message);
      return;
    }
    const { ok, results } = resp || {};
    console.log("[TRUSTE] batch response:", ok, results && results.length);
    if (!ok || !results) return;

    for (const r of results) {
      const target = document.querySelector(`[data-eve-id="${r.id}"]`) || nodes.find((n) => n.dataset.eveId === r.id);
      if (!target) continue;

      const humanScore = toHumanScore(r);
      const label = bucket(humanScore);
      const reasons = r.reasons || [];

      try {
        (A.mount || site?.mount || GENERIC_FALLBACK.mount)(target, makeBadge(label, humanScore, reasons));
      } catch (e) {
        console.warn("[TRUSTE] mount failed", e);
      }
    }
  });
}
