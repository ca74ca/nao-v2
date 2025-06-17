import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const thread = await openai.beta.threads.create();
    return res.status(200).json({ threadId: thread.id });
  } catch (error) {
    // Log error to terminal for debugging
    console.error("Error in /api/thread:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}