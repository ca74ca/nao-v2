import { useRouter } from "next/router";
import EchoAssistant from "@/components/EchoAssistant";

export default function FinalOnboarding() {
  const router = useRouter();

  const handleContinue = () => router.push("/mint");

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-black text-white space-y-10 px-8">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-3xl md:text-4xl font-bold text-cyan-400">Welcome to NAO</h1>
        <p className="text-lg text-gray-300 leading-relaxed">
          <strong>NAO is your AI-powered health companion that pays you to thrive.</strong>  
          <br /><br />
          No devices required. No gimmicks. Just smarter habits and real rewards for taking control of your well-being.
        </p>

        <div className="text-left space-y-4">
          <h2 className="text-xl font-semibold text-cyan-400">How NAO Works:</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li><strong>AI-Driven Health Tracking:</strong> NAO learns from your habits, workouts, and recovery — no wearables required.</li>
            <li><strong>Earn Real Money:</strong> $NAO stablecoin (USD-pegged) rewards your consistency.</li>
            <li><strong>Spend Anywhere:</strong> Apple Pay, Mastercard, Coinbase, crypto, or fiat. Your rewards, your choice.</li>
          </ul>

          <h2 className="text-xl font-semibold text-cyan-400 pt-4">Example Rewards:</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>✅ $0.50 for hitting your weekly sleep goals</li>
            <li>✅ $3 for completing your training streak</li>
            <li>✅ Bigger rewards for consistency & milestones</li>
          </ul>
        </div>

        <p className="text-lg text-gray-300 pt-4">
          <strong>Train. Earn. Redeem. Repeat.</strong>  
          <br />No waiting. No complicated apps. Just real money for real progress.
        </p>
      </div>

      <div className="w-full max-w-3xl">
        <h2 className="text-center text-xl font-semibold text-cyan-400 mb-4">NAO AI Companion</h2>
        <div className="border border-cyan-400/50 rounded-2xl p-4 bg-black/60 shadow-lg">
          <EchoAssistant prompt="Begin your intelligence by typing here." />
        </div>
      </div>

      <button
        onClick={handleContinue}
        className="w-[300px] px-10 py-5 rounded-full text-xl font-bold bg-gradient-to-r from-green-400 to-green-600 text-white shadow-[0_0_30px_rgba(0,255,0,0.8)] hover:shadow-[0_0_40px_rgba(0,255,0,1)] transition-all"
      >
        🚀 Go to My Rewards Dashboard
      </button>
    </div>
  );
}
