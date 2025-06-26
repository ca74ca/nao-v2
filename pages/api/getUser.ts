import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let { email, wallet } = req.query;

  if ((!email || typeof email !== "string") && (!wallet || typeof wallet !== "string")) {
    return res.status(400).json({ error: "Missing email or wallet" });
  }

  const { db } = await connectToDatabase();

  let user = null;
  if (email && typeof email === "string") {
    user = await db.collection("users").findOne({
      email: { $regex: `^${email.trim()}$`, $options: "i" }
    });
  } else if (wallet && typeof wallet === "string") {
    user = await db.collection("users").findOne({
      wallet: { $regex: `^${wallet.trim()}$`, $options: "i" }
    });
  }

  if (!user) return res.status(404).json({ error: "User not found" });

  // Optional: provide vo2MaxSource for frontend compatibility
  const vo2MaxSource = user.vo2max
    ? "WHOOP → Estimated via cardiorespiratory fitness model"
    : undefined;

  res.status(200).json({
    ...user,
    vo2Max: user.vo2max,
    vo2MaxSource,
  });
}
