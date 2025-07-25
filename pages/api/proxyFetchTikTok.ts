import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing or invalid TikTok URL" });
  }

  try {
    const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl);
    const data = response.data?.data;

    if (!data) {
      return res.status(500).json({ error: "TikWM failed to return metadata" });
    }

    const engagementRatio = data.digg_count / (data.play_count || 1);
    const isFraudulent =
      engagementRatio < 0.01 ||
      /(gift card|scam|crypto|win|free|bitcoin|giveaway)/i.test(data.title || "");

    return res.status(200).json({
      username: data.author?.unique_id,
      caption: data.title,
      likes: data.digg_count,
      views: data.play_count,
      comments: data.comment_count,
      shares: data.share_count,
      isFraudulent,
    });
  } catch (err: any) {
    console.error("Proxy fetch error:", err.message);
    return res.status(500).json({ error: "Server failed to fetch metadata" });
  }
}
