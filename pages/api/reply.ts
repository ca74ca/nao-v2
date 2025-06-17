// pages/api/reply.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { thread_id } = req.body;

  if (!thread_id || !thread_id.startsWith("thread_")) {
    return res.status(400).json({ error: "Missing or invalid thread_id" });
  }

  try {
    const messages = await openai.beta.threads.messages.list(thread_id);
    const lastMessage = messages.data.reverse().find(m => m.role === 'assistant');

    const reply = lastMessage?.content?.[0]?.text?.value || '⚠️ No reply found.';
    res.status(200).json({ reply });
  } catch (error: any) {
    console.error('❌ [Reply API Error]', error);
    res.status(500).json({ error: error.message || 'Failed to fetch reply.' });
  }
}
