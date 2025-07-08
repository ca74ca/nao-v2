const express = require("express");
const router = express.Router();
const Workout = require("../models/Workout"); // ✅ Use correct model

// GET /api/history/:userId?limit=5
router.get("/history/:userId", async (req, res) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit) || 5;

  try {
    const logs = await Workout.find({ userId: new RegExp(`^${userId}$`, "i") }) // ✅ Case-insensitive match on userId
      .sort({ timestamp: -1 }) // ✅ use 'timestamp', not 'createdAt'
      .limit(limit)
      .lean();

    res.json({ success: true, logs });
  } catch (err) {
    console.error("Failed to fetch workout history", err);
    res.status(500).json({ success: false, error: "Could not fetch workout history" });
  }
});

module.exports = router;
