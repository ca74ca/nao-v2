// /pages/api/updateGlobalStats.ts
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const {
    weightLifted = 0,
    hrZoneHours = 0,
    verifiedWorkouts = 0,
    usersActivated = 0,
    evolvedRewards = 0,
    ethPaid = 0,
    stablecoinUSD = 0,
    chainInteractions = 0,
  } = req.body;

  try {
    const { db } = await connectToDatabase();

    await db.collection("globalStats").updateOne(
      { _id: new ObjectId("000000000000000000000001") },
      {
        $inc: {
          totalWorkouts: 1,
          totalWeightLifted: weightLifted,
          totalHRZoneHours: hrZoneHours,
          totalVerifiedWorkouts: verifiedWorkouts,
          totalUsersActivated: usersActivated,
          totalEvolvedRewards: evolvedRewards,
          totalETHRewarded: ethPaid,
          totalUSDValueDelivered: stablecoinUSD,
          totalChainInteractions: chainInteractions,
        },
        $set: { lastUpdated: new Date() },
      },
      { upsert: true }
    );

    res.status(200).json({ status: "updated" });
  } catch (error) {
    console.error("Error updating global stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
