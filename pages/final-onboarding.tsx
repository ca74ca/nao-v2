import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import EchoAssistant from "@/components/EchoAssistant";
import { useWallet } from "../context/WalletContext";

export default function FinalOnboarding() {
  const router = useRouter();
  const { setWallet } = useWallet();

  const [wearableConnected, setWearableConnected] = useState(false);
  const [coinbaseLinked, setCoinbaseLinked] = useState(false);
  const [applePaySynced, setApplePaySynced] = useState(false);
  const [allowContinue, setAllowContinue] = useState(false);
  const [loadingWearable, setLoadingWearable] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("nao_user") : null;
    if (stored) {
      try {
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        if (parsedUser.wallet) setWallet(parsedUser.wallet);
      } catch {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router, setWallet]);

  useEffect(() => {
    const checkWearable = async () => {
      if (!user?.email) return;
      setLoadingWearable(true);
      try {
        const res = await fetch(`/api/getUser?email=${encodeURIComponent(user.email)}`);
        const data = await res.json();
        setWearableConnected(Boolean(data?.whoopLinked || data?.appleHealthLinked));
      } catch {
        console.error("Wearable check failed");
      } finally {
        setLoadingWearable(false);
      }
    };
    checkWearable();
  }, [user]);

  useEffect(() => {
    setAllowContinue(wearableConnected && coinbaseLinked && applePaySynced);
  }, [wearableConnected, coinbaseLinked, applePaySynced]);

  const handleAppleHealthLink = async () => {
    if (!user?.email) return;
    setLoadingWearable(true);
    try {
      const res = await fetch("https://nao-health-sync.onrender.com/api/link-apple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (data.status === "linked") setWearableConnected(true);
    } catch {
      console.error("Apple Health link failed");
    } finally {
      setLoadingWearable(false);
    }
  };

  const handleFinish = () => router.push("/mint");

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-row overflow-hidden">
      <div className="hidden md:flex flex-col justify-center w-[420px] bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700 px-6">
        <h2 className="text-3xl font-bold text-cyan-400 mb-6">Welcome to NAO</h2>
        <p className="text-sm leading-relaxed text-gray-300 space-y-4">
          Welcome to NAO, the Health Intelligence Passport that pays you to live healthier!
          <br /><br />
          NAO is truly YOUR personal AI health assistant, designed to understand your unique body and goals. It's constantly learning from your progress, adapting to your needs, and providing hyper-personalized guidance for every step of your well-being journey.
          <br /><br />
          NAO doesn't just track your activity; it handles all your workouts, ensuring optimal intensity and progress. More importantly, it masterfully guides your recovery, delivering insights like "Your workout recovery is 92%—ideal day for strength training," or "Your stress levels spiked today—try 5 mins of breathwork now."
          <br /><br />
          As you hit your health goals, you'll earn $NAO – a USD-pegged stablecoin that’s incredibly versatile. Spend your rewards instantly via Apple Pay or Mastercard at your favorite local spots, or unlock global possibilities by redeeming $NAO with vendors worldwide through crypto and other exciting reward options.
          <br /><br />
          Say goodbye to generic plans and embrace personalized wellness with rewards that grow with you, opening up a world of possibilities.
        </p>
      </div>

      <div
        className="absolute inset-0 md:left-[420px] bg-no-repeat bg-cover bg-center"
        style={{ backgroundImage: "url('/log_in_panel_3.png')" }}
      />

      <div className="relative z-10 flex flex-col justify-center items-center h-screen w-full p-8">
        <div className="w-full max-w-3xl mb-12">
          <h2 className="text-xl text-cyan-400 font-semibold mb-2">NAO AI Companion</h2>
          <div className="border border-cyan-400/50 rounded-2xl p-4 backdrop-blur-md bg-black/50 shadow-lg">
            <EchoAssistant prompt="Begin your intelligence by typing here." />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-center">
          <button
            className={`min-w-[280px] px-8 py-5 rounded-full text-lg font-semibold tracking-wide text-white
              bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_20px_rgba(0,255,255,0.5)] transition transform hover:scale-105`}
            onClick={handleAppleHealthLink}
            disabled={loadingWearable || wearableConnected}
          >
            {loadingWearable
              ? "🔄 Checking Apple Health..."
              : wearableConnected
              ? "✅ Apple Health Linked"
              : "📲 Link Apple Health"}
          </button>

          <button
            className="min-w-[280px] px-8 py-5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold shadow-[0_0_20px_rgba(0,255,255,0.5)] transition transform hover:scale-105"
            onClick={() => setCoinbaseLinked(true)}
            disabled={coinbaseLinked}
          >
            {coinbaseLinked ? "✅ Coinbase Wallet Linked" : "💰 Link Coinbase Wallet"}
          </button>

          <button
            className="min-w-[280px] px-8 py-5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold shadow-[0_0_20px_rgba(0,255,255,0.5)] transition transform hover:scale-105"
            onClick={() => setApplePaySynced(true)}
            disabled={applePaySynced}
          >
            {applePaySynced ? "✅ Apple Pay Synced" : "💳 Sync Apple Pay for Stablecoin Usage"}
          </button>
        </div>

        {allowContinue && (
          <div className="absolute bottom-8 left-8">
            <button
              className="px-10 py-4 rounded-full text-lg font-bold bg-gradient-to-r from-green-400 to-green-600 text-white shadow-[0_0_20px_rgba(0,255,0,0.5)] hover:scale-105 transition"
              onClick={handleFinish}
            >
              🚀 Mint My Health Passport
            </button>
          </div>
        )}
      </div>
    </div>
  );
}