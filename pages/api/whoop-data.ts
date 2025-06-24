import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const wallet = req.headers['x-user-wallet'];
  if (!wallet) {
    return res.status(400).json({ error: 'Missing x-user-wallet header' });
  }

  const client = await clientPromise;
  const db = client.db();
  
  // ✅ Enforce lowercase match for walletId in DB
  const user = await db.collection('users').findOne({ walletId: wallet.toString().toLowerCase() });

  if (!user || !user.whoopAccessToken) {
    return res.status(404).json({ error: 'No WHOOP tokens found for user' });
  }

  try {
    const whoopRes = await axios.get(
      'https://api.prod.whoop.com/users/profile/basic',
      {
        headers: {
          Authorization: `Bearer ${user.whoopAccessToken}`,
        },
      }
    );
    return res.status(200).json(whoopRes.data);
  } catch (error: any) {
    if (error.response?.status === 401 && user.whoopRefreshToken) {
      return res.status(401).json({ error: 'WHOOP token expired. Please reconnect.' });
    }
    return res.status(500).json({
      error: 'Failed to fetch WHOOP data',
      detail: error?.response?.data || error.message,
    });
  }
}
