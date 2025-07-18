import { useState, useEffect } from "react";
import { RewardEngine, RewardEvent, RewardResult } from "../rewards/RewardEngine";
import { RewardState } from "../types/RewardState"; // ✅ Correct source for RewardState

export const initialRewardState: RewardState = {
  xp: 0,
  energyCredits: 0,
  streak: 0,
  evolutionLevel: 1,
  usdcReward: 0,
  lastActivity: null,
  rewardsReady: false,
};

const BACKEND = process.env.NEXT_PUBLIC_NAO_BACKEND_URL || "https://nao-sdk-api.onrender.com";

// ✅ Add proper typing to your backend response
interface BackendRewardResponse {
  totalXP: number;
  rewardPoints: number;
  streak: number;
  level: number;
  usdcReward: number;
}

export function useRewardState(userId: string) {
  const [rewardState, setRewardState] = useState<RewardState>(initialRewardState);
  const [loading, setLoading] = useState(true);

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

        const data: BackendRewardResponse = await res.json();

        setRewardState({
          xp: data.totalXP,
          energyCredits: data.rewardPoints || 0,
          streak: data.streak,
          evolutionLevel: data.level,
          usdcReward: data.usdcReward || 0,
          lastActivity: null,
          rewardsReady: true,
        });
      } catch (e) {
        console.error("useRewardState fetch error:", e);
        setRewardState(initialRewardState);
      } finally {
        setLoading(false);
      }
    }

    if (userId) fetchRewardState();
  }, [userId]);

  async function applyRewardEvent(event: RewardEvent): Promise<RewardResult> {
    try {
      const result = RewardEngine.applyEvent(rewardState, event);
      setRewardState(result.state);

      if (event.type === "workout" && event.complete) {
        try {
          const workoutRes = await fetch(`${BACKEND}/api/verifyWorkout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              workoutText: "Manual workout logged via app"
            }),
          });

          if (workoutRes.ok) {
            const statusRes = await fetch(`${BACKEND}/api/getRewardStatus`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId }),
            });

            if (statusRes.ok) {
              const data: BackendRewardResponse = await statusRes.json();
              setRewardState({
                xp: data.totalXP,
                energyCredits: data.rewardPoints,
                streak: data.streak,
                evolutionLevel: data.level,
                usdcReward: data.usdcReward || 0,
                lastActivity: new Date(),
                rewardsReady: true,
              });
            }
          }
        } catch (syncErr) {
          console.warn("Backend sync failed, using client-side result:", syncErr);
        }
      }

      return result;
    } catch (err) {
      console.error("applyRewardEvent error:", err);
      setRewardState(rewardState);
      throw err;
    }
  }

  return {
    rewardState,
    applyRewardEvent,
    loading,
  };
}
