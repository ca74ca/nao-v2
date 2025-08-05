// ✅ /pages/api/createStripeCustomer.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe'; // Adjust if needed
import connectToDatabase from '@/lib/mongodb';
import { authOptions } from "@/lib/authOptions";


// Optional toggle: set true if you want to persist to DB
const SAVE_TO_DB = true;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  

  const { email, name, userId } = req.body;

  if (!email || typeof email !== 'string' || !name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid email/name' });
  }

  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId: userId || 'unknown',
        source: 'nao-get-started', // helpful for tracing origin
      },
    });

    // Optionally: Save customerId to MongoDB user
    if (SAVE_TO_DB && userId) {
      const { db } = await connectToDatabase();
      await db.collection('users').updateOne(
        { _id: userId },
        {
          $set: {
            stripeCustomerId: customer.id,
            stripeStatus: 'created',
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    return res.status(200).json({ customerId: customer.id });
  } catch (err: any) {
    console.error('❌ Stripe Customer Error:', err.message);
    return res.status(500).json({ error: 'Failed to create Stripe customer' });
  }
}
