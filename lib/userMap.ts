import { connectToDatabase } from './db';

export type NaoUser = {
  whoopUserId: string;
  wallet: string;
  nftTokenId: string;
  vo2max?: number;
  restingHeartRate?: number;
  [key: string]: any;
};

// Find user by WHOOP user ID
export async function findNaoUserByWhoopId(whoopUserId: string): Promise<NaoUser | null> {
  const db = await connectToDatabase();
  return db.collection('users').findOne({ whoopUserId });
}

// Update user by wallet, nftTokenId, or whoopUserId
export async function updateUser(
  userKey: string, // could be whoopUserId, wallet, or nftTokenId
  updates: Partial<NaoUser>
): Promise<NaoUser | null> {
  const db = await connectToDatabase();

  // Try several keys for flexibility
  const query = [
    { wallet: userKey },
    { nftTokenId: userKey },
    { whoopUserId: userKey }
  ];
  let user = null;
  for (const q of query) {
    user = await db.collection('users').findOne(q);
    if (user) break;
  }
  if (!user) return null;

  await db.collection('users').updateOne(
    { _id: user._id },
    { $set: updates }
  );
  // Return the updated user
  return db.collection('users').findOne({ _id: user._id });
}