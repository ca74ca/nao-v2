// pages/api/run-status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { thread_id, run_id } = req.body;

  if (!thread_id || !run_id) {
    return res.status(400).json({ error: 'Missing thread_id or run_id' });
  }

  try {
    const run = await openai.beta.threads.runs.retrieve(thread_id, run_id);

    if (run.status === 'requires_action') {
      res.status(200).json({ status: run.status, required_action: run.required_action });
    } else {
      res.status(200).json({ status: run.status });
    }
  } catch (error: any) {
    console.error('❌ [run-status Error]', error);
    res.status(error.status || 500).json({ error: error.message || 'Run status fetch failed' });
  }
}
