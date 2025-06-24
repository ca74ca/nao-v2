import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ────────────────────────────────────────────────────────────────
  // 1) Require wallet header (sent from Mint page)
  // ────────────────────────────────────────────────────────────────
  const wallet = req.headers['x-user-wallet'];
  if (!wallet) {
    return res.status(400).json({ error: 'Missing x-user-wallet header' });
  }

  // ────────────────────────────────────────────────────────────────
  // 2) Look up user (wallet IDs are stored lowercase)
  // ────────────────────────────────────────────────────────────────
  const client = await clientPromise;
  const db = client.db();
  const user = await db
    .collection('users')
    .findOne({ walletId: wallet.toString().toLowerCase() });

  if (!user || !user.whoopAccessToken) {
    return res.status(404).json({ error: 'No WHOOP tokens found for user' });
  }

  // ────────────────────────────────────────────────────────────────
  // 3) Call WHOOP profile endpoint (✔ correct developer URL)
  // ────────────────────────────────────────────────────────────────
  try {
    const whoopRes = await axios.get(
      'https://api.prod.whoop.com/developer/v1/user/profile/basic',
      {
        headers: {
          Authorization: `Bearer ${user.whoopAccessToken}`,
        },
      }
    );

    // Forward WHOOP’s JSON to the frontend
    return res.status(200).json(whoopRes.data);
  } catch (error: any) {
    // Handle expired token (401) so frontend can prompt re-connect
    if (error.response?.status === 401 && user.whoopRefreshToken) {
      return res.status(401).json({ error: 'WHOOP token expired. Please reconnect.' });
    }

    // Generic failure
    return res.status(500).json({
      error: 'Failed to fetch WHOOP data',
      detail: error?.response?.data || error.message,
    });
  }
}
