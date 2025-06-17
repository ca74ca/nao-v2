import type { NextApiRequest, NextApiResponse } from "next";

// Helper: get start/end of today in ISO (UTC)
function getTodayRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));
  return {
    start: start.toISOString().slice(0, 19) + "Z",
    end: end.toISOString().slice(0, 19) + "Z",
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // TODO: Replace this with real user's OAuth token lookup
    const whoopToken = process.env.TEST_WHOOP_TOKEN || "mock_token";

    // --- STEP 1: fetch workouts for today from WHOOP ---
    // For now, we'll return mock calories. For real, use:
    // const { start, end } = getTodayRange();
    // const workoutsRes = await fetch(
    //   `https://api.prod.whoop.com/activities?start=${start}&end=${end}`,
    //   { headers: { Authorization: `Bearer ${whoopToken}` } }
    // );
    // const workouts = await workoutsRes.json();

    // Mock example: pretend we got 2 workouts today from WHOOP
    const mockWorkouts = [
      { calories: 340, activity_type: "Running", strain: 10 },
      { calories: 180, activity_type: "Cycling", strain: 12 }
    ];
    // Sum calories for today
    const calories_today = mockWorkouts.reduce((sum, w) => sum + w.calories, 0);
    const calorie_goal = 600; // You can make this user-specific if you wish!
    const workout_count = mockWorkouts.length; // NEW: Number of workouts today

    // --- STEP 2: Respond with all data ---
    res.status(200).json({
      profile: { user: { first_name: "Test", last_name: "User" } },
      recovery: { score: 85 },
      strain: { score: 10 },
      sleep: { score: 90 },
      workout: {
        calories_today,
        goal: calorie_goal,
        count: workout_count, // NEW: Number of workouts for "Workout Achieved"
        // Optionally, return detailed workouts if needed:
        // details: mockWorkouts
      }
    });
  } catch (error: any) {
    console.error("WHOOP API ERROR:", error);
    res.status(500).json({ error: error.message || "Unknown error" });
  }
}