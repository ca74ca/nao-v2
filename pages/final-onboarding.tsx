import React from "react";
import { useRouter } from "next/router";

export default function FinalOnboarding() {
  const router = useRouter();

  const handleContinue = () => router.push("/mint");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white text-center px-8 space-y-8">
      <h1 className="text-5xl font-bold text-cyan-400 drop-shadow-[0_0_20px_rgba(0,255,255,0.8)]">
        Welcome to NAO: Your Fitness, Rewarded!
      </h1>

      <div className="max-w-3xl text-gray-300 space-y-6 text-lg leading-relaxed">
        <p>Congratulations! You're officially onboarded with NAO, where your dedication to any form of fitness translates directly into tangible cash rewards. We believe your hard work deserves more than just personal bests—it deserves real financial incentives. And the best part? We don't believe in streaks or complicated algorithms; we believe in consistent effort. So even if life gets in the way and you miss a day, your progress and rewards are safe with us.</p>

        <h2 className="text-cyan-400 font-semibold text-xl">Track Your Progress</h2>
        <p>NAO is your all-in-one smart AI assistant, providing workouts, logging your sessions, and saving all your key fitness data. This means you don't even need wearables to track your activity. We'll automatically monitor your progress, whether it's walking, yoga, running, cross-training, or any other exercise, ensuring every bit of effort counts toward your earnings.</p>

        <h2 className="text-cyan-400 font-semibold text-xl">Earn Rewards</h2>
        <p>As you hit your training milestones, complete workouts, and achieve new personal records, NAO will reward you with real cash. Our transparent system ensures you know exactly how much you're earning for your efforts.</p>

        <h2 className="text-cyan-400 font-semibold text-xl">Redeem Your Earnings</h2>
        <p>Cashing out your rewards is simple and flexible. Choose your preferred method:</p>
        <ul className="list-disc list-inside text-left space-y-2">
          <li>Apple Pay: For quick and easy access to your funds on the go.</li>
          <li>Mastercard: Transfer your earnings directly to your Mastercard for everyday spending.</li>
          <li>Coinbase or Other Crypto: For those who prefer to manage their rewards in digital currencies.</li>
        </ul>

        <h2 className="text-cyan-400 font-semibold text-xl">No Gimmicks—Just Results</h2>
        <p>At NAO, we're committed to a straightforward and rewarding experience. There are no hidden fees, complicated algorithms, or deceptive schemes. We're here to empower your fitness journey by providing genuine, measurable incentives for your commitment and progress.</p>

        <p>Ready to turn your sweat into rewards?</p>
      </div>

      <button
        onClick={handleContinue}
        className="mt-8 px-12 py-5 rounded-full text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-[0_0_40px_rgba(0,255,255,0.7)] hover:scale-105 hover:shadow-[0_0_80px_rgba(0,255,255,1)] transition"
      >
        🚀 Go to My Rewards Dashboard
      </button>
    </div>
  );
}
