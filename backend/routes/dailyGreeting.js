// backend/routes/dailyGreeting.js
const express  = require("express");
const router   = express.Router();
const User     = require("../models/User");               // adjust path if different
const { generateDailyMessage } = require("../utils/generateDailyMessage");
const OpenAI   = require("openai").default;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * GET /api/daily-greeting
 * Cron-safe endpoint — triggers NAO’s once-a-day greeting for every user.
 */
router.get("/daily-greeting", async (_, res) => {
  try {
    const users = await User.find();

    let greetedCount = 0;

    for (const user of users) {
      // Skip if greeted <24h ago
      if (user.lastGreeted && Date.now() - user.lastGreeted < 86_400_000) continue;

      // Build personalized message
      const msg = generateDailyMessage({
        username: user.username,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        rewardPoints: user.rewardPoints
      });

      // Send message into their existing OpenAI thread
      if (user.threadId) {
        await openai.beta.threads.messages.create(user.threadId, {
          role: "assistant",
          content: msg
        });
      }

      // Update timestamp
      user.lastGreeted = Date.now();
      await user.save();
      greetedCount++;
    }

    res.json({ success: true, greeted: greetedCount });
  } catch (err) {
    console.error("[daily-greeting] error:", err);
    res.status(500).json({ success: false, error: "Failed to send greetings" });
  }
});

module.exports = router;
