import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
// Update the path below if your [...nextauth].ts file is in a different location
// Update the path below to match the actual location of your [...nextauth].ts file
import authOptions from './auth/[...nextauth]';
import { stripe } from '@/lib/stripe';
import { runEffortScore } from '@/utils/runEffortScore';
import { calculateEffortScore } from '@/utils/effortRecipe';
const { connect } = require('../../backend/db'); // ✅ Your working MongoDB logic

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ✅ Require NextAuth login
  const session = await getServerSession(req, res, authOptions) as { user?: { email?: string } } | null;
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  const userEmail = session.user.email;
  const { url, sourceType, wallet, subscriptionItemId } = req.body;

  if (!url || !sourceType || !wallet) {
    return res.status(400).json({ error: 'Missing url, sourceType, or wallet' });
  }

  // 🔐 STEP 1: Check MongoDB user + plan via email or wallet
  try {
    const db = await connect();
    const user = await db.collection("users").findOne({
      $or: [
        { email: userEmail },
        { wallet },
      ],
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (user.plan !== "pro") {
      return res.status(402).json({ error: "Upgrade to Pro to use this feature" });
    }
  } catch (err: any) {
    console.error("MongoDB error:", err.message);
    return res.status(500).json({ error: "Server error checking subscription status." });
  }

  try {
    // 🧠 Step 1: Scrape metadata
    const metadata = await runEffortScore(sourceType, url);
    console.log('Collected Metadata:', metadata);

    // 🎯 Step 2: Score it
    const { score, reasons, tags } = await calculateEffortScore(metadata);
    const fraudSignal = score < 70;

    // 💳 Step 3: Stripe Usage Logging (optional)
    if (subscriptionItemId) {
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
      tags,
      metadata,
    });
  } catch (err: any) {
    console.error('❌ Effort score error:', err.message);
    return res.status(500).json({ error: `Failed to score effort: ${err.message}` });
  }
}
