// pages/api/scoreEffort.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import authOptions from './auth/[...nextauth]';
import { stripe } from '@/lib/stripe';
import { runEffortScore } from '@/utils/runEffortScore';
import { calculateEffortScore } from '@/utils/effortRecipe';
const { connect } = require('../../backend/db');

// 🔍 Helper: Detect platform from URL
function detectPlatformFromURL(url: string) {
  const patterns: Record<string, RegExp> = {
    instagram: /instagram\.com/i,
    amazon: /amazon\.[a-z.]+/i,
    tiktokShop: /tiktok\.com\/.*shop/i,
  };
  for (const [platform, regex] of Object.entries(patterns)) {
    if (regex.test(url)) return platform;
  }
  return 'unknown';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ✅ Optional: Allow guest use but try to get session
  const session = await getServerSession(req, res, authOptions) as { user?: { email?: string } } | null;
  const userEmail = session?.user?.email || null;

  let { url, sourceType, wallet, subscriptionItemId } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  // Auto-detect platform if not provided
  const detectedPlatform = detectPlatformFromURL(url);
  if (!sourceType || sourceType === 'unknown') sourceType = detectedPlatform;

  // Require wallet for Web3 scoring, allow skip for e-commerce/social
  if (!wallet && ['instagram', 'amazon', 'tiktokShop'].indexOf(sourceType) === -1) {
    return res.status(400).json({ error: 'Missing wallet for Web3 sources' });
  }

  // 🔐 STEP 1: Check MongoDB user OR create guest record
  let user = null;
  try {
    const db = await connect();
    user = await db.collection("users").findOne({
      $or: [
        { email: userEmail },
        { wallet }
      ].filter(Boolean)
    });

    // If no user, create guest record
    if (!user) {
      user = {
        email: userEmail || null,
        wallet: wallet || null,
        plan: "free",
        freeChecksUsed: 0
      };
      await db.collection("users").insertOne(user);
    }

    // STEP 2: Free check logic
    if (user.plan !== "pro") {
      if (!user.freeChecksUsed) user.freeChecksUsed = 0;

      if (user.freeChecksUsed >= 5) {
        return res.status(402).json({
          error: "Free limit reached. Upgrade to Pro to continue.",
          upgradeLink: "/upgrade" // <-- Your Stripe checkout link or route
        });
      }

      // Increment free checks
      await db.collection("users").updateOne(
        { _id: user._id },
        { $inc: { freeChecksUsed: 1 } }
      );
    }
  } catch (err: any) {
    console.error("MongoDB error:", err.message);
    return res.status(500).json({ error: "Server error checking subscription status." });
  }

  try {
    // 🧠 Step 1: Scrape metadata
    const metadata = await runEffortScore(sourceType, url);
    console.log(`Collected Metadata for ${sourceType}:`, metadata);

    // 🎯 Step 2: Score it
    const { score, reasons, tags } = await calculateEffortScore(metadata);
    const fraudSignal = score < 70;

    // 💳 Step 3: Stripe Usage Logging for Pro users
    if (subscriptionItemId && user?.plan === "pro") {
      try {
        await (stripe.subscriptionItems as any).createUsageRecord(subscriptionItemId, {
          quantity: 1,
          timestamp: Math.floor(Date.now() / 1000),
          action: 'increment',
        });
        console.log('✅ Stripe usage logged');
      } catch (err: any) {
        console.error('❌ Stripe usage error:', err.message);
      }
    }

    // 🧾 Step 4: Return score
    return res.status(200).json({
      score,
      fraudSignal,
      message: fraudSignal ? '⚠️ Possible AI or low-effort content' : '✅ Human effort detected',
      reasons,
      tags: [...tags, `platform:${sourceType}`],
      metadata,
      freeChecksRemaining: user?.plan === "pro" ? null : (5 - (user.freeChecksUsed || 0))
    });
  } catch (err: any) {
    console.error('❌ Effort score error:', err.message);
    return res.status(500).json({ error: `Failed to score effort: ${err.message}` });
  }
}
