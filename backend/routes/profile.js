import { Router } from 'express';
const router = Router();
// If you use a DB, import it as usual
import db from '../db.js'; // Make sure db.js is also an ES module

// GET /profile?email=user@email.com
router.get('/profile', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  // Example: replace with your actual user lookup logic
  const user = await db.users.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json(user);
});

// POST /onboard
router.post('/onboard', async (req, res) => {
  const { username, email, healthGoals, connectWearables } = req.body;
  if (!username || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const newUser = await db.users.insertOne({
      username,
      email,
      healthGoals,
      connectWearables,
      createdAt: new Date()
    });
    res.json({ success: true, user: newUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to onboard user', details: error.message });
  }
});

export default router;