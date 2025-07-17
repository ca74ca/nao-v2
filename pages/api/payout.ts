import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { toWallet, amount } = req.body;

  if (!toWallet || !amount) {
    return res.status(400).json({ error: "Missing params" });
  }

  const sdk = ThirdwebSDK.fromPrivateKey(process.env.PRIVATE_KEY as string, "polygon");

  // Replace with your real USDC contract address on Polygon
  const usdc = await sdk.getToken("YOUR_USDC_CONTRACT_ADDRESS");

  try {
    const tx = await usdc.transfer(toWallet, amount);
    return res.status(200).json({ success: true, tx });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Payout failed", details: err });
  }
}
