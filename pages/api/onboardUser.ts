// pages/api/onboardUser.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb'; // adjust path if needed

/**
 * -------------------------------
 *  Types
 * -------------------------------
 */
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
  redirectUrl?: string;
  error?: string;
};

/**
 * -------------------------------
 *  Stub: Mint or fetch a wallet
 *  (replace with real logic)
 * -------------------------------
 */
async function mintOrGetWalletAddress(email: string): Promise<string> {
  // ❗ Replace this with your real wallet-minting code.
  // Deterministic dummy wallet for now:
  return `0x${Buffer.from(email).toString('hex').slice(0, 40)}`;
}

/**
 * -------------------------------
 *  Handler
 * -------------------------------
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BackendResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res
      .status(405)
      .json({ status: 'error', message: 'Method Not Allowed' });
  }

  // ------------------ Parse & validate ------------------
  const {
    username: rawUsername,
    name,
    email: rawEmail,
    healthGoals = 'General wellness',
    connectWearables = false,
  } = req.body as OnboardRequest;

  const username = (rawUsername || name)?.trim();
  const email = rawEmail?.toLowerCase().trim();

  if (!username || !email) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: username and email',
    });
  }

  try {
    // ------------------ Connect to MongoDB ------------------
    const client = await clientPromise;
    const db = client.db(); // default DB or change to your db name
    const users = db.collection('users');

    // ------------------ Check for existing user ------------------
    const existingUser = await users.findOne({ email });

    // ========== EXISTING USER ==========
    if (existingUser) {
      let walletAddress: string | undefined = existingUser.walletId;

      // If the user exists but has **no** wallet, mint and save one now
      if (!walletAddress) {
        walletAddress = await mintOrGetWalletAddress(email);
        await users.updateOne(
          { email },
          { $set: { walletId: walletAddress } }
        );
      }

      return res.status(200).json({
        status: 'exists',
        message: 'User already exists',
        walletAddress,
        redirectUrl: `/mint?email=${encodeURIComponent(email)}`,
      });
    }

    // ========== NEW USER ==========
    // 1) Insert the new user (without wallet yet)
    const newUser = {
      username,
      email,
      healthGoals,
      connectWearables,
      createdAt: new Date(),
    };
    await users.insertOne(newUser);

    // 2) Mint wallet & persist
    const walletAddress = await mintOrGetWalletAddress(email);
    await users.updateOne(
      { email },
      { $set: { walletId: walletAddress } }
    );

    // 3) Respond
    return res.status(200).json({
      status: 'success',
      message: 'User onboarded successfully',
      walletAddress,
      redirectUrl: `/final-onboarding?userId=${encodeURIComponent(email)}`,
    });
  } catch (error: any) {
    console.error('[onboardUser Error]', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal Server Error',
      redirectUrl: '/onboarding/error?code=500',
    });
  }
}
