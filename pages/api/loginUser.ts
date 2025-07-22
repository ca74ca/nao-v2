import { connectToDatabase } from "@/lib/db";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, password } = req.body;

  console.log("Attempting login for:", email);
  console.log("Password from form:", password);

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required." });
  }

  const { db } = await connectToDatabase();
  const user = await db.collection("users").findOne({
    email: { $regex: new RegExp(`^${email}$`, "i") },
  });

  console.log("User found:", !!user);
  console.log("Password hash in DB:", user?.password);

  if (!user) {
    return res.status(401).json({ message: "User not found." });
  }

  const valid = await bcrypt.compare(password, user.password);
  console.log("Password valid:", valid);

  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

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
