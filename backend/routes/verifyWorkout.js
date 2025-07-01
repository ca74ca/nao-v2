const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const WorkoutLog = require('../models/WorkoutLog');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/verify', async (req, res) => {
  const { userId, workoutText } = req.body;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: "You are a helpful assistant that verifies workout logs for plausibility and honesty. Reply with a JSON object: { plausible: true/false, reasoning: 'short explanation', suggestion: 'optional improvement' }. Only use JSON."
        },
        { role: 'user', content: workoutText }
      ]
    });

    const aiResult = JSON.parse(completion.choices[0].message.content);

    const log = await WorkoutLog.create({
      userId,
      workoutText,
      aiResult,
      timestamp: new Date()
    });

    res.json({ success: true, aiResult, logId: log._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;