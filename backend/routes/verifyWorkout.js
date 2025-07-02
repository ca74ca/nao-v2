// backend/routes/verifyWorkout.js

const express = require("express");
const router = express.Router();

/* -----------------------------------------------------------
   POST /api/verifyWorkout
   Logs a workout, returns AI analysis + reward data
----------------------------------------------------------- */
router.post("/verifyWorkout", async (req, res) => {
  try {
    const { userId, workoutText } = req.body;

    // Validate inputs
    if (!userId || !workoutText) {
      console.warn("❌ Missing userId or workoutText:", { userId, workoutText });
      return res.status(400).json({
        success: false,
        error: "Missing userId or workoutText",
      });
    }

    /* 🧠 Placeholder logic — update this in next phase */
    const xpGained = 10;        // TEMP: Static XP
    const newLevel = 2;         // TEMP: Static level
    const updatedStreak = 6;    // TEMP: Static streak
    const rewardPoints = 14;    // TEMP: Static rewards

    // ✅ Simple AI summary as string (not object!)
    const aiResult = `Verified workout: "${workoutText}". Estimated effort level: High. Calories burned ~338.`;

    // ⏳ Optional MongoDB insert can go here later

    // 🧾 Debug logs (keep during launch)
    console.log("✅ Workout verified for:", userId);
    console.log("📋 Workout:", workoutText);
    console.log("🎁 Rewards:", {
      xpGained,
      newLevel,
      updatedStreak,
      rewardPoints,
    });

    // ✅ Final response
    return res.json({
      success: true,
      userId,
      aiResult,
      xpGained,
      newLevel,
      updatedStreak,
      rewardPoints,
    });

  } catch (err) {
    console.error("🔥 /verifyWorkout failed:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/* ----------------------------------------------------------- */
module.exports = router;
