import { useState, useEffect } from "react";
import { RewardEngine, RewardState, RewardEvent, RewardResult } from "../rewards/RewardEngine";

// Make sure you define or import this!
export const initialRewardState: RewardState = {
  xp: 0,
  energyCredits: 0,
  streak: 0,
  evolutionLevel: 1,
  lastActivity: null,
  rewardsReady: false,
};

// Replace with your actual API endpoint
const REWARD_API = "/api/rewards";

export function useRewardState(userId: string) {
  const [rewardState, setRewardState] = useState<RewardState>(initialRewardState);
  const [loading, setLoading] = useState(true);

  // Fetch reward state from API on load
  useEffect(() => {
    async function fetchRewardState() {
      setLoading(true);
      try {
        const res = await fetch(`${REWARD_API}?userId=${userId}`);
        if (!res.ok) throw new Error("Failed to fetch reward state");
        const data = await res.json();
        setRewardState(data); // Optionally validate/transform data
      } catch (e) {
        setRewardState(initialRewardState);
      } finally {
        setLoading(false);
      }
    }
    if (userId) fetchRewardState();
  }, [userId]);

  // Apply reward event and sync to backend
  async function applyRewardEvent(event: RewardEvent): Promise<RewardResult> {
    // Optimistic update (optional)
    const optimistic = RewardEngine.applyEvent(rewardState, event);
    setRewardState(optimistic.state);

    try {
      const res = await fetch(`${REWARD_API}/event`, {
        method: "POST",
        body: JSON.stringify({ userId, event }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to update reward event");
      const data = await res.json();
      setRewardState(data.state); // Make sure your backend returns { state }
      return data;
    } catch (err) {
      // Optionally roll back optimistic update on error
      setRewardState(rewardState);
      throw err;
    }
  }

  return { rewardState, applyRewardEvent, loading };
}