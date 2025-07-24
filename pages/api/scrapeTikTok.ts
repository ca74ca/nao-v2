// /pages/api/scrapeTikTok.ts
import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import cheerio from "cheerio";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing or invalid TikTok URL" });
  }

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/89 Safari/537.36",
      },
    });

    const $ = cheerio.load(html);
    const rawJson = $('script#__NEXT_DATA__').html();
    if (!rawJson) throw new Error("No embedded data found");

    const jsonData = JSON.parse(rawJson);
    const video = jsonData.props.pageProps.itemInfo.itemStruct;

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

    res.status(200).json({ metadata });
  } catch (err) {
    console.error("Scrape error:", err);
    res.status(500).json({ error: "Failed to scrape TikTok URL" });
  }
}
