import mongoose from "mongoose";
import User from "../models/User";
import Workout from "../models/Workout";
import RewardEvent from "../models/RewardEvent";

// XP thresholds for each level (can be tweaked in the future)
const LEVEL_THRESHOLDS = [0, 20, 50, 90, 140];

/* ------------------------------------------------------------------
   Core helper → current XP goal & remaining for any totalXP value
------------------------------------------------------------------ */
function calcGoal(totalXP: number) {
  const nextIdx = LEVEL_THRESHOLDS.findIndex((xp) => xp > totalXP);
  const xpGoal =
    nextIdx === -1
      ? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 50 // fallback if out‑of‑range
      : LEVEL_THRESHOLDS[nextIdx];
  return { xpGoal, xpRemaining: Math.max(0, xpGoal - totalXP) };
}

/* ------------------------------------------------------------------
   processWorkout → called by /verifyWorkout
------------------------------------------------------------------ */
export async function processWorkout(userId: string, workoutData: any) {
  await mongoose.connect(process.env.MONGODB_URI!);

  /* 1️⃣  Fetch user */
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  /* 2️⃣  XP & level math */
  const xpGained = workoutData.xpEstimate || 10;
  const newXP = (user.xp || 0) + xpGained;
  const newLevel = LEVEL_THRESHOLDS.filter((xp) => newXP >= xp).length;
  const { xpGoal, xpRemaining } = calcGoal(newXP);

  /* 3️⃣  Streak */
  const now = new Date();
  const last = user.lastWorkout ? new Date(user.lastWorkout) : null;
  const sameDay = last && last.toDateString() === now.toDateString();
  const within48h =
    last && Date.now() - last.getTime() < 48 * 3600 * 1000;
  const streak = sameDay ? user.streak : within48h ? user.streak + 1 : 1;

  /* 4️⃣  Persist user */
  user.xp = newXP;
  user.rewardPoints = (user.rewardPoints || 0) + Math.floor(xpGained / 2);
  user.evolutionLevel = newLevel;
  user.streak = streak;
  user.lastWorkout = now;
  await user.save();

  /* 5️⃣  Save workout + reward event */
  await Workout.create({ userId, ...workoutData, xpGained, createdAt: now });
  await RewardEvent.create({
    userId,
    type: "workout",
    details: {
      workoutText: workoutData.originalText,
      xpGained,
      newLevel,
      streak,
    },
    createdAt: now,
  });

  /* 6️⃣  Return state */
  return {
    xpGained,
    totalXP: newXP,
    newLevel,
    rewardPoints: user.rewardPoints,
    streak,
    xpGoal,
    xpRemaining,
  };
}

/* ------------------------------------------------------------------
   getUserStatus → used by /getRewardStatus & assistant tool
------------------------------------------------------------------ */
export async function getUserStatus(userId: string) {
  await mongoose.connect(process.env.MONGODB_URI!);
  const user = await User.findById(userId);
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
