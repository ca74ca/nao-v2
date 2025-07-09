// backend/routes/redeem.js — with treasury balance & gas checks
require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");
const router  = express.Router();
const db      = require("../db");                    // fixed path (one level up)

// ────────────────────────────────────────────────────────────────
//  ENV
// ────────────────────────────────────────────────────────────────
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY;
const USDC_CONTRACT        = process.env.USDC_CONTRACT_ADDRESS;
const CHAIN_RPC_URL        = process.env.CHAIN_RPC_URL;

if (!TREASURY_PRIVATE_KEY || !USDC_CONTRACT || !CHAIN_RPC_URL) {
  throw new Error("Redeem route env vars missing");
}

// ────────────────────────────────────────────────────────────────
//  Signer & token contract
// ────────────────────────────────────────────────────────────────
const provider = new ethers.JsonRpcProvider(CHAIN_RPC_URL);
const signer   = new ethers.Wallet(TREASURY_PRIVATE_KEY, provider);

const ERC20_ABI = ["function transfer(address to,uint256 amount) public returns(bool)",
                   "function balanceOf(address) view returns (uint256)"]; // add balanceOf for treasury check
const usdc      = new ethers.Contract(USDC_CONTRACT, ERC20_ABI, signer);

// ────────────────────────────────────────────────────────────────
//  POST /api/redeem  { walletId, amount }  — amount in POINTS
// ────────────────────────────────────────────────────────────────
router.post("/redeem", async (req, res) => {
  let { walletId, amount } = req.body;                // amount → points (100 pts = 1 USDC)
  if (typeof walletId !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(walletId)) {
    return res.status(400).json({ success:false, message:"Invalid wallet" });
  }
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ success:false, message:"Invalid amount (points)" });
  }
  amount = Number(amount);

  try {
    // 1️⃣ Verify user points
    const mongo = await db.connect();
    const user  = await mongo.collection("users").findOne({ walletId: new RegExp(`^${walletId}$`, "i") });
    if (!user || (user.rewardPoints || 0) < amount) {
      return res.status(403).json({ success:false, message:"Not enough points" });
    }

    // 2️⃣ Convert points → USDC (6‑decimals) & treasury balance check
    const usdcFloat = amount / 100;                                 // 100 pts = 1 USDC
    const usdcUnits = ethers.parseUnits(usdcFloat.toString(), 6);

    const treasuryBal = await usdc.balanceOf(signer.address);
    if (treasuryBal < usdcUnits) {
      return res.status(400).json({ success:false, message:"Treasury out of USDC" });
    }

    // Gas check
    const gasLimit   = await usdc.transfer.estimateGas(walletId, usdcUnits);
    const gasPrice   = await provider.getGasPrice();
    const gasNeeded  = gasLimit * gasPrice;
    const treasuryMatic = await provider.getBalance(signer.address);
    if (treasuryMatic < gasNeeded) {
      return res.status(400).json({ success:false, message:"Treasury out of MATIC for gas" });
    }

    // 3️⃣ Send USDC
    const tx = await usdc.transfer(walletId, usdcUnits);
    await tx.wait();

    // 4️⃣ Deduct points & log
    await mongo.collection("users").updateOne(
      { walletId: new RegExp(`^${walletId}$`, "i") },
      { $inc: { rewardPoints: -amount }, $push: { rewardLedger: { txHash: tx.hash, amount: usdcFloat, date: new Date() } } }
    );

    return res.json({ success:true, sent:`${usdcFloat} USDC`, txHash: tx.hash });
  } catch (err) {
    console.error("/redeem error:", err);
    return res.status(500).json({ success:false, message:"Server error" });
  }
});

module.exports = router;
