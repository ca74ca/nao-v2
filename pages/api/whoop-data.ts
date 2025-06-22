import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb'; // your MongoDB connection helper
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Get walletId from request header
  const wallet = req.headers['x-user-wallet'];
  if (!wallet) {
    res.status(400).json({ error: 'Missing x-user-wallet header' });
    return;
  }

  // 2. Find user in your MongoDB
  const client = await clientPromise;
  const db = client.db(); // use your DB name if needed
  const user = await db.collection('users').findOne({ walletId: wallet });

  if (!user || !user.whoopAccessToken) {
    res.status(404).json({ error: 'No WHOOP tokens found for user' });
    return;
  }

  try {
    // 3. Fetch WHOOP data using stored access token
    const whoopRes = await axios.get(
      'https://api.prod.whoop.com/users/profile/basic', // example endpoint, update to your actual needs
      {
        headers: {
          Authorization: `Bearer ${user.whoopAccessToken}`,
        },
      }
    );
    res.status(200).json(whoopRes.data);
  } catch (error: any) {
    // 4. Handle expired token or API errors
    if (error.response && error.response.status === 401 && user.whoopRefreshToken) {
      // Optionally: refresh token logic here
      res.status(401).json({ error: 'WHOOP token expired. Please reconnect.' });
      return;
    }
    res.status(500).json({ error: 'Failed to fetch WHOOP data', detail: error?.response?.data || error?.message });
  }
}