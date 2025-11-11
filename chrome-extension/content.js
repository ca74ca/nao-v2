// -------- Site adapters --------
const TRUSTE_SITES = {
  "www.reddit.com": {
    find: () => Array.from(document.querySelectorAll('[data-test-id="comment"] p, .Comment div[data-click-id="text"]')),
    text: el => el.innerText || "",
    mount: (el, host) => el.closest('[data-test-id="comment"]')?.appendChild(host),
    platform: "reddit"
  },
  "www.tiktok.com": {
    find: () => Array.from(document.querySelectorAll('[data-e2e="comment-level-1"] [data-e2e="comment-level-1-text"]')),
    text: el => el.innerText || "",
    mount: (el, host) => el.parentElement?.appendChild(host),
    platform: "tiktok"
  },
  "www.amazon.com": {
    find: () => Array.from(document.querySelectorAll('.review[data-hook="review"] .review-text')),
    text: el => el.innerText || "",
    mount: (el, host) => el.parentElement?.insertBefore(host, el),
    platform: "amazon"
  }
};

const site = TRUSTE_SITES[location.host];
if (!site) console.debug("[TRUSTE] unsupported host:", location.host);

// -------- Badge factory (Shadow DOM) --------
function makeBadge(level = "human", humanScore = 0, reasons = []) {
  const wrap = document.createElement("span");
  const shadow = wrap.attachShadow({ mode: "open" });

  // Host styles
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("badge.css");

  // Pill
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

  // Tooltip with reasons (if any)
  const tipWrap = document.createElement("span");
  tipWrap.className = "eve-tip";
  if (reasons?.length) tipWrap.textContent = reasons.slice(0, 3).join(" • ");

  container.append(pill, tipWrap);
  shadow.append(link, container);
  return wrap;
}

// -------- Helper: normalize score shape from API --------
// Accepts: { humanScore } or { aiScore } or { score } (ai-likelihood or human-likelihood)
// We normalize to humanScore in [0..1].
function toHumanScore(r) {
  if (typeof r.humanScore === "number") return clamp01(r.humanScore);
  if (typeof r.aiScore === "number") return clamp01(1 - r.aiScore);
  if (typeof r.score === "number") {
    // Heuristic: if label says 'ai' and score high, treat score as ai-likelihood
    if (r.label && /ai|bot|fake/i.test(r.label)) return clamp01(1 - r.score);
    return clamp01(r.score); // otherwise treat as human-likelihood
  }
  return 0.5;
}
function clamp01(x){ return Math.max(0, Math.min(1, x)); }

// -------- Buckets (labels) --------
function bucket(h) {
  if (h >= 0.80) return "human";
  if (h >= 0.60) return "likely-human";
  if (h >= 0.40) return "suspect";
  return "ai";
}

// -------- Visiblity filter to avoid scoring hidden nodes --------
const seen = new WeakSet();
const io = new IntersectionObserver(entries => {
  const batch = [];
  for (const { target, isIntersecting } of entries) {
    if (!isIntersecting || seen.has(target)) continue;
    seen.add(target);
    batch.push(target);
  }
  if (batch.length) scoreNodes(batch);
}, { root: null, rootMargin: "0px", threshold: 0.05 });

// -------- Find + observe --------
function scan() {
  if (!site) return;
  for (const el of site.find()) io.observe(el);
}

// Debounce scanning on DOM changes / scroll
let deb;
function scheduleScan(){ clearTimeout(deb); deb = setTimeout(scan, 300); }

scan();
document.addEventListener("scroll", scheduleScan, { passive:true });
new MutationObserver(scheduleScan).observe(document.body, { childList:true, subtree:true });

// -------- Batch scoring --------
function scoreNodes(nodes) {
  const items = nodes.map(el => ({
    id: el.dataset.eveId = el.dataset.eveId || Math.random().toString(36).slice(2),
    text: site.text(el).slice(0, 1500),
    context: { platform: site.platform, url: location.href }
  })).filter(x => x.text && x.text.length > 3);

  if (!items.length) return;

  chrome.runtime.sendMessage({ type: "TRUSTE_SCORE_BATCH", items }, ({ ok, results }) => {
    if (!ok || !results) return;

    for (const r of results) {
      const target = document.querySelector(`[data-eve-id="${r.id}"]`) || nodes.find(n => n.dataset.eveId === r.id);
      if (!target) continue;

      const humanScore = toHumanScore(r);
      const label = bucket(humanScore);
      const reasons = r.reasons || [];

      try {
        site.mount(target, makeBadge(label, humanScore, reasons));
      } catch (e) {
        console.warn("[TRUSTE] mount failed", e);
      }
    }
  });
}
