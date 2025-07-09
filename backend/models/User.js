const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Workout = require("../models/Workout");

// Tier logic helper
function calcTier(level) {
  if (level >= 15) return "Mythic";
  if (level >= 10) return "Gold";
  if (level >= 5) return "Silver";
  return "Bronze";
}

// GET /api/dnft/:walletId
router.get("/dnft/:walletId", async (req, res) => {
  let { walletId } = req.params;

  if (typeof walletId !== "string") {
    return res.status(400).json({ success: false, message: "Invalid walletId format" });
  }

  walletId = walletId.toLowerCase();

  if (!/^0x[a-f0-9]{40}$/.test(walletId)) {
    return res.status(400).json({ success: false, message: "Invalid walletId format" });
  }

  try {
    const user = await User.findOne(
      { walletId },
      "xp evolutionLevel rewardPoints streak achievements avatarUrl bio"
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const logs = await Workout.find({ userId: walletId })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    const level = user.evolutionLevel || 1;
    const tier = calcTier(level);
    const badges = user.achievements || [];

    const dnft = {
      avatarUrl: user.avatarUrl,
      level,
      xp: user.xp || 0,
      xpThreshold: (level + 1) * 100,
      traits: {
        badges,
        tier,
        nextEmblemGoal: "Complete 2 more cardio workouts", // still optional logic
      },
      art: {
        baseImage: `/nfts/base-level${level}.png`,
        overlayBadges: badges.map((b) => `/badges/${b.toLowerCase()}.png`),
        tierFrame: `/frames/${tier.toLowerCase()}-frame.png`,
      },
      narrative: `This Level ${level} NFT reflects ${
        badges.length ? badges.join(" & ") : "your"
      } growth. Your latest workout: ${
        logs[0]?.workoutText || "—"
      }. Keep it up to unlock the next emblem!`,
      lastUpdated: new Date().toISOString(),
    };

    return res.json({ success: true, dnft });
  } catch (err) {
    console.error("🔥 /dnft route error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
