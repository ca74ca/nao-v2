const express = require("express");
const router = express.Router();

// ✅ Import your real reward engine (adjust the path as needed)
const { processWorkout } = require("../lib/RewardEngine.js");

/* -----------------------------------------------------------
   POST /api/verifyWorkout
   Logs a workout, returns AI analysis + reward data
----------------------------------------------------------- */
router.post("/verifyWorkout", async (req, res) => {
  // Debug: log the full body for troubleshooting
  console.log("Incoming verifyWorkout body:", req.body);

  try {
    const { userId, workoutText, source = "manual" } = req.body;

    // Validate inputs
    if (!userId || !workoutText) {
      console.warn("❌ Missing userId or workoutText:", { userId, workoutText });
      return res.status(400).json({
        success: false,
        error: "Missing userId or workoutText",
      });
    }

    // Normalize wallet address (best practice for Ethereum)
    const normalizedUserId = typeof userId === "string" ? userId.toLowerCase() : userId;

    /* 🧠 1. OPTIONAL: call your AI parser here to get structured data  */
    // const parsed = await parseWorkoutAI(workoutText, source);
    // For now we'll just wrap the raw text:
    const parsed = {
      source,
      originalText: workoutText,
      summary: `Workout verified: "${workoutText}"`,
      type: "mixed",
      duration: null,
      intensity: "unknown",
      calories: null,
      xpEstimate: 10 // <-- replace with real AI estimate if you have it
    };

    /* ⚙️ 2. Process the workout & calculate rewards */
    const reward = await processWorkout(normalizedUserId, parsed);
    // reward = { xpGained, totalXP, newLevel, streak, rewardPoints, xpGoal, xpRemaining, evolutionTriggered }

    // 🧾 Debug logs (keep during launch)
    console.log("✅ Workout verified for:", normalizedUserId);
    console.log("📋 Workout:", workoutText);
    console.log("🎁 Rewards:", reward);

    /* 📣 3. Return the truth back to the frontend / assistant */
    return res.json({
      success: true,
      userId: normalizedUserId,
      aiResult: parsed.summary,
      ...reward
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