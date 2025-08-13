// utils/runEffortScore.ts
import fetch from "node-fetch";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

export interface ContentMetadata {
  platform: string;
  url: string;
  followerCount?: number;
  engagementRate?: number;
  commentCount?: number;
  viewCount?: number;
  uploadDate?: string;
  description?: string;
  arkhamData?: any;
  plaidData?: any;
  effortScore?: number;
}

// ---------- utilities ----------

function parseCompactNumber(txt?: string | null): number {
  if (!txt) return 0;
  const t = txt.replace(/[, ]/g, "").toUpperCase().trim();
  const m = /^([0-9]*\.?[0-9]+)([KMB])?$/.exec(t);
  if (!m) {
    // last resort: digits only
    const n = parseInt(t.replace(/\D/g, ""), 10);
    return isNaN(n) ? 0 : n;
  }
  const num = parseFloat(m[1]);
  const unit = m[2];
  if (unit === "K") return Math.round(num * 1_000);
  if (unit === "M") return Math.round(num * 1_000_000);
  if (unit === "B") return Math.round(num * 1_000_000_000);
  return Math.round(num);
}

function getPlatformFromUrl(url: string): string | null {
  const u = (url || "").trim().toLowerCase();
  if (u.includes("tiktok.com")) {
    if (u.includes("/shop/")) return "tiktok_shop";
    return "tiktok";
  }
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("reddit.com")) return "reddit";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("amazon.") && /\/dp\/|\/gp\//.test(u)) return "amazon";
  if (u.includes("etherscan.io") || u.includes("polygonscan.com")) return "web3";
  return null;
}

