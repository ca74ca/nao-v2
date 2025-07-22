import { connectToDatabase } from "@/lib/db";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).end();

  const { db } = await connectToDatabase();
  const hashed = await bcrypt.hash(newPassword, 10);

  await db.collection("users").updateOne({ email }, { $set: { password: hashed } });
  res.status(200).json({ message: "Password updated." });
}
