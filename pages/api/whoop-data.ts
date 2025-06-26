import type { NextApiRequest, NextApiResponse } from "next";
// Import your user and token lookup logic
import { findNaoUserByWhoopId } from "../../lib/findNaoUserByWhoopId";
// import { getWhoopTokensForWallet } from "../../lib/userMap"; // You should implement this

// STUB: Replace with your real token store/lookup for demo
const demoTokens: Record<string, { access_token: string }> = {
  "0x123...abc": { access_token: "YOUR_WHOOP_ACCESS_TOKEN" },
  // Add more demo wallet/token pairs as needed
};

/**
 * Fetches Whoop data for a given access token and date.
 */
async function getWhoopData(accessToken: string, date: string) {
  // Fetch profile data
  const profileRes = await fetch("https://api.prod.whoop.com/users/profile/basic", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profile = await profileRes.json();

  // Fetch recovery, strain, and sleep for the date
  const recovery = await fetch(`https://api.prod.whoop.com/recovery/${date}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then(r => r.ok ? r.json() : null);

  const strain = await fetch(`https://api.prod.whoop.com/strain/${date}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then(r => r.ok ? r.json() : null);

  const sleep = await fetch(`https://api.prod.whoop.com/sleep/${date}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then(r => r.ok ? r.json() : null);

  return { profile, recovery, strain, sleep };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get wallet address from cookie, query, or session (adjust as needed)
    const wallet = (req.query.wallet as string) || req.cookies.wallet || "0x123...abc"; // Fallback for demo

    // Look up Whoop tokens for the wallet (replace with real store/DB in prod)
    // const tokens = await getWhoopTokensForWallet(wallet);
    const tokens = demoTokens[wallet];

    if (!tokens?.access_token) {
      return res.status(401).json({ error: "Not authenticated with Whoop" });
    }

    // Determine the date to fetch (from query or default to today)
    const date = typeof req.query.date === "string"
      ? req.query.date
      : new Date().toISOString().slice(0, 10);

    // Fetch Whoop data
    const data = await getWhoopData(tokens.access_token, date);

    res.status(200).json(data);
  } catch (err: any) {
    console.error("whoop-data error", err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
}
