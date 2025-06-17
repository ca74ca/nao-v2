import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../lib/mongodb"; // Make sure this path is correct

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db("nao");

    const email = "ca74ca@gmail.com";

    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      return res.status(200).json({ message: "User already exists" });
    }

    const newUser = {
      email,
      username: "tito",
      password: "1162",
      healthGoals: "lose weight, track rewards",
      wearableConnected: true,
      wallet: "0xeecE8ceDa6fBbfeB4206C99424b783aecB2f43e6",
      rewardState: {
        xp: 0,
        energyCredits: 0,
        streak: 0,
        evolutionLevel: 1,
        lastActivity: null,
        rewardsReady: false,
      },
      createdAt: new Date()
    };

    await db.collection("users").insertOne(newUser);

    return res.status(201).json({ message: "User created", user: newUser });
  } catch (err) {
    console.error("Error inserting user:", err);
    return res.status(500).json({ error: "Failed to insert user" });
  }
}
