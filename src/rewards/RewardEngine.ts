// NAO RewardEngine: Handles user XP/credit gain, streaks, reward triggers, NFT evolution, and payout eligibility.

export type RewardEvent =
  | { type: "calories"; value: number; goal: number }
  | { type: "workout"; complete: boolean }
  | { type: "streak"; days: number }
  | { type: "strain"; value: number } // Added for WHOOP strain score
  | { type: "custom"; reason: string; xp: number };

export type RewardState = {
  xp: number;
  energyCredits: number;
  streak: number;
  evolutionLevel: number;
  lastActivity: Date | null;
  rewardsReady: boolean;
  strainScore?: number; // Track latest strain score
};

export type RewardResult = {
  state: RewardState;
  rewardDelta: {
    xp: number;
    energyCredits: number;
    evolutionLevel: number;
    streak: number;
    rewardsReady: boolean;
    strainScore?: number;
  };
  triggered: string[]; // Reasons: ['calorieGoal', 'workout', 'streak', ...]
};

export class RewardEngine {
  static XP_GOAL = 500;
  static CALORIE_GOAL = 600;
  static WORKOUT_XP = 100;
  static CALORIE_XP = 100;
  static STREAK_XP = 50;
  static LEVEL_UP_XP = 500;
  static STRAIN_XP = 10; // XP per strain point (adjust as needed)

  static applyEvent(state: RewardState, event: RewardEvent): RewardResult {
    let xp = state.xp;
    let energyCredits = state.energyCredits;
    let streak = state.streak;
    let evolutionLevel = state.evolutionLevel;
    let rewardsReady = state.rewardsReady;
    let strainScore = state.strainScore ?? 0; // Use previous or 0
    const triggered: string[] = [];

    switch (event.type) {
      case "calories":
        if (event.value >= event.goal) {
          xp += RewardEngine.CALORIE_XP;
          energyCredits += RewardEngine.CALORIE_XP;
          triggered.push("calorieGoal");
        }
        break;
      case "workout":
        if (event.complete) {
          xp += RewardEngine.WORKOUT_XP;
          energyCredits += RewardEngine.WORKOUT_XP;
          triggered.push("workout");
        }
        break;
      case "streak":
        if (event.days > state.streak) {
          streak = event.days;
          xp += RewardEngine.STREAK_XP;
          energyCredits += RewardEngine.STREAK_XP;
          triggered.push("streak");
        }
        break;
      case "strain":
        if (event.value > 0) {
          const strainXP = Math.round(event.value * RewardEngine.STRAIN_XP);
          xp += strainXP;
          energyCredits += strainXP;
          triggered.push("strain");
          strainScore = event.value; // update with latest strain score
        }
        break;
      case "custom":
        xp += event.xp;
        energyCredits += event.xp;
        triggered.push(event.reason);
        break;
    }

    // Level up logic
    let levelUp = 0;
    while (xp >= RewardEngine.LEVEL_UP_XP) {
      evolutionLevel += 1;
      xp -= RewardEngine.LEVEL_UP_XP;
      levelUp += 1;
    }
    if (levelUp > 0) triggered.push("levelUp");

    // Reward ready logic (for redemption)
    if (energyCredits >= RewardEngine.XP_GOAL) {
      rewardsReady = true;
      triggered.push("rewardReady");
    }

    // Compose new state
    const newState: RewardState = {
      xp,
      energyCredits,
      streak,
      evolutionLevel,
      lastActivity: new Date(),
      rewardsReady,
      strainScore,
    };

    return {
      state: newState,
      rewardDelta: {
        xp: newState.xp - state.xp,
        energyCredits: newState.energyCredits - state.energyCredits,
        evolutionLevel: newState.evolutionLevel - state.evolutionLevel,
        streak: newState.streak - state.streak,
        rewardsReady: newState.rewardsReady !== state.rewardsReady,
        strainScore: newState.strainScore !== state.strainScore ? newState.strainScore : undefined,
      },
      triggered,
    };
  }
}