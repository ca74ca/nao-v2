// /pages/api/verifyEffort.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe'; // Assuming this path is correct for your Stripe initialization

import { runEffortScore } from '../../utils/runEffortScore';
import { calculateEffortScore } from '../../utils/effortRecipe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, sourceType, wallet, subscriptionItemId } = req.body;

  if (!url || !sourceType) {
    return res.status(400).json({ error: 'Missing url or sourceType' });
  }

  try {
    // Step 1: Pull public data from TikTok, Reddit, YouTube, etc., using Decodos
    // The runEffortScore function will handle the actual API calls to Decodos
    const metadata = await runEffortScore(sourceType, url);
    console.log('Collected Metadata:', metadata);

    // Step 2: Score the content based on the collected metadata and your 'Proof of Human' recipe
    // The calculateEffortScore function will contain your proprietary logic
    const { score, reasons } = calculateEffortScore(metadata);
    const fraudSignal = score < 70; // Example threshold for fraud detection

    // Step 3: Log usage to Stripe (optional)
    if (subscriptionItemId) {
      try {
        await (stripe.subscriptionItems as any).createUsageRecord(subscriptionItemId, {
          quantity: 1,
          timestamp: Math.floor(Date.now() / 1000),
          action: 'increment',
        });
        console.log('✅ Logged $0.01 usage to Stripe');
      } catch (err: any) {
        console.error('❌ Failed to log Stripe usage:', err.message);
        // In a live environment, you might want to log this error to a monitoring service
        // but still proceed with the verification result if the core logic was successful.
      }
    }

    // Step 4: Return full response
    return res.status(200).json({
      score,
      fraudSignal,
      message: fraudSignal ? '⚠️ Possible AI or low-effort content' : '✅ Human effort detected',
      reasons, // Provide specific reasons for the score
      metadata, // Include the raw metadata for debugging/transparency if needed
    });
  } catch (err: any) {
    console.error('❌ Scoring error:', err.message);
    // Return a 500 status for internal server errors during the scoring process
    return res.status(500).json({ error: `Failed to score effort: ${err.message}` });
  }
}
