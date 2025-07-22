import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb';
import { sendConfirmationEmail as sendWelcomeEmail } from '../../utils/sendConfirmationEmail';
import bcrypt from "bcryptjs";

type OnboardRequest = {
  username?: string;
  name?: string;
  email?: string;
  password?: string;
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

async function mintOrGetWalletAddress(email: string): Promise<string> {
  return `0x${Buffer.from(email).toString('hex').slice(0, 40)}`;
}

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

  const {
    username: rawUsername,
    name,
    email: rawEmail,
    password,
    healthGoals = 'General wellness',
    connectWearables = false,
  } = req.body as OnboardRequest;

  const username = (rawUsername || name)?.trim();
  const email = rawEmail?.toLowerCase().trim();

  if (!username || !email || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: username, email, password',
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');

    const existingUser = await users.findOne({ email });

    if (existingUser) {
      let walletAddress = existingUser.walletId;
      if (!walletAddress) {
        walletAddress = await mintOrGetWalletAddress(email);
        await users.updateOne({ email }, { $set: { walletId: walletAddress } });
      }

      return res.status(200).json({
        status: 'exists',
        message: 'User already exists',
        walletId: walletAddress,
        redirectUrl: `/mint?email=${encodeURIComponent(email)}`,
      });
    }

    const walletAddress = await mintOrGetWalletAddress(email);
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      username,
      email,
      password: hashedPassword,
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
