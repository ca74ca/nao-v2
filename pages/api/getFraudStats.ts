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

    let stats = {
      aiReviewsFlagged: 0,
      fakeViewsBlocked: 0,
      realCreatorBlocks: 0,
      aiPostsFlagged: 0,
      cheatsDetected: 0,
      referralsBlocked: 0,
      fakeContribsFlagged: 0,
      lowEffortPostsBlocked: 0,
      verifiedEffortEvents: 0,
      effortScoreRequests: 0
    };

    fraudEvents.forEach((event) => {
      stats.aiReviewsFlagged += event.aiReviewsFlagged || 0;
      stats.fakeViewsBlocked += event.fakeViewsBlocked || 0;
      stats.realCreatorBlocks += event.realCreatorBlocks || 0;
      stats.aiPostsFlagged += event.aiPostsFlagged || 0;
      stats.cheatsDetected += event.cheatsDetected || 0;
      stats.referralsBlocked += event.referralsBlocked || 0;
      stats.fakeContribsFlagged += event.fakeContribsFlagged || 0;
      stats.lowEffortPostsBlocked += event.lowEffortPostsBlocked || 0;
      stats.verifiedEffortEvents += event.verifiedEffortEvents || 0;
      stats.effortScoreRequests += event.effortScoreRequests || 0;
    });

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching fraud stats:", error);
    res.status(500).json({ error: "Failed to fetch fraud stats" });
  }
}
