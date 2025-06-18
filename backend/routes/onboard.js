const express = require('express');
const router = express.Router();
const db = require('../db'); // Connects to your MongoDB

// POST /onboard
router.post('/', async (req, res) => {
  const { username, email, healthGoals, connectWearables } = req.body;
  if (!username || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
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
    res.json({ success: true, user: newUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to onboard user', details: error.message });
  }
});

module.exports = router;