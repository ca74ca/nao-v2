const SITES = {
  "www.reddit.com": {
    find: () => Array.from(document.querySelectorAll('[data-test-id="comment"] p, .Comment div[data-click-id="text"]')),
    text: el => el.innerText || "",
    mount: (el, badge) => el.closest('[data-test-id="comment"]')?.appendChild(badge),
    platform: "reddit"
  },
  "www.tiktok.com": {
    find: () => Array.from(document.querySelectorAll('[data-e2e="comment-level-1"] [data-e2e="comment-level-1-text"]')),
    text: el => el.innerText || "",
    mount: (el, badge) => el.parentElement?.appendChild(badge),
    platform: "tiktok"
  },
  "www.amazon.com": {
    find: () => Array.from(document.querySelectorAll('.review[data-hook="review"] .review-text')),
    text: el => el.innerText || "",
    mount: (el, badge) => el.parentElement?.insertBefore(badge, el),
    platform: "amazon"
  }
};

const site = SITES[location.host];
if (!site) { console.debug("[EVE] unsupported host", location.host); }

function makeBadge(label = "human", score = 0){
  const host = document.createElement('span');
  const shadow = host.attachShadow({ mode: 'open' });
  const pill = document.createElement('span');
  pill.className = 'eve-badge';
  pill.setAttribute('data-level', label);
  pill.textContent = `EVE: ${label} · ${Math.round(score*100)}%`;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('badge.css');
  shadow.appendChild(link);
  shadow.appendChild(pill);
  return host;
}

const seen = new WeakSet();

function batchScore(nodes){
  const items = nodes.map(el => ({
    id: el.dataset.eveId = el.dataset.eveId || Math.random().toString(36).slice(2),
    text: site.text(el).slice(0, 1000),
    context: { platform: site.platform, url: location.href }
  })).filter(x => x.text.length > 3);

  if (!items.length) return;

  chrome.runtime.sendMessage({ type: "EVE_SCORE_BATCH", items }, ({ ok, results }) => {
    if (!ok || !results) return;
    for (const r of results) {
      const el = document.querySelector(`[data-eve-id="${r.id}"]`) || nodes.find(n => n.dataset.eveId === r.id);
      if (!el) continue;
      const label = r.label || (r.score >= 0.66 ? "suspicious" : r.score >= 0.4 ? "ai" : "human");
      try { site.mount(el, makeBadge(label, r.score ?? 0)); } catch (e) { console.warn("[EVE] mount failed", e); }
    }
  });
}

function scan(){
  if (!site) return;
  const nodes = site.find().filter(el => !seen.has(el));
  nodes.forEach(el => seen.add(el));
  if (nodes.length) batchScore(nodes);
}

// initial + on scroll + DOM changes
scan();
let t=null;
document.addEventListener("scroll", () => { if (t) return; t=setTimeout(()=>{t=null;scan();}, 500); }, { passive:true });
new MutationObserver(()=>scan()).observe(document.body, { subtree:true, childList:true });
