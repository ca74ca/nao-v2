import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const MONGO_URI = process.env.MONGODB_URI!; // Set in .env.local

let cachedClient: MongoClient | null = null;
async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "Missing username or password" });

  try {
    const client = await connectToDatabase();
    const db = client.db(); // defaults to DB in URI
    // Try to find user by username or email
    const user = await db.collection("users").findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // The stored password should be a bcrypt hash
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // TODO: set a cookie or session here if needed

    return res.status(200).json({ status: "success", message: "Login successful" });
  } catch (err: any) {
    console.error("Signin error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
}