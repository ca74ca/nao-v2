import type { NextApiRequest, NextApiResponse } from "next";
import { getValidWhoopAccessToken } from "../../lib/userMap";

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
    // Get wallet address from query, cookie, or session (adjust as needed)
    const wallet = (req.query.wallet as string) || req.cookies.wallet;
    if (!wallet) {
      return res.status(400).json({ error: "Wallet address required" });
    }

    // Use the real lookup function from userMap
    const accessToken = await getValidWhoopAccessToken(wallet);

    if (!accessToken) {
      return res.status(401).json({ error: "No valid Whoop access token found" });
    }

    // Determine the date to fetch (from query or default to today)
    const date = typeof req.query.date === "string"
      ? req.query.date
      : new Date().toISOString().slice(0, 10);

    // Fetch Whoop data
    const data = await getWhoopData(accessToken, date);

    res.status(200).json(data);
  } catch (err: any) {
    console.error("whoop-data error", err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
}
