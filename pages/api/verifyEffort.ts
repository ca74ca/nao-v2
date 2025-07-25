// /pages/api/verifyEffort.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { content, wallet, subscriptionItemId } = req.body;

  if (!content || !wallet) {
    return res.status(400).json({ error: 'Missing content or wallet' });
  }

  // 🧠 MOCK: Fake effort score + fraud logic
  const effortScore = Math.floor(Math.random() * 40) + 60; // Random 60–100
  const fraudSignal = effortScore < 70;

  // 💸 Stripe metered billing
  if (subscriptionItemId) {
    try {
      await (stripe.subscriptionItems as any).createUsageRecord(subscriptionItemId, {
        quantity: 1,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment',
      });
      console.log('✅ Logged $0.01 usage to Stripe');
    } catch (err: any) {
      console.error('❌ Failed to log usage:', err.message);
    }
  }

  return res.status(200).json({
    effortScore,
    fraudSignal,
    message: fraudSignal ? '⚠️ Possible AI or low-effort content' : '✅ Human effort detected',
  });
}
