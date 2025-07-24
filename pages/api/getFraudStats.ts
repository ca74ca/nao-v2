import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import { subHours } from "date-fns";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { db } = await connectToDatabase();

    const since = subHours(new Date(), 24);

    const fraudEvents = await db
      .collection("fraudEvents")
      .find({ timestamp: { $gte: since } })
      .toArray();

    let fraudDollarsSaved = 0;
    let fakeTiktoksBlocked = 0;
    let viewsPrevented = 0;

    fraudEvents.forEach((event) => {
      fraudDollarsSaved += event.estimatedFraudValue || 0;
      fakeTiktoksBlocked += 1;
      viewsPrevented += event.viewsPrevented || 0;
    });

    res.status(200).json({
      fraudDollarsSaved: parseFloat(fraudDollarsSaved.toFixed(2)),
      fakeTiktoksBlocked,
      viewsPrevented,
    });
  } catch (error) {
    console.error("Error fetching fraud stats:", error);
    res.status(500).json({ error: "Failed to fetch fraud stats" });
  }
}
