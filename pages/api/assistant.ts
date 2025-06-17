// pages/api/assistant.ts
import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { thread_id } = req.body;

  if (!thread_id || !thread_id.startsWith("thread_")) {
    console.error("❌ Missing or invalid thread_id", thread_id);
    return res.status(400).json({ error: "Missing or invalid thread_id" });
  }

  try {
    const run = await openai.beta.threads.runs.create(thread_id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID!,
    });

    res.status(200).json({ run_id: run.id });
  } catch (error: any) {
    console.error("❌ [Assistant Trigger Error]", error);
    res.status(500).json({ error: "Failed to trigger assistant", details: error.message });
  }
}
