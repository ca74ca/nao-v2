// pages/api/submit-tool-output.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { thread_id, run_id, tool_outputs } = req.body;

  if (!thread_id || !run_id || !tool_outputs || !Array.isArray(tool_outputs)) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const run = await openai.beta.threads.runs.submitToolOutputs(thread_id, run_id, {
      tool_outputs,
    });

    res.status(200).json({ status: run.status });
  } catch (error: any) {
    console.error('[Tool Output Error]', error);
    res.status(500).json({ error: error.message || 'Failed to submit tool output.' });
  }
}
