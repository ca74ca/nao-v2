// /pages/api/createStripeCustomer.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe'; // adjust path if needed

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const customer = await stripe.customers.create({
      email,
      name,
    });

    // Optionally: save customer.id to MongoDB user record

    return res.status(200).json({ customerId: customer.id });
  } catch (err: any) {
    console.error('Stripe Customer Error:', err.message);
    return res.status(500).json({ error: 'Failed to create Stripe customer' });
  }
}
