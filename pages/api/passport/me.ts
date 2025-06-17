import type { NextApiRequest, NextApiResponse } from 'next';

// Replace this with real data fetching logic as needed!
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    username: "JaneDoe",
    walletAddress: "0x1234...abcd",
    nftImage: "https://gateway.thirdweb.com/ipfs/xyz",
    xp: 410,
    streakLevel: 3,
    longevityScore: 82,
  });
}