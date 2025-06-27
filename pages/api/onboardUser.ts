import type { NextApiRequest, NextApiResponse } from 'next';
// 1. Import your MongoDB connect function
import clientPromise from '../../lib/mongodb'; // or wherever your MongoDB util is

type OnboardRequest = {
  username?: string;
  name?: string;
  email?: string;
  healthGoals?: string;
  connectWearables?: boolean;
};

type BackendResponse = {
  status: 'success' | 'exists' | 'error';
  message: string;
  walletAddress?: string;
  healthPassportNFT?: string;
  redirectUrl?: string;
  error?: string;
};

// Dummy function for wallet minting or retrieval
async function mintOrGetWalletAddress(email: string): Promise<string> {
  // Replace this with your actual wallet minting logic.
  // For now, it returns a dummy deterministic address per email.
  // In production, integrate with your wallet service.
  return `0x${Buffer.from(email).toString('hex').slice(0, 40)}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BackendResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      status: 'error',
      message: 'Method Not Allowed' 
    });
  }

  const {
    username: rawUsername,
    name,
    email: rawEmail,
    healthGoals = "General wellness",
    connectWearables = false
  } = req.body as OnboardRequest;

  const username = rawUsername || name;
  const email = rawEmail?.toLowerCase().trim();

  if (!username || !email || typeof connectWearables !== 'boolean') {
    return res.status(400).json({
      status: 'error',
      message: 'Missing or invalid required fields'
    });
  }

  try {
    // Debug log to verify API handler is hit
    console.log("SUBMIT HANDLER FIRED!"); // <--- LOG ADDED HERE

    // 2. Connect to Mongo
    const client = await clientPromise;
    const db = client.db(); // or your db name
    const users = db.collection('users');

    // 3. Check if user exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      // If user exists, fetch their walletAddress if you store it
      // For demo, mint/retrieve again (in production, fetch from DB)
      const walletAddress = await mintOrGetWalletAddress(email);

      return res.status(200).json({
        status: 'exists',
        message: 'User already exists',
        walletAddress,
        redirectUrl: `/mint?email=${encodeURIComponent(email)}`,
      });
    }

    // 4. Insert new user
    const newUser = {
      username,
      email,
      healthGoals,
      connectWearables,
      createdAt: new Date()
    };
    await users.insertOne(newUser);

    // 4.5 Mint or fetch wallet address for this user
    const walletAddress = await mintOrGetWalletAddress(email);

    // 5. Respond with success, including walletAddress
    return res.status(200).json({
      status: 'success',
      message: 'User onboarded successfully',
      walletAddress,
      redirectUrl: `/final-onboarding?userId=${encodeURIComponent(email)}`,
    });

  } catch (error: any) {
    console.error('Onboarding Error:', error);

    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal Server Error',
      redirectUrl: '/onboarding/error?code=500'
    });
  }
}
