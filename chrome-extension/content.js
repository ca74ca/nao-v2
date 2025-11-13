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

// 1. Discover meaningful text nodes on any site
function discoverReadableNodes(root = document.body, limit = 400) {
  const found = [];
  if (!root) return found;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      try {
        // Visibility guard
        let style;
        try {
          style = window.getComputedStyle(node);
        } catch {
          return NodeFilter.FILTER_SKIP;
        }
        if (style && (style.display === "none" || style.visibility === "hidden")) {
          return NodeFilter.FILTER_REJECT;
        }

        // ---- UGC Detection Filter ----
        const tag = node.tagName.toLowerCase();
        const className = node.className || "";
        const id = node.id || "";
        const role = node.getAttribute("role") || "";

        // Skip structural/navigation elements
        if (["nav", "header", "footer", "aside", "form", "button", "input", "select"].includes(tag)) {
          return NodeFilter.FILTER_REJECT;
        }

        // Skip by role
        if (/(button|menu|navigation|banner|complementary|contentinfo|search|toolbar)/i.test(role)) {
          return NodeFilter.FILTER_REJECT;
        }

        // Skip common UI chrome patterns
        if (/(sidebar|topbar|navbar|menu|header|footer|ad|promo|widget|toolbar|breadcrumb|pagination|vote|score|karma|points|upvote|downvote)/i
          .test(className + " " + id)) {
          return NodeFilter.FILTER_REJECT;
        }

        const text = (node.innerText || "").trim();
        const len = text.length;
        if (!len) return NodeFilter.FILTER_SKIP;

        // Too short / huge
        if (len < 8) return NodeFilter.FILTER_SKIP;
        if (len > 5000) return NodeFilter.FILTER_SKIP;

        // Skip boilerplate
        if (/(©|cookie|sign in|log in|terms|privacy|all rights reserved|sponsored|advertisement)/i.test(text)) {
          return NodeFilter.FILTER_SKIP;
        }

        // Skip pure numbers / counts
        if (/^[\d,.\sKkMm%+:-]+$/.test(text)) return NodeFilter.FILTER_SKIP;

        // Skip bare usernames / handles
        if (/^(u\/|r\/|@)[^\s]+$/.test(text)) return NodeFilter.FILTER_SKIP;

        // Require some letters
        const letters = (text.match(/[A-Za-z]/g) || []).length;
        if (letters < 4) return NodeFilter.FILTER_SKIP;

        // ---- Positive UGC signals ----
        const ugcPattern = /(comment|post|reply|review|message|caption|description|body|content|text|article)/i;
        const hasUGCClass = ugcPattern.test(className + " " + id);
        const hasUGCRole = role === "article" || role === "main";
        const parent = node.parentElement;
        const parentHasUGC =
          parent &&
          ugcPattern.test((parent.className || "") + " " + (parent.id || ""));

        if (hasUGCClass || hasUGCRole || parentHasUGC) {
          return NodeFilter.FILTER_ACCEPT; // comments, posts, reviews, etc.
        }

        // Generic “substantial UGC” fallback
        if (len >= 30 && letters >= 15) {
          return NodeFilter.FILTER_ACCEPT;
        }

        return NodeFilter.FILTER_SKIP;
      } catch (e) {
        DEBUG && console.warn("[TRUSTE] acceptNode error", e);
        return NodeFilter.FILTER_SKIP;
      }
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

      try {
        const label =
          r.score >= 0.8 ? "human" : r.score <= 0.35 ? "ai" : "likely-human";

        const wrapper = document.createElement("span");
        wrapper.className = "eve-wrap";

        const pill = document.createElement("span");
        pill.className = "eve-pill fade-in";
        pill.setAttribute("data-level", label);

        const dot = document.createElement("span");
        dot.className = "eve-dot";

        const brand = document.createElement("span");
        brand.className = "eve-brand";
        brand.textContent = "TRUSTE";

        const score = document.createElement("span");
        score.className = "eve-score";
        score.textContent = `· ${Math.round((r.score || 0) * 100)}%`;

        pill.append(dot, brand, score);
        wrapper.appendChild(pill);

        (el.parentElement || el).appendChild(wrapper);

        setTimeout(() => pill.classList.remove("fade-in"), 400);
      } catch (e) {
        dlog("mount pill failed", e);
      }

      // Ambient color aura
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

function startTruste() {
  if (!document.body) {
    // In weird documents, wait for body
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        if (!document.body) return;
        observer.observe(document.body, { childList: true, subtree: true });
        scanPage();
      },
      { once: true }
    );
  } else {
    observer.observe(document.body, { childList: true, subtree: true });
    scanPage();
  }
}

// 6. Initial scan
function scanPage() {
  const nodes = discoverReadableNodes();
  dlog("scanning…", nodes.length, "nodes");
  enqueueForScoring(nodes);
}

startTruste();

// ---- Path helpers ----
function getPath(el) {
  const path = [];
  let node = el;
  while (node && node.nodeType === 1 && path.length < 10) {
    let idx = 0;
    let sib = node.previousElementSibling;
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
      let count = -1;
      let found = null;
      for (const child of cur.children) {
        if (child.tagName === tag) {
          count++;
          if (count === idx) {
            found = child;
            break;
          }
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
