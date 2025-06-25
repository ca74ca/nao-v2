import type { NextApiRequest, NextApiResponse } from 'next';

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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

const backendRes = await fetch('https://nao-v2.onrender.com/api/onboardUser', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-NAO-Secret': process.env.NAO_API_SECRET || '',
        'X-Client-IP': req.socket.remoteAddress || ''
      },
      body: JSON.stringify({
        username,
        email,
        healthGoals,
        connectWearables
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    const backendData = await safeParseJson(backendRes);

    // Fixed syntax error here - removed extra parenthesis
    if (!backendRes.ok) {
      if (backendRes.status === 400 && 
         (backendData.error?.includes("already exists") || 
          backendData.message?.includes("already exists"))) {
        return res.status(200).json({
          status: 'exists',
          message: 'User already exists',
          redirectUrl: '/login?email=' + encodeURIComponent(email)
        });
      }
      
      throw new Error(backendData.message || `Backend error: ${backendRes.status}`);
    }

    return res.status(200).json({
      status: 'success',
      message: 'User onboarded successfully',
      walletAddress: backendData.walletAddress,
      healthPassportNFT: backendData.nftId,
      redirectUrl: `/onboarding/final?userId=${encodeURIComponent(backendData.userId)}` +
                   `&wallet=${encodeURIComponent(backendData.walletAddress)}` +
                   `&nft=${encodeURIComponent(backendData.nftId)}`
    });

  } catch (error: unknown) {
    const errorMessage = isErrorWithMessage(error) ? error.message : 'Unknown error';
    console.error('Onboarding Error:', {
      error: errorMessage,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      status: 'error',
      message: process.env.NODE_ENV === 'development' 
        ? errorMessage 
        : 'Internal Server Error',
      redirectUrl: '/onboarding/error?code=500'
    });
  }
}

async function safeParseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return { message: 'Invalid JSON response' };
  }
}

function isErrorWithMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}
