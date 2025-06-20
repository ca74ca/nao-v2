import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const thread = await openai.beta.threads.create();

    // 🔍 Log the thread object
    console.log("🧵 Created thread object:", thread);

    if (!thread || !thread.id) {
      console.error("❌ Failed to get thread.id from OpenAI response");
      return res.status(500).json({ error: "Invalid thread creation response" });
    }

    return res.status(200).json({ threadId: thread.id });
  } catch (error) {
    console.error("❌ Error in /api/thread:", error);
    return res.status(500).json({ error: "Internal Server Error", detail: (error as Error).message });
  }
}
