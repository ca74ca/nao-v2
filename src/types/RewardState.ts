export interface RewardState {
  xp: number;
  streak: number;
  usdcReward: number;
  energyCredits: number;
  evolutionLevel: number;
  lastActivity?: Date | null;
  rewardsReady?: boolean;
  strainScore?: number; // ✅ Add this to stop the strainScore errors.
}
