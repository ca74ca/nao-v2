// /pages/api/loginUser.ts
import { connectToDatabase } from "@/lib/db";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required." });
  }

  const { db } = await connectToDatabase();

  // Find user by email
  const user = await db.collection("users").findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "User not found." });
  }

  // Compare passwords
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  // Return user info to store in localStorage for /mint page
  res.status(200).json({
    status: "success",
    user: {
      username: user.username,
      email: user.email,
      walletId: user.walletId,
      xp: user.xp || 0,
      streak: user.streak || 0,
      level: user.level || 1,
    },
  });
}
