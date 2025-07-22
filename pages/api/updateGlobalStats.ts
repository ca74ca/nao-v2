// /pages/api/updateGlobalStats.ts
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const { xpEarned, caloriesBurned, naoCoins } = req.body;

  const { db } = await connectToDatabase();

  await db.collection("globalStats").updateOne(
    { _id: new ObjectId("000000000000000000000001") },
    {
      $inc: {
        totalXP: xpEarned || 0,
        totalCalories: caloriesBurned || 0,
        totalWorkouts: 1,
        totalNAOcoins: naoCoins || 0,
      },
      $set: { lastUpdated: new Date() },
    },
    { upsert: true }
  );

  res.status(200).json({ status: "updated" });
}
