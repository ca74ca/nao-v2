// ================================================
// EVE TRUSTE — Universal Content Scanner (2026-ready)
// ================================================

const DEBUG = true;
const dlog = (...a) => DEBUG && console.log("[TRUSTE]", ...a);

dlog("Universal content script loaded on", location.hostname);

// ---- Passive Shim Injector (still needed for performance)
(function injectPassiveShim() {
  try {
    const s = document.createElement("script");
    s.src = chrome.runtime.getURL("passive-shim.js");
    s.onload = () => s.remove();
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {
    console.warn("[TRUSTE] passive shim failed", e);
  }
})();

// ---- Universal Discovery + Scoring ----

let port = chrome.runtime.connect({ name: "TRUSTE_PORT" });
port.onDisconnect.addListener(() => {
  port = chrome.runtime.connect({ name: "TRUSTE_PORT" });
});

const seen = new WeakSet();
let inflight = 0;
const MAX_INFLIGHT = 3;
const BATCH_SIZE = 20;

// === TRUSTE 2026 MODE D — Block-Level Deduplication ===
const trusteSeenBlocks = new Map(); 
// key: small text signature
// value: the element that "owns" the block

function shouldSkipBlock(el, text, score) {
  const sig = text.slice(0, 120); // lightweight signature

  // --- NEW: skip if parent contains same text block ---
  const parent = el.parentElement;
  if (parent) {
    const parentText = (parent.innerText || "").trim();
    if (parentText === text) {
      // unless extreme case
      if (score >= 0.80 || score <= 0.30) return false;
      return true; // skip child (duplicate)
    }
  }

  // First time seeing this text block → claim ownership
  if (!trusteSeenBlocks.has(sig)) {
    trusteSeenBlocks.set(sig, el);
    return false; // do NOT skip
  }

  const owner = trusteSeenBlocks.get(sig);

  // Extreme-score override (<30% or >80%) → allow child pill
  if (score < 0.30 || score > 0.80) return false;

  // Otherwise skip children with duplicated text
  if (owner !== el) return true;

  return false;
}

// 1. Discover meaningful text nodes on any site
function discoverReadableNodes(root = document.body, limit = 400) {
  const found = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      const rect = node.getBoundingClientRect();
      if (rect.width < 60 || rect.height < 20) return NodeFilter.FILTER_SKIP;

      const style = window.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") {
        return NodeFilter.FILTER_REJECT;
      }

      const text = (node.innerText || "").trim();
      const len = text.length;

      // If visible area is tiny but text is huge, it's a hidden clone (YouTube/TikTok/X)
      if (text.length > 80 && rect.height < 30) return NodeFilter.FILTER_SKIP;

      // Too short to be meaningful
      if (len < 8) return NodeFilter.FILTER_SKIP;
      // Too huge (entire page, huge containers)
      if (len > 5000) return NodeFilter.FILTER_SKIP;

      // Skip obvious chrome / boilerplate
      if (/(©|cookie|sign in|log in|terms|privacy|all rights reserved)/i.test(text)) {
        return NodeFilter.FILTER_SKIP;
      }

      // Avoid pure numbers / counts like "3.2k", "42", "1,234"
      if (/^[\d,.\sKkMm%+:-]+$/.test(text)) return NodeFilter.FILTER_SKIP;

      // Require at least a bit of real language (letters)
      const letters = (text.match(/[A-Za-z]/g) || []).length;
      if (letters < 4) return NodeFilter.FILTER_SKIP;

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let n;
  while ((n = walker.nextNode()) && found.length < limit) {
    found.push(n);
  }
  return found;
}

// 2. Queue new elements for scoring
const queue = [];
function enqueueForScoring(nodes) {
  for (const node of nodes) {
    if (seen.has(node)) continue;
    seen.add(node);
    const text = node.innerText.trim().slice(0, 1000);
    if (text) queue.push({ el: node, text, elPath: getPath(node) });
  }
  pumpQueue();
}

// 3. Send in batches
function pumpQueue() {
  if (inflight >= MAX_INFLIGHT || queue.length === 0) return;
  const batch = queue.splice(0, BATCH_SIZE);
  inflight++;
  port.postMessage({
    type: "TRUSTE_SCORE_BATCH",
    origin: location.hostname,
    items: batch.map(({ text, elPath }) => ({ text, elPath })),
  });
}

// 4. Receive scores + mark nodes
port.onMessage.addListener((msg) => {
    if (msg.type === "TRUSTE_BATCH_RESULT") {
    inflight = Math.max(0, inflight - 1);
    for (const r of msg.results) {
      const el = queryPath(r.elPath);
      if (!el) continue;

      const text = (el.innerText || "").trim();
      if (!text) continue;

      // MODE D FILTER — skip if this block was already rendered
      if (shouldSkipBlock(el, text, r.score)) continue;

      // mount the pill (if running in sites that use makeBadge) or add classes
      try {
        const label = r.score >= 0.8 ? 'human' : (r.score <= 0.35 ? 'ai' : 'likely-human');
  const wrapper = document.createElement('span');
  wrapper.className = 'eve-wrap';
  const pill = document.createElement('span');
  pill.className = 'eve-pill fade-in';
        pill.setAttribute('data-level', label);
        
        let tooltipText =
          label === "human" ? "Trusted Human" :
          label === "ai" ? "AI / Bot-Like Pattern" :
          "Likely Human";
        
        pill.setAttribute("data-tooltip", tooltipText);
        
        const dot = document.createElement('span'); dot.className = 'eve-dot';
        const brand = document.createElement('span'); brand.className = 'eve-brand'; brand.textContent = 'TRUSTE';
        const score = document.createElement('span'); score.className = 'eve-score'; score.textContent = `· ${Math.round((r.score||0)*100)}%`;
        pill.append(dot, brand, score);
        wrapper.appendChild(pill);
  (el.parentElement || el).appendChild(wrapper);
  // Remove animation class after it finishes to avoid re-triggering on class mutations
  setTimeout(() => pill.classList.remove('fade-in'), 400);
      } catch (e) { dlog('mount pill failed', e); }

      // Add ambient color aura
      if (r.score >= 0.8) el.classList.add("truste-verified");
      else if (r.score < 0.35) el.classList.add("truste-flagged");
    }
    pumpQueue();
  }
});

// 5. Observe DOM changes (for dynamic pages)
const observer = new MutationObserver(() => {
  clearTimeout(observer.debounce);
  observer.debounce = setTimeout(scanPage, 700);
});
observer.observe(document.body, { childList: true, subtree: true });

// 6. Initial scan
function scanPage() {
  const nodes = discoverReadableNodes();
  dlog("scanning…", nodes.length, "nodes");
  enqueueForScoring(nodes);
}
scanPage();

// ---- Path helpers ----
function getPath(el) {
  const path = [];
  let node = el;
  while (node && node.nodeType === 1 && path.length < 10) {
    let idx = 0, sib = node.previousElementSibling;
    while (sib) {
      if (sib.tagName === node.tagName) idx++;
      sib = sib.previousElementSibling;
    }
    path.unshift(node.tagName + ":" + idx);
    node = node.parentElement;
  }
  return path.join("/");
}

function queryPath(path) {
  try {
    const parts = path.split("/");
    let cur = document.documentElement;
    for (const p of parts) {
      const [tag, idxStr] = p.split(":");
      const idx = Number(idxStr);
      let count = -1, found = null;
      for (const child of cur.children) {
        if (child.tagName === tag) {
          count++;
          if (count === idx) { found = child; break; }
        }
      }
      if (!found) return null;
      cur = found;
    }
    return cur;
  } catch {
    return null;
  }
}
