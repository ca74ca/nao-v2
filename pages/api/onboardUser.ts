import type { NextApiRequest, NextApiResponse } from 'next';

// Type definitions
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
  // 1. Method Validation
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      status: 'error',
      message: 'Method Not Allowed' 
    });
  }

  // 2. Data Normalization
  const {
    username: rawUsername,
    name,
    email: rawEmail,
    healthGoals = "General wellness",
    connectWearables = false
  } = req.body as OnboardRequest;

  const username = rawUsername || name;
  const email = rawEmail?.toLowerCase().trim();

  // 3. Input Validation
  if (!username || !email || typeof connectWearables !== 'boolean') {
    return res.status(400).json({
      status: 'error',
      message: 'Missing or invalid required fields'
    });
  }

  try {
    // 4. Call NAO Backend
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const backendRes = await fetch('https://nao-sdk-api.onrender.com/onboard', {
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

    // 5. Handle Backend Response
    const backendData = await safeParseJson(backendRes);

    if (!backendRes.ok) {
      // Special case: Existing user
      if (backendRes.status === 400 && 
          (backendData.error?.includes("already exists") || 
           backendData.message?.includes("already exists")) {
        return res.status(200).json({
          status: 'exists',
          message: 'User already exists',
          redirectUrl: '/login?email=' + encodeURIComponent(email)
        });
      }
      
      throw new Error(backendData.message || `Backend error: ${backendRes.status}`);
    }

    // 6. Success Response
    return res.status(200).json({
      status: 'success',
      message: 'User onboarded successfully',
      walletAddress: backendData.walletAddress,
      healthPassportNFT: backendData.nftId,
      redirectUrl: `/onboarding/final?userId=${encodeURIComponent(backendData.userId)}` +
                   `&wallet=${encodeURIComponent(backendData.walletAddress)}` +
                   `&nft=${encodeURIComponent(backendData.nftId)}`
    });

  } catch (error: any) {
    console.error('Onboarding Error:', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      status: 'error',
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Internal Server Error',
      redirectUrl: '/onboarding/error?code=500'
    });
  }
}

// Helper for safe JSON parsing
async function safeParseJson(response: Response) {
  try {
    return await response.json();
  } catch (e) {
    return { 
      message: 'Invalid JSON response',
      error: e instanceof Error ? e.message : 'Unknown parse error'
    };
  }
}

// Type guard for error handling
function isErrorWithMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}
