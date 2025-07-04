import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const backendRes = await fetch("https://nao-sdk-api.onrender.com/api/getRewardStatus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await backendRes.json();
    return res.status(backendRes.status).json(data);
  } catch (err: any) {
    console.error("[Frontend proxy getRewardStatus]", err);
    return res.status(500).json({ error: "Proxy failed" });
  }
}
