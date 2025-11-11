const DEFAULT_API = "https://nao-sdk-api.onrender.com";

async function getCfg() {
  return new Promise(res => chrome.storage.sync.get(
    { truste_api: DEFAULT_API, truste_key: "" },
    cfg => res(cfg)
  ));
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg.type !== "TRUSTE_SCORE_BATCH") return;

    const { truste_api, truste_key } = await getCfg();
    const endpoint = `${truste_api.replace(/\/+$/,"")}/api/scoreEffort`; // or /api/scoreContent

    // process sequentially to be gentle on API; you can parallelize if needed
    const results = [];
    for (const item of msg.items) {
      try {
        const r = await fetch(endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(truste_key ? { "x-api-key": truste_key } : {})
          },
          body: JSON.stringify({
            text: item.text,
            url: item.context?.url,
            platform: item.context?.platform
          })
        });
        const j = await r.json().catch(() => ({}));
        results.push({ id: item.id, ...j });
      } catch (e) {
        results.push({ id: item.id, error: String(e) });
      }
    }
    sendResponse({ ok: true, results });
  })();
  return true; // keep channel open
});
