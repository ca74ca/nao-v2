import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { saveWhoopTokensToUser } from '../../lib/userMap';
import { parse } from 'cookie'; // ✅ Use named import for cookie@1.x

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const code = req.query.code as string;

  // ✅ Safely parse cookies
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};

  // 1. Read wallet from state param (OAuth best practice)
  // 2. Then try header
  // 3. Then try cookie
  const wallet =
    (req.query.state as string | undefined) ||
    (req.headers["x-user-wallet"] as string | undefined) ||
    cookies.wallet;

  if (!code || !wallet) {
    res.setHeader('Content-Type', 'text/html');
    res.end(`
      <script>
        window.opener && window.opener.postMessage({ type: 'WHOOP_AUTH_ERROR' }, window.location.origin);
        window.close();
      </script>
      <p>Missing WHOOP code or wallet. Close this window.</p>
    `);
    return;
  }

  try {
    // 🔥 FIX: Use URLSearchParams for form-urlencoded body
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://nao-v2.onrender.com/api/whoop-callback',
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
    });

    const tokenRes = await axios.post(
      'https://api.prod.whoop.com/oauth/oauth2/token',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // ✅ Save to MongoDB by wallet
    await saveWhoopTokensToUser(wallet, access_token, refresh_token, expiresAt);

    res.setHeader('Content-Type', 'text/html');
    res.end(`
      <script>
        window.opener && window.opener.postMessage({ type: 'WHOOP_AUTH_SUCCESS' }, window.location.origin);
        window.close();
      </script>
      <p>WHOOP sync complete. You can close this window.</p>
    `);
  } catch (err: any) {
    console.error('❌ WHOOP callback error:', err.response?.data || err);
    res.setHeader('Content-Type', 'text/html');
    res.end(`
      <script>
        window.opener && window.opener.postMessage({ type: 'WHOOP_AUTH_ERROR' }, window.location.origin);
        window.close();
      </script>
      <p>Token exchange failed. Close this window.</p>
    `);
  }
}
