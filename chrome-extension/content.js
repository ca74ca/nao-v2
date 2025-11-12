// Inject into PAGE world (not the isolated content-script world)
(function injectPassiveShim() {
  const code = `
  (function(){
    const origAdd = EventTarget.prototype.addEventListener;
    const passiveTypes = new Set(['scroll','wheel','touchstart','touchmove']);
    EventTarget.prototype.addEventListener = function(type, listener, options){
      try {
        if (passiveTypes.has(type)) {
          if (options === undefined) {
            options = { passive: true };
          } else if (typeof options === 'boolean') {
            options = { capture: options, passive: true };
          } else if (typeof options === 'object' && options !== null && !('passive' in options)) {
            options = Object.assign({}, options, { passive: true });
          }
        }
      } catch(e){ /* no-op */ }
      return origAdd.call(this, type, listener, options);
    };
  })();`;
  const s = document.createElement('script');
  s.textContent = code;
  (document.documentElement || document.head || document.body).appendChild(s);
  s.remove();
})();

// EVE TRUSTE — Content Script
const DEBUG = false; // flip true while dev
const dlog = (...a) => DEBUG && console.log("[TRUSTE]", ...a);

dlog("content script loaded on", location.href);

// ===== Config =====
const SCAN_INTERVAL_MS = 500;          // min delay between scans
const BATCH_MAX = 20;                  // nodes per score batch
const MAX_INFLIGHT = 2;                // concurrent batches
const ATTR_MARK = "data-truste-scanned";

// Long-lived channel to SW (survives many messages)
let port = chrome.runtime.connect({ name: "TRUSTE_PORT" });
port.onDisconnect.addListener(() => {
  // Reconnect if SW recycled
  port = chrome.runtime.connect({ name: "TRUSTE_PORT" });
});

const scoreQueue = [];
let inflight = 0;
let lastScan = 0;
let scanScheduled = false;

// ===== Utilities =====
const textish = (el) =>
  el && el.nodeType === 1 && !el.hasAttribute(ATTR_MARK) &&
  el.offsetParent !== null &&            // visible enough
  el.childNodes.length &&
  Array.from(el.childNodes).some(n => n.nodeType === 3 && n.nodeValue.trim().length > 8);

function* walkCandidates(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      return textish(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });
  let n;
  while ((n = walker.nextNode())) yield n;
}

// ===== Scoring Batching =====
function enqueueForScoring(nodes) {
  for (const node of nodes) {
    node.setAttribute(ATTR_MARK, "1");
    const text = Array.from(node.childNodes)
      .filter(n => n.nodeType === 3)
      .map(n => n.nodeValue.trim())
      .join(" ")
      .slice(0, 1000); // cap payload
    if (text) scoreQueue.push({ text, elPath: getPath(node) });
  }
  pumpQueue();
}

function pumpQueue() {
  while (inflight < MAX_INFLIGHT && scoreQueue.length) {
    const batch = scoreQueue.splice(0, BATCH_MAX);
    inflight++;
    port.postMessage({ type: "TRUSTE_SCORE_BATCH", items: batch });
  }
}

port.onMessage.addListener((msg) => {
  if (msg?.type === "TRUSTE_BATCH_RESULT") {
    inflight = Math.max(0, inflight - 1);
    // Example render hook (badge, class, etc.)
    for (const r of msg.results) {
      // Use dataset path to find node fast without layout reads
      const el = queryPath(r.elPath);
      if (!el) continue;
      el.classList.toggle("truste-flagged", r.score < 0.35);
      el.classList.toggle("truste-verified", r.score >= 0.8);
    }
    pumpQueue();
  }
});

// ===== Scanning (debounced, no reflow) =====
const scheduleScan = () => {
  if (scanScheduled) return;
  scanScheduled = true;
  const due = Math.max(0, SCAN_INTERVAL_MS - (performance.now() - lastScan));
  setTimeout(() => {
    scanScheduled = false;
    lastScan = performance.now();
    const nodes = [...walkCandidates(document.body)].slice(0, 200); // cap per pass
    dlog("scanning… nodes:", nodes.length);
    enqueueForScoring(nodes);
  }, due);
};

// Initial + mutation-driven scans
if (document.readyState === "loading") {
  addEventListener("DOMContentLoaded", scheduleScan, { passive: true, once: true });
} else {
  scheduleScan();
}

const mo = new MutationObserver((muts) => {
  // If large mutation, rescan once after quiet period
  scheduleScan();
});
mo.observe(document.documentElement, { subtree: true, childList: true, characterData: false });

// ===== Helpers (path without layout reads) =====
function getPath(el) {
  const path = [];
  let node = el;
  while (node && node.nodeType === 1 && path.length < 10) {
    let idx = 0;
    let sib = node.previousElementSibling;
    while (sib) { if (sib.tagName === node.tagName) idx++; sib = sib.previousElementSibling; }
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
          if (count === idx) { found = child; break; }
        }
      }
      if (!found) return null;
      cur = found;
    }
    return cur;
  } catch { return null; }
}

// ===== Quiet down the console =====
console.debug = DEBUG ? console.debug : () => {};
console.info  = DEBUG ? console.info  : () => {};
