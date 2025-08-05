// pages/api/usageStats.ts

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectToDatabase from "@/lib/mongodb";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    let email: string | undefined;

    if (req.method === "POST") {
      email = req.body?.email;
    } else if (req.method === "GET") {
      const session = await getServerSession(req, res, authOptions);
      if (!session?.user?.email) return res.status(401).json({ error: "Unauthorized" });
      email = session.user.email;
    } else {
      return res.status(405).end("Method Not Allowed");
    }

    if (!email) return res.status(400).json({ error: "Missing email" });

    const { db } = await connectToDatabase(); // ✅ FIX: call function and destructure `db`

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const usage = await db.collection("usageLogs").aggregate([
      {
        $match: {
          email,
          timestamp: { $gte: oneWeekAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%u", date: "$timestamp" }, // %u = ISO weekday
          },
          calls: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]).toArray();

    const daysMap = {
      "1": "Mon",
      "2": "Tue",
      "3": "Wed",
      "4": "Thu",
      "5": "Fri",
      "6": "Sat",
      "7": "Sun",
    };

    const result = Object.entries(daysMap).map(([num, day]) => {
      const match = usage.find((u) => u._id === num);
      return { name: day, calls: match?.calls || 0 };
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("🔥 usageStats error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
