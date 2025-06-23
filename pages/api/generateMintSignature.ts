import type { NextApiRequest, NextApiResponse } from "next";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { Wallet } from "ethers";

// Check env vars
if (!process.env.SIGNER_PK || !process.env.NETWORK || !process.env.NFT_CONTRACT_ADDRESS) {
  throw new Error("Missing required environment variables");
}

const signer = new Wallet(process.env.SIGNER_PK);
const sdk = ThirdwebSDK.fromWallet(signer, process.env.NETWORK);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const { userAddress, metadata } = req.body;

  if (!userAddress || !metadata) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const contract = await sdk.getContract(
      process.env.NFT_CONTRACT_ADDRESS,
      "signature-drop"
    );

    const payload = {
      to: userAddress,
      metadata,
    };

    const signedPayload = await contract.signature.generate(payload);

    return res.status(200).json({ signedPayload });
  } catch (error) {
    console.error("Error generating mint signature:", error);
    return res.status(500).json({ error: "Failed to generate signature" });
  }
}
