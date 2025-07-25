import axios from "axios";

export default async function fetchTikTokMeta(tiktokUrl: string) {
  try {
    const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`;
    const res = await axios.get(apiUrl);
    const data = res.data?.data;

    if (!data) throw new Error("TikWM failed to return metadata");

    const engagementRatio = data.digg_count / (data.play_count || 1);
    const isFraudulent =
      engagementRatio < 0.01 ||
      /(gift card|scam|crypto|win|free|bitcoin|giveaway)/i.test(data.title || "");

    return {
      username: data.author?.unique_id,
      caption: data.title,
      likes: data.digg_count,
      views: data.play_count,
      comments: data.comment_count,
      shares: data.share_count,
      isFraudulent,
    };
  } catch (err) {
    console.error("❌ fetchTikTokMeta error:", err.message);
    throw err;
  }
}
