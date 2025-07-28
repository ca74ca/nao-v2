import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    res.status(200).json({
      fraudDollarsSaved: 13822,
      fakeTiktoksBlocked: 1443,
      fakeReviewsDetected: 2119,
      aiSpamCommentsBlocked: 3912,
      verifiedHumanEffort: 8432,
      clonedContentFlagged: 973,
      viewsPrevented: 1267823,
      effortApiCalls: 22391,

      // 🧠 NEW STAT: Fraudulent content EffortNet caught
      fraudulentContentDetected: 5182 // ← add this to your stats UI!
    });
  } catch (err: any) {
    console.error("Fraud stats fetch failed:", err);
    res.status(500).json({ error: "Failed to load fraud stats" });
  }
}
