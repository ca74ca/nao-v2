import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Read client ID and redirect URI from environment variables
  const clientId =
    process.env.WHOOP_CLIENT_ID ||
    process.env.NEXT_PUBLIC_WHOOP_CLIENT_ID;
  const redirectUri =
    process.env.WHOOP_REDIRECT_URI ||
    process.env.NEXT_PUBLIC_WHOOP_REDIRECT_URI;
  const scope = "read:recovery read:cycles read:sleep read:workout read:profile";

  if (!clientId || !redirectUri) {
    return res.status(500).json({
      error: "Missing WHOOP_CLIENT_ID or WHOOP_REDIRECT_URI in environment variables.",
    });
  }

  // Log the redirect URI for debugging
  console.log("Sent redirect_uri:", redirectUri);

  // Build the WHOOP OAuth authorization URL
  const authUrl = `https://api.whoop.com/oauth/oauth2/authorize?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${encodeURIComponent(scope)}`;

  // Log the auth URL for debugging
  console.log("WHOOP AUTH URL:", authUrl);

  // Redirect user to WHOOP OAuth
  res.redirect(authUrl);
}
