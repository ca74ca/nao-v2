// backend/routes/getDNFT.js
const express = require("express");
const router = express.Router();
const { connect } = require("../backend/db");           // same util you use in getRewardStatus
const Workout = require("../backend/models/Workout");
// ----- helper -----
function calcTier(level) {
  if (level >= 8) return "Mythic";
  if (level >= 5) return "Gold";
  if (level >= 3) return "Silver";
  return "Bronze";
}

// GET /api/dnft/:walletId
router.get("/dnft/:walletId", async (req, res) => {
  try {
    const { walletId } = req.params;
    const mongo = await connect();
    const user = await mongo.collection("users")
      .findOne({ walletId: new RegExp(`^${walletId}$`, "i") });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Last 5 workouts for narrative
    const logs = await Workout.find({ userId: user.walletId })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    const dnft = {
      passportId: user.passportId,
      level: user.evolutionLevel || 1,
      xp: user.xp || 0,
      xpThreshold: ((user.evolutionLevel || 1) + 1) * 100,
      traits: {
        badges: user.nftBadges || [],
        tier: calcTier(user.evolutionLevel || 1),
        earnedEmblems: user.emblems || [],
        nextEmblemGoal: "Complete 2 more cardio workouts"
      },
      art: {
        baseImage: `/nfts/base-level${user.evolutionLevel || 1}.png`,
        overlayBadges: (user.nftBadges || []).map(
          (b) => `/badges/${b.toLowerCase()}.png`
        ),
        tierFrame: `/frames/${calcTier(user.evolutionLevel || 1).toLowerCase()}-frame.png`
      },
      narrative: `This Level ${user.evolutionLevel || 1} NFT reflects ${(
        user.nftBadges || []
      ).join(" & ")} growth. Your latest workout: ${
        logs[0]?.workoutText || "—"
      }. Keep it up to unlock the next emblem!`,
      lastUpdated: new Date().toISOString()
    };

    return res.json({ success: true, dnft });
  } catch (err) {
    console.error("/dnft route error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
