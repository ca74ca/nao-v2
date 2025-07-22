import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb';
import { sendConfirmationEmail as sendWelcomeEmail } from '../../utils/sendConfirmationEmail';

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
  walletId?: string;
  redirectUrl?: string;
  error?: string;
};

/**
 * -------------------------------
 *  Stub: Mint or fetch a wallet
 * -------------------------------
 */
async function mintOrGetWalletAddress(email: string): Promise<string> {
  // Replace this with your real wallet-minting logic later
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
    const db = client.db();
    const users = db.collection('users');

    // ------------------ Check for existing user ------------------
    const existingUser = await users.findOne({ email });

    if (existingUser) {
      let walletAddress: string | undefined = existingUser.walletId;

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
        walletId: walletAddress,
        redirectUrl: `/mint?email=${encodeURIComponent(email)}`,
      });
    }

    // ------------------ New User Flow ------------------
    const walletAddress = await mintOrGetWalletAddress(email);

    const newUser = {
      username,
      email,
      healthGoals,
      connectWearables,
      walletId: walletAddress,
      createdAt: new Date(),
    };
    await users.insertOne(newUser);

    try {
      await sendWelcomeEmail(username, email);
    } catch (emailErr) {
      console.error('❌ Failed to send welcome email:', emailErr);
    }

    return res.status(200).json({
      status: 'success',
      message: 'User onboarded successfully',
      walletId: walletAddress,
      redirectUrl: `/mint?email=${encodeURIComponent(email)}`,
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
