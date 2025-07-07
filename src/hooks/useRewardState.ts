import { useState, useEffect } from "react";
import { RewardState } from "../rewards/RewardEngine";

/* ---------- Initial empty state ---------- */
export const initialRewardState: RewardState = {
  xp: 0,
  energyCredits: 0,
  streak: 0,
  evolutionLevel: 1,
  lastActivity: null,
  rewardsReady: false,
};

/* Backend base URL (env var preferred) */
const BACKEND =
  process.env.NEXT_PUBLIC_NAO_BACKEND_URL ||
  "https://nao-sdk-api.onrender.com";

/* ---------- Hook ---------- */
export function useRewardState(userId: string) {
  const [rewardState, setRewardState] = useState<RewardState>(
    initialRewardState
  );
  const [loading, setLoading] = useState(true);

  /* Fetch live reward state whenever userId changes */
  useEffect(() => {
    async function fetchRewardState() {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND}/api/getRewardStatus`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        if (!res.ok) throw new Error("Failed to fetch reward state");
        const data = await res.json();

        /* Map backend fields → local RewardState */
        setRewardState({
          xp: data.totalXP,
          energyCredits: data.rewardPoints,
          streak: data.streak,
          evolutionLevel: data.level,
          lastActivity: null,
          rewardsReady: true,
        });
      } catch {
        setRewardState(initialRewardState);
      } finally {
        setLoading(false);
      }
    }

    if (userId) fetchRewardState();
  }, [userId]);

  /* No custom event-sync yet — workouts already handled via /verifyWorkout */
  return { rewardState, loading };
}
