const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { getUserStatus } = require("../lib/RewardEngine"); // ✅ reuse core logic

/* -----------------------------------------------------------
   GET /api/getRewardStatus?userId=...
   Returns real-time user XP, level, streak, points, etc.
----------------------------------------------------------- */
router.get("/getRewardStatus", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, error: "Missing userId" });
    }

    const status = await getUserStatus(userId); // 🧠 calls RewardEngine
    if (!status) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.json({ success: true, userId, ...status });

  } catch (err) {
    console.error("🔥 /getRewardStatus error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/* ----------------------------------------------------------- */
module.exports = router;
