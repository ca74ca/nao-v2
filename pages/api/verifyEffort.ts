// /pages/api/verifyEffort.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { runEffortScore } from '@/utils/runEffortScore';
import { calculateEffortScore } from '@/utils/effortRecipe';

// Minimal detector (kept local to avoid imports)
function detectPlatformFromURL(rawUrl: string | undefined) {
  const url = (rawUrl || '').toLowerCase();
  if (!url) return 'unknown';
  if (url.includes('tiktok.com')) return url.includes('/shop/') ? 'tiktok_shop' : 'tiktok';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('reddit.com')) return 'reddit';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('amazon.') && /\/(dp|gp)\//.test(url)) return 'amazon';
  if (url.includes('etherscan.io') || url.includes('polygonscan.com')) return 'web3';
  return 'web';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Accept both clean and UI payload shapes
  let {
    url,
    sourceType,
    value,
    platformHint,
    mode,
    wallet,                // kept for parity with scoreEffort (not required)
    subscriptionItemId,    // optional Stripe usage logging
  } = (req.body || {}) as any;

  if (!url && value) url = value;
  if (!sourceType) sourceType = platformHint || mode || detectPlatformFromURL(url);

  if (!url) {
    return res.status(400).json({ error: 'Missing url' });
  }
  if (!sourceType || sourceType === 'unknown') {
    sourceType = detectPlatformFromURL(url);
  }

  try {
    // Step 1: Collect public data via **hybrid pipeline**:
    // - Public/Open APIs first (Reddit JSON, YouTube oEmbed, etc.)
    // - Self-hosted Puppeteer/Playwright scrapers for TikTok/Instagram/Amazon
    const metadata = await runEffortScore(sourceType, url);
    console.log('[verifyEffort] Collected metadata:', { platform: metadata.platform, url: metadata.url });

    // Step 2: Score using your Proof-of-Human recipe (hybrid heuristics)
    const { score, reasons, tags } = await calculateEffortScore(metadata);
    const fraudSignal = score < 70;

    // Step 3: Optional Stripe metering
    if (subscriptionItemId) {
      try {
        await (stripe.subscriptionItems as any).createUsageRecord(subscriptionItemId, {
          quantity: 1,
          timestamp: Math.floor(Date.now() / 1000),
          action: 'increment',
        });
        console.log('[verifyEffort] Stripe usage logged');
      } catch (err: any) {
        console.error('[verifyEffort] Stripe usage error:', err?.message || err);
        // non-fatal
      }
    }

    // Step 4: Return result
    return res.status(200).json({
      score,
      fraudSignal,
      message: fraudSignal ? '⚠️ Possible AI or low-effort content' : '✅ Human effort detected',
      reasons,
      tags,
      metadata,
    });
  } catch (err: any) {
    console.error('[verifyEffort] Error:', err?.message || err);
    return res.status(500).json({ error: `Failed to score effort: ${err?.message || 'Unknown error'}` });
  }
}
