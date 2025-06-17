import { useState } from "react";
import { RewardEngine, RewardState, RewardEvent, RewardResult } from "../rewards/RewardEngine";

// Initial/default state
export const initialRewardState: RewardState = {
  xp: 0,
  energyCredits: 0,
  streak: 0,
  evolutionLevel: 1,
  lastActivity: null,
  rewardsReady: false,
};

export function useRewardState() {
  const [rewardState, setRewardState] = useState<RewardState>(initialRewardState);

  // Call this on any rewardable event
  function applyRewardEvent(event: RewardEvent): RewardResult {
    const result = RewardEngine.applyEvent(rewardState, event);
    setRewardState(result.state);
    return result;
  }

  return { rewardState, applyRewardEvent };
}