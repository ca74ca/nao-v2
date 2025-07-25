// ✅ pages/api/scrapeTikTok.ts
import { NextApiRequest, NextApiResponse } from "next";
import scrapeTikTokMeta from "@/lib/scrapeTikTokMeta";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { url } = req.query;

  if (!url || typeof url !== "string" || !url.includes("tiktok.com")) {
    return res
      .status(400)
      .json({ error: "Missing or invalid TikTok video URL." });
  }

  try {
    const metadata = await scrapeTikTokMeta(url);
    return res.status(200).json({ success: true, metadata });
  } catch (error: any) {
    console.error("🔥 Scrape failed:", error.message || error);
    return res.status(500).json({
      error: "Failed to scrape TikTok metadata",
      reason: error.message || "Unknown error",
    });
  }
}
