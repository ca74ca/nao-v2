const express = require('express');
const router = express.Router();
const db = require('../db.js'); // ✅ Explicit extension for safety

// POST /onboard
router.post('/', async (req, res) => {
  const { username, email, healthGoals, connectWearables } = req.body;

  // Validate required fields
  if (!username || !email || typeof healthGoals !== 'string' || typeof connectWearables !== 'boolean') {
    return res.status(400).json({ error: 'Missing or invalid required fields' });
  }

  try {
    const database = await db.connect();
    const users = database.collection('users');

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const newUser = {
      username,
      email,
      healthGoals,
      connectWearables,
      createdAt: new Date()
    };

    await users.insertOne(newUser);
    return res.status(200).json({ success: true, user: newUser });
  } catch (error) {
    console.error("🔥 Onboard Error:", error);
    return res.status(500).json({ error: 'Failed to onboard user', details: error.message });
  }
});

module.exports = router;
