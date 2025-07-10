// pages/api/registerHyrox.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { email, name, invite_code } = req.body;

  if (!email || !name || !invite_code) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('hyrox_registrations');

    const existing = await collection.findOne({ email, invite_code });
    if (existing) {
      return res.status(200).json({ success: true, message: 'Already registered' });
    }

    await collection.insertOne({
      email,
      name,
      invite_code,
      registeredAt: new Date(),
    });

    return res.status(200).json({ success: true, message: 'Hyrox registration complete' });
  } catch (error: any) {
    console.error('[registerHyrox Error]', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
