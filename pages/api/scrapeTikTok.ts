import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { connectToDatabase } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing TikTok URL" });
  }

  try {
    const proxyUrl = `https://naoverse.io/api/proxyFetchTikTok?url=${encodeURIComponent(url)}`;
    const response = await axios.get(proxyUrl);
    const meta = response.data;

    const { db } = await connectToDatabase();
    await db.collection("fraudEvents").insertOne({
      url,
      scrapedAt: new Date(),
      ...meta
    });

    return res.status(200).json({ success: true, data: meta });
  } catch (err: any) {
    console.error("❌ scrapeTikTok error:", err.message);
    return res.status(500).json({ error: "Failed to scrape TikTok metadata" });
  }
}
