// /pages/api/createSubscription.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe'; // adjust if needed

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customerId } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: 'Missing customerId' });
  }

  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
price: 'price_1PQ8exH4aGhlqXNzqGp3XGtx'
        },
      ],
      collection_method: 'charge_automatically',
    });

    // Optionally save: subscription.id or subscription.items[0].id

    return res.status(200).json({
      subscriptionId: subscription.id,
      subscriptionItemId: subscription.items.data[0].id,
    });
  } catch (err: any) {
    console.error('Stripe Subscription Error:', err.message);
    return res.status(500).json({ error: 'Failed to create subscription' });
  }
}