async function fetchJSON(url: string, headers?: Record<string, string>) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} (${txt?.slice(0, 200)})`);
  }
  return res.json();
}

async function launchBrowser() {
  // Keep args minimal for Render; add proxies here if needed.
  return puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--single-process",
    ],
  });
}

async function prepPage(page: any) {
  // Reasonable desktop UA + viewport; helps TikTok/IG.
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  );
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 });
  // Reduce noise
  await page.setRequestInterception(true);
  page.on("request", (req: any) => {
    const type = req.resourceType();
    // Block heavy/irrelevant resources to speed up & reduce detection
    if (["image", "media", "font"].includes(type)) return req.abort();
    return req.continue();
  });
}

// ---------- scrapers ----------

async function scrapeTikTok(url: string): Promise<{ views: number; comments: number; description?: string; uploadDate?: string }> {
  let browser: any;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await prepPage(page);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });

    // Try to grab counters from known attributes and common fallbacks.
    const data = await page.evaluate(() => {
      function getNum(selList: string[]): number {
        for (const sel of selList) {
          const el = document.querySelector(sel) as HTMLElement | null;
          if (el && el.textContent) {
            const raw = el.textContent.trim();
            const m = raw.replace(/[, ]/g, "").toUpperCase();
            // compact parser in page context
            const mm = /^([0-9]*\.?[0-9]+)([KMB])?$/.exec(m);
            if (mm) {
              const num = parseFloat(mm[1]);
              if (mm[2] === "K") return Math.round(num * 1_000);
              if (mm[2] === "M") return Math.round(num * 1_000_000);
              if (mm[2] === "B") return Math.round(num * 1_000_000_000);
              return Math.round(num);
            }
            const d = parseInt(raw.replace(/\D/g, ""), 10);
            if (!isNaN(d)) return d;
          }
        }
        return 0;
      }

      const views = getNum([
        'strong[data-e2e="video-views"]',
        'div[data-e2e="browse-video-views"]',
        '[data-e2e="like-share-counts"] strong', // sometimes packed
        '.video-count',
      ]);

      const comments = getNum([
        'strong[data-e2e="comment-count"]',
        'button[data-e2e="comment-icon"] ~ strong',
        '.comment-count',
      ]);

      // try description / date
      const descMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      const description = descMeta?.content || undefined;

      let uploadDate: string | undefined;
      const timeEl = document.querySelector("time") as HTMLTimeElement | null;
      if (timeEl?.dateTime) uploadDate = new Date(timeEl.dateTime).toISOString();

      return { views, comments, description, uploadDate };
    });

    return data;
  } catch (err: any) {
    throw new Error("TikTok scrape failed: " + (err?.message || String(err)));
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

async function scrapeInstagram(url: string): Promise<{ followerCount?: number; description?: string }> {
  let browser: any;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await prepPage(page);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });

    const data = await page.evaluate(() => {
      // Try meta first to avoid login wall parsing
      const meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      let description = meta?.content || undefined;

      // follower count (profile pages)
      let followerCount: number | undefined;
      // Common pattern: <meta content="... Followers, ... Following, ... Posts ...">
      if (meta?.content) {
        const m = /([\d.,KMB]+)\s+Followers/i.exec(meta.content);
        if (m) {
          const t = m[1].toUpperCase().replace(/[, ]/g, "");
          const mm = /^([0-9]*\.?[0-9]+)([KMB])?$/.exec(t);
          if (mm) {
            const num = parseFloat(mm[1]);
            if (mm[2] === "K") followerCount = Math.round(num * 1_000);
            else if (mm[2] === "M") followerCount = Math.round(num * 1_000_000);
            else if (mm[2] === "B") followerCount = Math.round(num * 1_000_000_000);
            else followerCount = Math.round(num);
          }
        }
      }

      // fallback: visible counters
      if (!followerCount) {
        const el = document.querySelector('header section ul li a span') as HTMLElement | null;
        if (el?.textContent) {
          const digits = el.textContent.replace(/\s/g, "");
          const mm = /^([0-9]*\.?[0-9]+)([KMB])?$/i.exec(digits.toUpperCase());
          if (mm) {
            const num = parseFloat(mm[1]);
            const unit = mm[2]?.toUpperCase();
            if (unit === "K") followerCount = Math.round(num * 1_000);
            else if (unit === "M") followerCount = Math.round(num * 1_000_000);
            else if (unit === "B") followerCount = Math.round(num * 1_000_000_000);
            else followerCount = Math.round(num);
          } else {
            const d = parseInt(digits.replace(/\D/g, ""), 10);
            if (!isNaN(d)) followerCount = d;
          }
        }
      }

      return { followerCount, description };
    });

    return data;
  } catch (err: any) {
    throw new Error("Instagram scrape failed: " + (err?.message || String(err)));
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

async function scrapeAmazon(url: string): Promise<{ description?: string }> {
  let browser: any;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await prepPage(page);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });

    const description = await page.evaluate(() => {
      const title =
        (document.querySelector("#productTitle") as HTMLElement | null)?.textContent?.trim() ||
        (document.querySelector("#title") as HTMLElement | null)?.textContent?.trim() ||
        undefined;
      return title;
    });

    return { description };
  } catch (err: any) {
    throw new Error("Amazon scrape failed: " + (err?.message || String(err)));
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

// ---------- main ----------

export async function runEffortScore(sourceType: string, url: string): Promise<ContentMetadata> {
  const platform = getPlatformFromUrl(url);

  if (!platform || platform !== sourceType.toLowerCase()) {
    throw new Error(
      `URL (${url}) does not match provided sourceType (${sourceType}) or is not supported.`
    );
  }

  switch (platform) {
    case "reddit": {
      // Public JSON feed (works for posts & comments)
      const apiUrl = url.endsWith(".json") ? url : `${url}.json`;
      const data = await fetchJSON(apiUrl, { "User-Agent": "EVE-Verifier/1.0" });

      // Try typical shapes
      let post: any =
        (Array.isArray(data) && data[0]?.data?.children?.[0]?.data) ||
        (typeof data === "object" && data !== null && "data" in data && (data as any).data?.children?.[0]?.data) ||
        null;

      const viewCount = post?.view_count ?? 0;
      const commentCount = post?.num_comments ?? 0;
      const uploadDate = post?.created_utc
        ? new Date(post.created_utc * 1000).toISOString()
        : undefined;
      const description = post?.title || post?.selftext || undefined;

      return {
        platform,
        url,
        viewCount,
        commentCount,
        uploadDate,
        description,
        effortScore: viewCount * 0.001 + commentCount * 0.2,
      };
    }

    case "tiktok":
    case "tiktok_shop": {
      const { views, comments, description, uploadDate } = await scrapeTikTok(url);
      return {
        platform,
        url,
        viewCount: views,
        commentCount: comments,
        uploadDate,
        description,
        effortScore: views * 0.001 + comments * 0.2,
      };
    }

    case "instagram": {
      const { followerCount, description } = await scrapeInstagram(url);
      return {
        platform,
        url,
        followerCount,
        description,
        effortScore: (followerCount || 0) * 0.001, // tune as needed
      };
    }

    case "amazon": {
      const { description } = await scrapeAmazon(url);
      return {
        platform,
        url,
        description,
        effortScore: 1, // placeholder scoring for Amazon
      };
    }

    case "youtube": {
      // Free oEmbed; for real metrics wire YouTube Data API
      const apiUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const data = await fetchJSON(apiUrl) as { title?: string };
      return {
        platform,
        url,
        description: data?.title,
        effortScore: 1, // placeholder
      };
    }

    case "web3": {
      // Placeholder for Etherscan/Polygonscan integration
      return {
        platform,
        url,
        effortScore: 1,
      };
    }

    default:
      throw new Error(`No hybrid scrape strategy yet for ${platform}`);
  }
}
