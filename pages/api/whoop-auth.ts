import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const clientId =
    process.env.WHOOP_CLIENT_ID ||
    process.env.NEXT_PUBLIC_WHOOP_CLIENT_ID;
  const redirectUri =
    process.env.WHOOP_REDIRECT_URI ||
    process.env.NEXT_PUBLIC_WHOOP_REDIRECT_URI;
  const scope = "read:profile"; // ONLY this for the minimal test

  if (!clientId || !redirectUri) {
    return res
      .status(500)
      .json({ error: "Missing WHOOP_CLIENT_ID or WHOOP_REDIRECT_URI in env." });
  }

  const authUrl = `https://api.prod.whoop.com/oauth/oauth2/authorize?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${encodeURIComponent(scope)}`;

  console.log("WHOOP AUTH URL:", authUrl);

  res.redirect(authUrl);
}