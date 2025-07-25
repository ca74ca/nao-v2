const mongoose = require("mongoose");
const User = require("../models/User");
const Workout = require("../models/Workout");
const RewardEvent = require("../models/RewardEvent");

const LEVEL_THRESHOLDS = [0, 20, 50, 90, 140];

// 🔍 Helper: Find user by walletId (case-insensitive)
async function findUserByWalletId(walletId) {
  await mongoose.connect(process.env.MONGODB_URI);
  const walletRegex = new RegExp(`^${walletId}$`, 'i');
  console.log("Looking up user by walletId (case-insensitive):", walletId);
  return await User.findOne({ walletId: walletRegex });
}

function calcGoal(totalXP) {
  const nextIdx = LEVEL_THRESHOLDS.findIndex((xp) => xp > totalXP);
  const xpGoal = nextIdx === -1
    ? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 50
    : LEVEL_THRESHOLDS[nextIdx];
  return { xpGoal, xpRemaining: Math.max(0, xpGoal - totalXP) };
}

async function processWorkout(userId, workoutData) {
  const user = await findUserByWalletId(userId);
  if (!user) throw new Error("User not found");

  const xpGained = workoutData.xpEstimate || 10;
  const newXP = (user.xp || 0) + xpGained;
  const newLevel = LEVEL_THRESHOLDS.filter((xp) => newXP >= xp).length;
  const { xpGoal, xpRemaining } = calcGoal(newXP);

  const now = new Date();
  const last = user.lastWorkout ? new Date(user.lastWorkout) : null;
  const sameDay = last && last.toDateString() === now.toDateString();
  const within48h = last && Date.now() - last.getTime() < 48 * 3600 * 1000;
  const streak = sameDay ? user.streak : within48h ? (user.streak || 0) + 1 : 1;

  // 🧠 Update user state
  user.xp = newXP;
  user.rewardPoints = (user.rewardPoints || 0) + Math.floor(xpGained / 2);
  user.evolutionLevel = newLevel;
  user.streak = streak;
  user.lastWorkout = now;
  await user.save();

  // 💬 Normalize workoutText
  const workoutText =
    workoutData.originalText ||
    workoutData.workoutText ||
    "Workout logged";

  // 📝 Log workout
  await Workout.create({
    userId: user.walletId,
    workoutText,
    ...workoutData,
    xpGained,
    timestamp: now, // ✅ Corrected from createdAt
  });

  // 🏆 Log reward event
  await RewardEvent.create({
    userId: user.walletId,
    eventType: "workout",
    details: {
      workoutText,
      xpGained,
      newLevel,
      streak,
    },
    timestamp: now,
  });

  return {
    xpGained,
    totalXP: newXP,
    newLevel,
    rewardPoints: user.rewardPoints,
    updatedStreak: streak,
    xpGoal,
    xpRemaining,
  };
}

async function getUserStatus(userId) {
  const user = await findUserByWalletId(userId);
  if (!user) return null;

  const { xpGoal, xpRemaining } = calcGoal(user.xp || 0);

  return {
    totalXP: user.xp || 0,
    level: user.evolutionLevel || 1,
    rewardPoints: user.rewardPoints || 0,
    streak: user.streak || 0,
    xpGoal,
    xpRemaining,
  };
}

module.exports = {
  processWorkout,
  getUserStatus,
};
