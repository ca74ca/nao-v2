import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../lib/db';
import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { ethers } from 'ethers';

const sdk = ThirdwebSDK.fromPrivateKey(
  process.env.PRIVATE_KEY as string,
  'polygon',
  {
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
  }
);
const contractAddress = process.env.NAO_NFT_CONTRACT_ADDRESS as string;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { wallet, email } = req.body;

  if (!wallet || !email) {
    return res.status(400).json({ error: 'Missing wallet or email' });
  }

  try {
    const { db } = await connectToDatabase();
    const users = db.collection('users');
    const user = await users.findOne({ email: { $regex: `^${email.trim()}$`, $options: 'i' } });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const currentLevel = user.level || 1;
    const nextLevel = Math.min(currentLevel + 1, 5);
    const xp = user.xp || 0;
    const currentBalance = user.rewardBalance || 0;
    const newBalance = Math.max(currentBalance - 50, 0); // Prevent negative balance

    await users.updateOne(
      { email },
      { $set: { level: nextLevel, xp, rewardBalance: newBalance } }
    );

    const contract = await sdk.getContract(contractAddress, 'nft');

    const traitMap: any = {
      1: 'Bronze',
      2: 'Silver',
      3: 'Gold',
      4: 'Platinum',
      5: 'Mythic',
    };
    const newTrait = traitMap[nextLevel];
    const tokenId = user.tokenId;

    if (!tokenId) {
      return res.status(400).json({ error: 'User does not have an associated NFT tokenId' });
    }

    await contract.erc721.updateMetadata(tokenId, {
      name: `NAO Health Passport - Level ${nextLevel}`,
      description: `Your evolving Health NFT. Current Trait: ${newTrait}`,
      image: `https://naoverse.io/level_${nextLevel}_${newTrait.toLowerCase()}.png`,
      attributes: [
        { trait_type: 'Level', value: nextLevel },
        { trait_type: 'Trait', value: newTrait },
        { trait_type: 'XP', value: xp },
      ],
    });

    // Fetch the newly updated user for latest reward balance
    const updatedUser = await users.findOne({ email });

    res.status(200).json({
      level: nextLevel,
      xp,
      walletId: wallet,
      email,
      evolutionLevel: nextLevel,
      rewardBalance: updatedUser?.rewardBalance || 0, // ✅ Return this for frontend sync
      tokenId,
    });
  } catch (err) {
    console.error('Evolve Error:', err);
    res.status(500).json({ error: 'Failed to evolve NFT' });
  }
}
