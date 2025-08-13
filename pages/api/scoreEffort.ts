import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import authOptions from './auth/[...nextauth]';
import { stripe } from '@/lib/stripe';
import { runEffortScore } from '@/utils/runEffortScore';
import { calculateEffortScore } from '@/utils/effortRecipe';
const { connect } = require('../../backend/db');

// 🔍 Helper: Detect platform from URL
function detectPlatformFromURL(rawUrl: string) {
  const url = (rawUrl || '').trim();
  const patterns: Record<string, RegExp> = {
    instagram: /instagram\.com/i,
    amazon: /amazon\.[a-z.]+/i,
    tiktokshop: /tiktok\.com\/.*shop/i,
    tiktok: /tiktok\.com/i,
    reddit: /reddit\.com/i,
    youtube: /(?:youtube\.com|youtu\.be)/i,
    twitter: /(?:twitter\.com|x\.com)/i,
    // Add web3/onchain/wallet if needed in future!
  };
  for (const [platform, regex] of Object.entries(patterns)) {
    if (regex.test(url)) return platform;
  }
  return 'unknown';
}

// Platforms that actually require a wallet (none of the main social/content sources)
const WEB3_ONLY_PLATFORMS = new Set(['web3', 'wallet', 'onchain']);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Try to get session (optional for guests)
  const session = (await getServerSession(req, res, authOptions)) as
    | { user?: { email?: string } }
    | null;
  const userEmail = session?.user?.email || null;

  // Accept multiple payload shapes
  let { url, sourceType, value, platformHint, wallet, subscriptionItemId, mode } = req.body || {};

  // Map alternative payload keys from current frontend
  if (!url && value) url = value;
  if (!sourceType && platformHint) sourceType = platformHint;
  if (!sourceType && mode) sourceType = mode;

  // MUST have a url
  if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Missing url' });
  url = url.trim();

  // Auto-detect platform if not provided or unknown
  const detectedPlatform = detectPlatformFromURL(url);
  if (!sourceType || sourceType === 'unknown') sourceType = detectedPlatform;

  // Only require wallet for true onchain/web3 sources (not for TikTok/Instagram/etc)
  if (WEB3_ONLY_PLATFORMS.has(sourceType) && !wallet) {
    return res.status(422).json({
      error: 'Missing wallet address for Web3/onchain sources',
      details: { sourceType },
    });
  }

  // 🔐 STEP 1: Check MongoDB user OR create guest record
  let user: any = null;
  try {
    const db = await connect();

    user = await db.collection('users').findOne({
      $or: [{ email: userEmail }, { wallet }],
    });

    // If no user, create guest record
    if (!user) {
      user = {
        email: userEmail || null,
        wallet: wallet || null,
        plan: 'free',
        freeChecksUsed: 0,
      };
      const insertResult = await db.collection('users').insertOne(user);
      user._id = insertResult.insertedId;
    }

    // STEP 2: Free check logic
    if (user.plan !== 'pro') {
      if (!user.freeChecksUsed) user.freeChecksUsed = 0;

      if (user.freeChecksUsed >= 5) {
        return res.status(402).json({
          error: 'Free limit reached. Upgrade to Pro to continue.',
          upgradeLink: '/upgrade', // <-- Your Stripe checkout link or route
        });
      }

      // Increment free checks
      await db.collection('users').updateOne(
        { _id: user._id },
        { $inc: { freeChecksUsed: 1 } }
      );
      user.freeChecksUsed += 1; // keep in sync for response
    }
  } catch (err: any) {
    console.error('MongoDB error:', err.message || err);
    return res.status(500).json({ error: 'Server error checking subscription status.' });
  }

  try {
    // 🧠 Step 1: Scrape metadata
    const metadata = await runEffortScore(sourceType, url);
    console.log(`Collected Metadata for ${sourceType}:`, metadata);

    // 🎯 Step 2: Score it
    const { score, reasons, tags } = await calculateEffortScore(metadata);
    const fraudSignal = score < 70;

    // 💳 Step 3: Stripe Usage Logging for Pro users
    if (subscriptionItemId && user?.plan === 'pro') {
      try {
        await (stripe.subscriptionItems as any).createUsageRecord(subscriptionItemId, {
          quantity: 1,
          timestamp: Math.floor(Date.now() / 1000),
          action: 'increment',
        });
        console.log('✅ Stripe usage logged');
      } catch (err: any) {
        console.error('❌ Stripe usage error:', err?.message || err);
      }
    }

    // 🧾 Step 4: Return score
    return res.status(200).json({
      score,
      fraudSignal,
      message: fraudSignal
        ? '⚠️ Possible AI or low-effort content'
        : '✅ Human effort detected',
      reasons,
      tags: [...(tags || []), `platform:${sourceType}`],
      metadata,
      freeChecksRemaining:
        user?.plan === 'pro' ? null : Math.max(0, 5 - (user.freeChecksUsed || 0)),
    });
  } catch (err: any) {
    console.error('❌ Effort score error:', err?.message || err);
    return res.status(500).json({ error: `Failed to score effort: ${err?.message || 'Unknown error'}` });
  }
}