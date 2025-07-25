import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { content, timestamp, likes, views, accountInfo } = req.body;

  if (!content || !timestamp || !likes || !views || !accountInfo) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const engagementRatio = likes / views;
  const hourPosted = new Date(timestamp).getHours();
  const temporalAnomaly = hourPosted < 5 || hourPosted > 23;
  const repeatedBio = accountInfo?.bio?.includes("DM for promos") || false;

  try {
    // AI scoring (detects LLM writing, low-effort tone, scam)
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a fraud and effort-detection model that evaluates UGC content for signs of AI-generation, low effort, or scam risk.`,
        },
        {
          role: "user",
          content: `Content: "${content}"\nBio: "${accountInfo.bio}"\nUsername: "${accountInfo.username}"\nLikes: ${likes}\nViews: ${views}\nPosted Hour: ${hourPosted}`,
        },
      ],
      temperature: 0.2,
    });

    const aiVerdict = aiResponse.choices[0].message.content || "Unknown";

    const isLowEffort =
      engagementRatio < 0.01 ||
      aiVerdict.toLowerCase().includes("likely ai") ||
      aiVerdict.toLowerCase().includes("low effort") ||
      repeatedBio ||
      temporalAnomaly;

    const result = {
      engagementRatio: engagementRatio.toFixed(4),
      temporalAnomaly,
      repeatedBio,
      aiVerdict,
      isLowEffort,
    };

    // Save to DB
    const { db } = await connectToDatabase();
    await db.collection("effortEvaluations").insertOne({
      ...result,
      content,
      timestamp: new Date(timestamp),
      accountInfo,
      createdAt: new Date(),
    });

    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Effort scoring error:", err.message);
    return res.status(500).json({ error: "Failed to score effort", details: err.message });
  }
}
