import type { NextApiRequest, NextApiResponse } from "next";
import connectToDatabase from "@/lib/mongodb";
import { subHours } from "date-fns";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { db } = await connectToDatabase(); // ✅ fixed: correct destructuring

    const since = subHours(new Date(), 24);

    const fraudEvents = await db
      .collection("fraudEvents")
      .find({ timestamp: { $gte: since } })
      .toArray();

    let fraudDollarsSaved = 0;
    let fakeTiktoksBlocked = 0;
    let viewsPrevented = 0;

    for (const event of fraudEvents) {
      fraudDollarsSaved += event.estimatedFraudValue || 0;
      viewsPrevented += event.viewsPrevented || 0;
      fakeTiktoksBlocked += 1;
    }

    res.status(200).json({
      fraudDollarsSaved: parseFloat(fraudDollarsSaved.toFixed(2)),
      fakeTiktoksBlocked,
      viewsPrevented,
    });
  } catch (error) {
    console.error("❌ useFraudStats.ts error:", error);
    res.status(500).json({ error: "Failed to fetch fraud stats" });
  }
}