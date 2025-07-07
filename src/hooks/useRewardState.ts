import { useState, useEffect } from "react";
import { RewardEngine, RewardState, RewardEvent, RewardResult } from "../rewards/RewardEngine";

export const initialRewardState: RewardState = {
  xp: 0,
  energyCredits: 0,
  streak: 0,
  evolutionLevel: 1,
  lastActivity: null,
  rewardsReady: false,
};

const BACKEND = process.env.NEXT_PUBLIC_NAO_BACKEND_URL || "https://nao-sdk-api.onrender.com";

export function useRewardState(userId: string) {
  const [rewardState, setRewardState] = useState<RewardState>(initialRewardState);
  const [loading, setLoading] = useState(true);

  // Fetch reward state from backend on mount
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
        setRewardState({
          xp: data.totalXP,
          energyCredits: data.rewardPoints || 0,
          streak: data.streak,
          evolutionLevel: data.level,
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

  // Apply reward event using existing backend logic
  async function applyRewardEvent(event: RewardEvent): Promise<RewardResult> {
    try {
      // Use RewardEngine client-side for immediate feedback
      const result = RewardEngine.applyEvent(rewardState, event);
      
      // Update state optimistically
      setRewardState(result.state);
      
      // If it's a workout event, sync with backend via verifyWorkout
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
            // Refresh state from backend to get accurate data
            const statusRes = await fetch(`${BACKEND}/api/getRewardStatus`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId }),
            });
            
            if (statusRes.ok) {
              const data = await statusRes.json();
              setRewardState({
                xp: data.totalXP,
                energyCredits: data.rewardPoints,
                streak: data.streak,
                evolutionLevel: data.level,
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
      // Rollback on error
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
