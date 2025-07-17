import React from "react";
import { useConnect, metamaskWallet, coinbaseWallet, useAddress } from "@thirdweb-dev/react";
import { useRouter } from "next/router";

export default function FinalOnboarding() {
  const connect = useConnect();
  const address = useAddress();
  const router = useRouter();

  // Declare handleContinue BEFORE return
  const handleContinue = () => {
    if (address) {
      router.push("/mint");
    } else {
      alert("Please connect your wallet to continue.");
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white text-center px-8 space-y-8 flex flex-col items-center justify-center">
      {/* Background Logo */}
      <img
        src="/nao_circle_logo_fo.png"
        alt="NAO Logo Background"
        className="fixed inset-0 w-full h-full object-contain opacity-10 pointer-events-none select-none"
        style={{ zIndex: 0 }}
      />

      <h1 className="relative text-5xl font-bold text-cyan-400 drop-shadow-[0_0_20px_rgba(0,255,255,0.8)] z-10">
        Welcome to NAO: Your Fitness, Rewarded!
      </h1>

      <div className="relative max-w-3xl text-gray-300 space-y-6 text-lg leading-relaxed z-10">
        <p>
          Congratulations! You're officially onboarded with NAO, where your dedication to any form of fitness translates directly into tangible cash rewards. We believe your hard work deserves more than just personal bests—it deserves real financial incentives. And the best part? We don't believe in streaks or complicated algorithms; we believe in consistent effort. So even if life gets in the way and you miss a day, your progress and rewards are safe with us.
        </p>

        <h2 className="text-cyan-400 font-semibold text-xl">Track Your Progress</h2>
        <p>
          NAO is your all-in-one smart AI assistant, providing workouts, logging your sessions, and saving all your key fitness data. This means you don't even need wearables to track your activity. We'll automatically monitor your progress, whether it's walking, yoga, running, cross-training, or any other exercise, ensuring every bit of effort counts toward your earnings.
        </p>

        <h2 className="text-cyan-400 font-semibold text-xl">Earn Rewards</h2>
        <p>
          As you hit your training milestones, complete workouts, and achieve new personal records, NAO will reward you with real cash. Our transparent system ensures you know exactly how much you're earning for your efforts.
        </p>

        <h2 className="text-cyan-400 font-semibold text-xl">Redeem Your Earnings</h2>
        <p>Cashing out your rewards is simple and flexible. Choose your preferred method:</p>
        <ul className="list-disc list-inside text-left space-y-2">
          <li>Apple Pay: For quick and easy access to your funds on the go.</li>
          <li>Mastercard: Transfer your earnings directly to your Mastercard for everyday spending.</li>
          <li>Coinbase or Other Crypto: For those who prefer to manage their rewards in digital currencies.</li>
        </ul>

        <h2 className="text-cyan-400 font-semibold text-xl">No Gimmicks—Just Results</h2>
        <p>
          NAO is all about straightforward and rewarding experiences. We've stripped away the hidden fees, complicated algorithms, and deceptive schemes. Our commitment is simple: to empower your fitness journey by providing genuine, measurable incentives for your dedication and progress. Experience fitness rewards, simplified and transparent, where your effort always translates into real value.
        </p>

        <p>Ready to turn your sweat into rewards?</p>
      </div>

      {!address && (
        <div style={{ marginTop: "32px", marginBottom: "20px", width: "100%", maxWidth: 400 }} className="relative z-10">
          <button
            onClick={() => connect(metamaskWallet())}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 999,
              background: "linear-gradient(to right, #00c6ff, #0072ff)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 16,
              border: "none",
              boxShadow: "0 0 15px rgba(0, 198, 255, 0.6)",
              cursor: "pointer",
              marginBottom: "12px",
              transition: "all 0.2s",
            }}
          >
            Connect MetaMask
          </button>
          <button
            onClick={() => connect(coinbaseWallet())}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 999,
              background: "linear-gradient(to right, #f5d300, #ff9900)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 16,
              border: "none",
              boxShadow: "0 0 15px rgba(245, 211, 0, 0.6)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Connect Coinbase Wallet
          </button>
        </div>
      )}

      {address && (
        <div
          style={{ marginTop: "16px", color: "#0ff", fontSize: "0.85rem" }}
          className="relative z-10"
        >
          <p>Connected Wallet for Rewards:</p>
          <p style={{ fontFamily: "monospace", color: "#fff" }}>{address}</p>
        </div>
      )}

      <button
  onClick={handleContinue}
  className="mt-8 w-48 py-3 rounded-xl font-semibold text-white relative z-10 bg-cyan-400 hover:bg-cyan-500 cursor-pointer"
>
  SYNC LIVE REWARD DASHBOARD HERE
</button>

    </div>
  );
}
