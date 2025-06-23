import type { NextApiRequest, NextApiResponse } from "next";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { Wallet } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";

// Ensure required environment variables exist
if (!process.env.SIGNER_PK || !process.env.NETWORK || !process.env.NFT_CONTRACT_ADDRESS) {
  throw new Error("Missing required environment variables");
}

// Set up provider and signer
const provider = new JsonRpcProvider(process.env.NETWORK);
const signer = new Wallet(process.env.SIGNER_PK, provider);

// Initialize Thirdweb SDK
const sdk = ThirdwebSDK.fromSigner(signer, process.env.CHAIN || "ethereum");

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
    const contractAddress = process.env.NFT_CONTRACT_ADDRESS;
    if (!contractAddress) throw new Error("NFT_CONTRACT_ADDRESS is undefined");

    const contract = await sdk.getContract(contractAddress, "signature-drop");

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

