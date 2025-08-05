import type { NextApiRequest, NextApiResponse } from "next";
import connectToDatabase from "@/lib/mongodb";
import type { WithId, Document } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email, wallet } = req.query;

  if ((!email || typeof email !== "string") && (!wallet || typeof wallet !== "string")) {
    return res.status(400).json({ error: "Missing email or wallet" });
  }

  const { db } = await connectToDatabase();

  let user: WithId<Document> | null = null;
  if (email) {
    const emailStr = Array.isArray(email) ? email[0] : email;
    user = await db.collection("users").findOne({
      email: { $regex: `^${emailStr.trim()}$`, $options: "i" },
    });
  } else if (wallet) {
    const walletStr = Array.isArray(wallet) ? wallet[0] : wallet;
    user = await db.collection("users").findOne({
      walletId: { $regex: `^${walletStr.trim()}$`, $options: "i" },
    });
  }

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Optional VO2 max compatibility
  const vo2MaxSource = user.vo2max
    ? "WHOOP → Estimated via cardiorespiratory fitness model"
    : undefined;

  // ✅ Only return clean fields needed for localStorage and frontend
  res.status(200).json({
    email: user.email,
    username: user.username,
    walletId: user.walletId,
    xp: user.xp || 0,
    level: user.level || 1,
    streak: user.streak || 0,
    healthGoals: user.healthGoals || "General wellness",
    vo2Max: user.vo2max || null,
    vo2MaxSource,
  });
}
