// backend/routes/verifyWorkout.js
const express = require("express");
const router  = express.Router();        // ✅ define router

// If you need filesystem or path later, keep these
// const fs   = require("fs");
// const path = require("path");

/* -----------------------------------------------------------
   POST /api/verifyWorkout
   Logs a workout, returns AI analysis + reward data
----------------------------------------------------------- */
router.post("/verifyWorkout", async (req, res) => {
  const { userId, workoutText } = req.body;

  if (!userId || !workoutText) {
    return res.status(400).json({ success: false, error: "Missing userId or workoutText" });
  }

  /* ─── Your real XP / level logic goes here ─── */
  const xpGained      = 10;  // TODO: calculate
  const newLevel      = 2;   // TODO: calculate
  const updatedStreak = 6;   // TODO: calculate
  const rewardPoints  = 14;  // TODO: calculate

  // Example AI summary (replace with real AI call if needed)
  const aiResult = {
    summary: "Great CrossFit session! 20 mins, 338 calories burned.",
    // ...other analysis
  };

  // (Optional) Save the log to MongoDB here

  // Respond with reward payload
  res.json({
    success: true,
    aiResult,
    xpGained,
    newLevel,
    updatedStreak,
    rewardPoints,
  });
});

/* ----------------------------------------------------------- */
module.exports = router;      // ✅ export router
