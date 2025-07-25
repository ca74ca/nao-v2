import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Missing customerId' });
    }

    const priceId = process.env.STRIPE_METERED_PRICE_ID;
    if (!priceId) {
      throw new Error('STRIPE_METERED_PRICE_ID is not defined in .env');
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      collection_method: 'charge_automatically',
    });

    return res.status(200).json({
      subscriptionId: subscription.id,
      subscriptionItemId: subscription.items.data[0]?.id,
    });
  } catch (error: any) {
    console.error('Stripe Subscription Error:', error.message);
    return res.status(500).json({ error: error.message || 'Failed to create subscription' });
  }
}
