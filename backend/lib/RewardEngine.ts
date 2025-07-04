// backend/lib/RewardEngine.ts
import mongoose from "mongoose";
import User from "../models/User";
import Workout from "../models/Workout";
import RewardEvent from "../models/RewardEvent";

// Example config (you can customize later)
const LEVEL_THRESHOLDS = [0, 20, 50, 90, 140]; // XP needed per level

export async function processWorkout(userId: string, workoutData: any) {
  await mongoose.connect(process.env.MONGODB_URI!);

  // 1. Fetch user or throw error
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // 2. Calculate XP & level
  const xpGained = workoutData.xpEstimate || 10;
  const now = new Date();

  const prevXP = user.xp || 0;
  const newXP = prevXP + xpGained;

  // Determine new level
  const newLevel = LEVEL_THRESHOLDS.filter(xp => newXP >= xp).length;
  const xpGoal = LEVEL_THRESHOLDS[newLevel] || (LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 50);
  const xpRemaining = Math.max(0, xpGoal - newXP);

  // 3. Streak logic
  const last = user.lastWorkout ? new Date(user.lastWorkout) : null;
  const isToday = last && new Date(last).toDateString() === now.toDateString();
  const streak = isToday ? user.streak : (last && Date.now() - last.getTime() < 48 * 3600 * 1000 ? user.streak + 1 : 1);

  // 4. Update user
  user.xp = newXP;
  user.rewardPoints = (user.rewardPoints || 0) + Math.floor(xpGained / 2);
  user.evolutionLevel = newLevel;
  user.streak = streak;
  user.lastWorkout = now;
  await user.save();

  // 5. Save workout
  await Workout.create({
    userId,
    ...workoutData,
    xpGained,
    createdAt: now
  });

  // 6. Log reward event
  await RewardEvent.create({
    userId,
    type: "workout",
    details: {
      workoutText: workoutData.originalText,
      xpGained,
      newLevel,
      streak,
    },
    createdAt: now
  });

  // 7. Return updated state
  return {
    xpGained,
    totalXP: newXP,
    newLevel,
    rewardPoints: user.rewardPoints,
    streak,
    xpGoal,
    xpRemaining,
    evolutionTriggered: newLevel > user.evolutionLevel
  };
}
