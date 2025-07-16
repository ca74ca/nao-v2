import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { method } = req.body;

  if (!["apple-pay", "coinbase"].includes(method)) {
    return res.status(400).json({ message: "Invalid method" });
  }

  console.log(`Redemption requested via ${method}`);
  // TODO: You could add database logic here to track redemption
  return res.status(200).json({ success: true });
}
