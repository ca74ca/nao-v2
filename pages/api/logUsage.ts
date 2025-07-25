// /pages/api/logUsage.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subscriptionItemId, quantity = 1 } = req.body;

  if (!subscriptionItemId) {
    return res.status(400).json({ error: 'Missing subscriptionItemId' });
  }

  try {
const usageRecord = await (stripe.subscriptionItems as any).createUsageRecord(
      subscriptionItemId,
      {
        quantity,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment',
      }
    );

    return res.status(200).json({ success: true, usageRecord });
  } catch (err: any) {
    console.error('Stripe Usage Error:', err.message);
    return res.status(500).json({ error: 'Failed to log usage' });
  }
}
