import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../lib/db';
import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { ethers } from 'ethers';

const sdk = ThirdwebSDK.fromPrivateKey(process.env.ADMIN_PRIVATE_KEY as string, 'polygon'); // your chain
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
    const nextXpGoal = 500; // Optional: Make this dynamic if you want per-level XP scaling

    // Update MongoDB
    await users.updateOne(
      { email },
      {
        $set: {
          level: nextLevel,
          xp,
        },
      }
    );

    // Update NFT metadata
    const contract = await sdk.getContract(contractAddress, 'nft');
    const metadata = await contract.metadata.get();

    const traitMap: any = {
      1: 'Bronze',
      2: 'Silver',
      3: 'Gold',
      4: 'Platinum',
      5: 'Mythic',
    };
    const newTrait = traitMap[nextLevel];

    await contract.erc721.setTokenMetadata(user.tokenId, {
      ...metadata,
      name: `NAO Health Passport - Level ${nextLevel}`,
      description: `Your evolving Health NFT. Current Trait: ${newTrait}`,
      image: `https://naoverse.io/level_${nextLevel}_${newTrait.toLowerCase()}.png`,
      attributes: [
        { trait_type: 'Level', value: nextLevel },
        { trait_type: 'Trait', value: newTrait },
        { trait_type: 'XP', value: xp },
      ],
    });

    // Respond with updated user
    const updatedUser = await users.findOne({ email });
    res.status(200).json({
      level: nextLevel,
      xp,
      walletId: wallet,
      email,
      evolutionLevel: nextLevel,
    });
  } catch (err) {
    console.error('Evolve Error:', err);
    res.status(500).json({ error: 'Failed to evolve NFT' });
  }
}
