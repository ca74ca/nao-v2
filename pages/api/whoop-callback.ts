import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const code = req.query.code as string;
  if (!code) {
    res.setHeader('Content-Type', 'text/html');
    res.end(`
      <script>
        window.opener && window.opener.postMessage({ type: 'WHOOP_AUTH_ERROR' }, window.location.origin);
        window.close();
      </script>
      <p>No code provided. You can close this window.</p>
    `);
    return;
  }

  const whoopApiUrl = process.env.WHOOP_API_URL;

  try {
    const response = await axios.post(`${whoopApiUrl}/oauth/oauth2/token`, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://c0ce-2600-1007-a012-fe08-84be-17a0-74d6-d66b.ngrok-free.app', // replace with your actual ngrok URL!
      client_id: process.env.WHOOP_CLIENT_ID,
      client_secret: process.env.WHOOP_CLIENT_SECRET,
    });

    const { access_token, refresh_token } = response.data;
    // TODO: Store tokens securely for your user here

    res.setHeader('Content-Type', 'text/html');
    res.end(`
      <script>
        window.opener && window.opener.postMessage({ type: 'WHOOP_AUTH_SUCCESS' }, window.location.origin);
        window.close();
      </script>
      <p>WHOOP Sync complete! You can close this window.</p>
    `);
  } catch (error: any) {
    console.error(error.response?.data || error);
    res.setHeader('Content-Type', 'text/html');
    res.end(`
      <script>
        window.opener && window.opener.postMessage({ type: 'WHOOP_AUTH_ERROR' }, window.location.origin);
        window.close();
      </script>
      <p>Token exchange failed. You can close this window.</p>
    `);
  }
}