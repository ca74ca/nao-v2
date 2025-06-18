import type { NextApiRequest, NextApiResponse } from "next";

// Example: Replace with your real DB/user check
const fakeOnboardedEmails = ["tito@example.com", "ca74ca@gmail.com"];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.query;
  res.json({ onboarded: fakeOnboardedEmails.includes(email as string) });
}