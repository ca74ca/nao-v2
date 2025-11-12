const API = "https://nao-sdk-api.onrender.com";

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg.type !== "EVE_SCORE_BATCH") return;
    const results = [];
    for (const item of msg.items) {
      const r = await fetch(`${API}/api/scoreEffort`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: item.text,
          url: item.context?.url,
          platform: item.context?.platform
        })
      });
      let j;
      try { j = await r.json(); } catch { j = { score: 0, label: "human" }; }
      results.push({ id: item.id, ...j });
    }
    sendResponse({ ok: true, results });
  })();
  return true;
});