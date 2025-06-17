import { useEffect, useRef } from "react";
import { RewardState } from "../rewards/RewardEngine";

/**
 * Hook to sync NFT evolution with reward state level-ups.
 * @param rewardState - Latest reward state from useRewardState
 * @param tokenId - NFT token id to evolve
 * @param evolveNFT - Async function to call your evolve API (tokenId, newLevel, updatedTraits) => Promise<void>
 * @param getUpdatedTraits - Optional: function to build new traits for evolution (level) => traits object
 */
export function useNFTSync(
  rewardState: RewardState,
  tokenId: string,
  evolveNFT: (args: { tokenId: string; newLevel: number; updatedTraits: any }) => Promise<void>,
  getUpdatedTraits?: (level: number) => any
) {
  const prevLevel = useRef(rewardState.evolutionLevel);

  useEffect(() => {
    if (
      rewardState.evolutionLevel > prevLevel.current
    ) {
      // Level up detected - trigger NFT evolution
      const newLevel = rewardState.evolutionLevel;
      const updatedTraits = getUpdatedTraits ? getUpdatedTraits(newLevel) : {};
      evolveNFT({ tokenId, newLevel, updatedTraits });
    }
    prevLevel.current = rewardState.evolutionLevel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rewardState.evolutionLevel, tokenId]);
}