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

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114 Safari/537.36"
    );
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const html = await page.content();
    const $ = cheerio.load(html);
    const rawJson = $('script#__NEXT_DATA__').html();
    if (!rawJson) throw new Error("No __NEXT_DATA__ script found");

    const jsonData = JSON.parse(rawJson);
    const video = jsonData.props?.pageProps?.itemInfo?.itemStruct;
    if (!video) throw new Error("TikTok video data not found");

    const metadata = {
      id: video.id,
      caption: video.desc,
      hashtags: video.textExtra.map((t: any) => t.hashtagName),
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
    console.error("Scrape error:", err.message);
    res.status(500).json({ error: "Failed to scrape TikTok URL" });
  }
}
