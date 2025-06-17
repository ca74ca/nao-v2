// Stores and retrieves user reward state (in-memory)

import { RewardState } from '../src/rewards/RewardEngine';

// Define your initial reward state for new users
export const initialRewardState: RewardState = {
  xp: 0,
  energyCredits: 0,
  streak: 0,
  evolutionLevel: 0,
  lastActivity: null,
  rewardsReady: false,
};

const rewardStateStore: Record<string, RewardState> = {};

export function getUserRewardState(wallet: string): RewardState {
  return rewardStateStore[wallet] || initialRewardState;
}

export function saveRewardState(wallet: string, state: RewardState): void {
  rewardStateStore[wallet] = state;
}