// In-memory user mapping for development/demo purposes
type NaoUser = {
  wallet: string;
  nftTokenId: string;
  whoopUserId: string;
};

// You can export and manage this elsewhere if you want
const userMap: Record<string, NaoUser> = {
  "whoop_user_001": { wallet: "0x123...abc", nftTokenId: "1", whoopUserId: "whoop_user_001" },
  // Add more demo users as needed
};

export async function findNaoUserByWhoopId(whoopUserId: string): Promise<NaoUser | null> {
  // Simulate async, matches future DB call signature
  return userMap[whoopUserId] || null;
}