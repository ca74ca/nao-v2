import { useRouter } from "next/router";
import EchoAssistant from "@/components/EchoAssistant";

export default function FinalOnboarding() {
  const router = useRouter();

  const handleContinue = () => router.push("/mint");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-black text-white font-roboto px-8 space-y-12">
      
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-5xl font-bold text-cyan-400 drop-shadow-[0_0_20px_rgba(0,255,255,0.8)]">
          Welcome to NAO
        </h1>

        <p className="text-lg leading-relaxed text-gray-300 drop-shadow-[0_0_10px_rgba(0,255,255,0.3)]">
          NAO is your AI-powered health companion that pays you to thrive. Smarter habits, real money.
        </p>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]">How NAO Works:</h2>
          <ul className="list-none space-y-3 text-lg text-gray-300 drop-shadow-[0_0_10px_rgba(0,255,255,0.3)]">
            <li><span className="font-bold text-white">AI-Driven Health Tracking:</span> NAO learns from your habits, workouts, and recovery — no wearables required.</li>
            <li><span className="font-bold text-white">Earn Real Money:</span> $NAO stablecoin (USD-pegged) rewards your consistency.</li>
            <li><span className="font-bold text-white">Spend Anywhere:</span> Apple Pay, Mastercard, Coinbase, crypto, fiat. Your rewards, your choice.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.8)] pt-4">Example Rewards:</h2>
          <ul className="list-none space-y-3 text-lg text-gray-300 drop-shadow-[0_0_10px_rgba(0,255,255,0.3)]">
            <li>✅ $0.50 for hitting weekly sleep goals</li>
            <li>✅ $3 for completing training streaks</li>
            <li>✅ Bigger rewards for consistency & milestones</li>
          </ul>
        </div>

        <p className="text-lg text-gray-300 pt-4 drop-shadow-[0_0_10px_rgba(0,255,255,0.3)]">
          <span className="font-bold text-white">Train. Earn. Redeem. Repeat.</span><br />
          No waiting. No complicated apps. Just real money for real progress.
        </p>
      </div>

      <div className="w-full max-w-3xl">
        <h2 className="text-center text-2xl font-semibold text-cyan-400 mb-4 drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]">
          NAO AI Companion
        </h2>
        <div className="border border-cyan-400/50 rounded-2xl p-4 bg-black/60 shadow-lg">
          <EchoAssistant prompt="Begin your intelligence by typing here." />
        </div>
      </div>

      <button
        onClick={handleContinue}
        className="mt-8 w-[320px] px-10 py-5 rounded-3xl text-xl font-bold tracking-wide text-cyan-400 bg-black border border-cyan-400 shadow-[0_0_40px_rgba(0,255,255,0.6)] hover:shadow-[0_0_80px_rgba(0,255,255,1)] hover:border-cyan-300 transition-all duration-300"
      >
        🚀 Enter NAO Rewards Dashboard
      </button>
    </div>
  );
}
