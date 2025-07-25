import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import OpenAI from "openai";
import { stripe } from "@/lib/stripe";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { content, timestamp, likes, views, accountInfo, subscriptionItemId } = req.body;

  if (!content || !timestamp || !likes || !views || !accountInfo) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const engagementRatio = likes / views;
  const hourPosted = new Date(timestamp).getHours();
  const temporalAnomaly = hourPosted < 5 || hourPosted > 23;
  const repeatedBio = accountInfo?.bio?.toLowerCase().includes("dm for promos") || false;

  try {
    // OpenAI fraud evaluation
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
      aiVerdict.toLowerCase().includes("scam") ||
      repeatedBio ||
      temporalAnomaly;

    const effortScore = isLowEffort ? (repeatedBio && engagementRatio < 0.005 ? 0.06 : 0.22) : 0.94;
    const badge = effortScore < 0.1
      ? "🚨 EXTREME FRAUD RISK"
      : isLowEffort
      ? "🚫 LOW EFFORT / LIKELY FAKE"
      : "✅ VERIFIED HUMAN CONTENT";

    const result = {
      engagementRatio: engagementRatio.toFixed(4),
      temporalAnomaly,
      repeatedBio,
      aiVerdict,
      isLowEffort,
      fraudSignal: isLowEffort,
      effortScore,
      badge,
      insights: {
        reason: isLowEffort
          ? "Flagged due to suspicious engagement, bio repetition, or AI-generated language."
          : "Passed all effort checks with healthy engagement and human tone.",
        factors: {
          engagementRatio,
          temporalAnomaly,
          repeatedBio,
          aiVerdict,
        },
      },
      poweredBy: "EffortNet — The Internet's Trust Layer",
      branding: {
        overlay: isLowEffort
          ? "FAKE ⚠️ Likely Scam — EffortNet Verified"
          : "REAL ✅ Effort Verified",
        source: "https://naoverse.io",
      },
    };

    // Save to MongoDB
    const { db } = await connectToDatabase();
    await db.collection("effortEvaluations").insertOne({
      ...result,
      content,
      timestamp: new Date(timestamp),
      accountInfo,
      createdAt: new Date(),
    });

    // Optional: Stripe metered billing
    if (subscriptionItemId) {
      try {
        await (stripe.subscriptionItems as any).createUsageRecord(subscriptionItemId, {
          quantity: 1,
          timestamp: Math.floor(Date.now() / 1000),
          action: "increment",
        });
        console.log("💸 Logged usage to Stripe");
      } catch (err: any) {
        console.error("❌ Stripe billing failed:", err.message);
      }
    }

    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Effort scoring error:", err.message);
    return res.status(500).json({ error: "Failed to score effort", details: err.message });
  }
}
