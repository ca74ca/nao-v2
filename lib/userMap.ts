import { connectToDatabase } from './db';

export type NaoUser = {
  whoopUserId: string;
  wallet: string;
  nftTokenId: string;
  vo2max?: number;
  restingHeartRate?: number;
  whoopAccessToken?: string;
  whoopRefreshToken?: string;
  whoopTokenExpiresAt?: Date | string;
  [key: string]: any;
};

export async function findNaoUserByWhoopId(whoopUserId: string): Promise<NaoUser | null> {
  const { db } = await connectToDatabase();
  const doc = await db.collection('users').findOne({ whoopUserId });
  return doc ? (doc as unknown as NaoUser) : null;
}

export async function findNaoUserByWallet(wallet: string): Promise<NaoUser | null> {
  const { db } = await connectToDatabase();
  const doc = await db.collection('users').findOne({ wallet });
  return doc ? (doc as unknown as NaoUser) : null;
}

export async function getUserAccessToken(wallet: string): Promise<string | null> {
  const user = await findNaoUserByWallet(wallet);
  if (user && user.whoopAccessToken) {
    return user.whoopAccessToken;
  }
  return null;
}

export async function saveWhoopTokensToUser(
  wallet: string,
  accessToken: string,
  refreshToken: string,
  expiresAt?: Date
) {
  const { db } = await connectToDatabase();
  await db.collection('users').updateOne(
    { wallet },
    {
      $set: {
        whoopAccessToken: accessToken,
        whoopRefreshToken: refreshToken,
        whoopTokenExpiresAt: expiresAt ?? null,
      },
    }
  );
}

export async function updateUser(
  userKey: string,
  updates: Partial<NaoUser>
): Promise<NaoUser | null> {
  const { db } = await connectToDatabase();
  const query = [
    { wallet: userKey },
    { nftTokenId: userKey },
    { whoopUserId: userKey }
  ];
  let user: NaoUser | null = null;
  for (const q of query) {
    const found = await db.collection('users').findOne(q);
    if (found) {
      user = found as unknown as NaoUser;
      break;
    }
  }
  if (!user) return null;
  await db.collection('users').updateOne(
    { _id: user._id },
    { $set: updates }
  );
  const updated = await db.collection('users').findOne({ _id: user._id });
  return updated ? (updated as unknown as NaoUser) : null;
}

/**
 * Helper to get a valid WHOOP access token, refreshing if needed
 */
export async function getValidWhoopAccessToken(wallet: string): Promise<string | null> {
  const user = await findNaoUserByWallet(wallet);
  if (!user || !user.whoopAccessToken) return null;
  const now = new Date();
  let expiresAt = user.whoopTokenExpiresAt ? new Date(user.whoopTokenExpiresAt) : null;
  // If token is still valid, use it
  if (expiresAt && expiresAt > now) {
    return user.whoopAccessToken;
  }
  // Otherwise, try to refresh
  if (user.whoopRefreshToken) {
    try {
      const resp = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "refresh_token",
          refresh_token: user.whoopRefreshToken,
          client_id: process.env.WHOOP_CLIENT_ID,
          client_secret: process.env.WHOOP_CLIENT_SECRET,
        }),
      });
      if (!resp.ok) throw new Error("Failed to refresh WHOOP token");
      const data = await resp.json();
      const { access_token, refresh_token, expires_in } = data;
      const newExpiresAt = new Date(Date.now() + (expires_in * 1000));
      await saveWhoopTokensToUser(wallet, access_token, refresh_token, newExpiresAt);
      return access_token;
    } catch (err) {
      console.error("❌ WHOOP Token Refresh Error:", err);
      return null;
    }
  }
  return null;
}