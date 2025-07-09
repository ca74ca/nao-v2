const express = require("express");
const router = express.Router();
const db = require("../backend/db"); // Your existing MongoDB connection utility

/* -----------------------------------------------------------
   POST /getRewardStatus
   Returns XP, level, streak, rewardPoints, nftBadges
----------------------------------------------------------- */
router.post("/getRewardStatus", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing userId" });
    }

    const mongo = await db.connect(); // db.connect() returns a connected MongoDB client
    const user = await mongo
      .collection("users")
      .findOne({ walletId: userId });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const {
      xp = 0,
      evolutionLevel = 1,
      rewardPoints = 0,
      streak = 0,
      nftBadges = [],
    } = user;

    return res.json({
      success: true,
      xp,
      level: evolutionLevel,
      rewardPoints,
      streak,
      nftBadges,
    });
  } catch (err) {
    console.error("🔥 /getRewardStatus error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;