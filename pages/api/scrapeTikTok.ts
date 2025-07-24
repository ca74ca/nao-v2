import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import cheerio from "cheerio";

puppeteer.use(StealthPlugin());

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;

  if (!url || typeof url !== "string" || !url.includes("tiktok.com")) {
    return res.status(400).json({ error: "Missing or invalid TikTok URL" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new", // More robust against TikTok detection
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114 Safari/537.36"
    );

    // Use domcontentloaded for more resilient TikTok scraping
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Wait for the __NEXT_DATA__ script to appear (max 30s)
    await page.waitForSelector('script#__NEXT_DATA__', { timeout: 30000 });

    const html = await page.content();
    const $ = cheerio.load(html);
    const rawJson = $('script#__NEXT_DATA__').html();

    if (!rawJson) {
      console.error("No __NEXT_DATA__ script found. HTML length:", html.length);
      throw new Error("No __NEXT_DATA__ script found");
    }

    const jsonData = JSON.parse(rawJson);
    const video = jsonData.props?.pageProps?.itemInfo?.itemStruct;
    if (!video) {
      console.error("TikTok video data not found. JSON keys:", Object.keys(jsonData.props?.pageProps || {}));
      throw new Error("TikTok video data not found");
    }

    const metadata = {
      id: video.id,
      caption: video.desc,
      hashtags: Array.isArray(video.textExtra)
        ? video.textExtra.map((t: any) => t.hashtagName)
        : [],
      duration: video.video.duration,
      createTime: video.createTime,
      stats: video.stats,
      author: {
        username: video.author.uniqueId,
        nickname: video.author.nickname,
        verified: video.author.verified,
      },
    };

    await browser.close();
    res.status(200).json({ metadata });
  } catch (err: any) {
    if (browser) await browser.close();
    console.error("Scrape error:", err.message);
    res.status(500).json({ error: "Failed to scrape TikTok URL", details: err.message });
  }
}