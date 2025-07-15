// ... [your existing imports stay the same]
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
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("nao_user") : null;
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
    <div className="min-h-screen bg-black text-white flex flex-row relative"
      style={{
        backgroundImage: "url('/log_in_panel_3.png')",
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="hidden md:flex relative z-10 flex-shrink-0 w-[420px] flex-col items-center justify-center">
        <div className="sticky top-0 flex flex-col items-center w-full h-screen justify-center">
          <div className="w-[320px] h-[480px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl shadow-2xl flex items-center justify-center border border-gray-700">
            <span className="text-5xl font-bold text-cyan-400 tracking-tighter">NAO</span>
            <div className="mt-8 text-center text-lg text-gray-300 px-4">
              Meet your NAO model <br /> Your Health AI
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Finish Button Bottom Left */}
      <div className="absolute bottom-8 left-8 z-20">
        <button
          className={`px-10 py-4 rounded-full text-lg font-bold ${
            allowContinue
              ? "bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg hover:scale-105 transition"
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          }`}
          onClick={handleFinish}
          disabled={!allowContinue}
        >
          {allowContinue ? "🚀 Mint My Health Passport" : "⚠️ Finish setup to continue"}
        </button>
      </div>

      <div className="absolute top-24 right-12 w-[45%] z-10 text-cyan-200 text-[15px] leading-7 border border-cyan-500/40 rounded-2xl p-6 backdrop-blur-md bg-black/40 shadow-2xl max-h-[65vh] overflow-y-auto space-y-4">
  <h1 className="text-4xl font-extrabold mb-4 text-cyan-300 drop-shadow-lg">
    Welcome to NAO: Your Health AI
  </h1>

        <p className="whitespace-pre-line">
          Welcome to NAO, the worlds first Health Intelligence Passport that pays you to thrive. NAO is your personal AI health companion, designed to adapt and learn with you, providing hyper-personalized
          guidance for your unique well-being journey and rewarding your efforts with real cash. Our advanced AI constantly analyzes your sleep, activity levels, and biomarkers (via Whoop/Apple Health),
          delivering actionable insights. Whether it's suggesting optimal workout intensity, recommending recovery protocols like "Your workout recovery is 92%—ideal day for strength training," or nudging you 
          with "Your stress levels spiked today—try 5 mins of breathwork now," NAO evolves with your progress. This dynamic learning ensures your fitness journey is always challenging, achievable, and truly yours.

          Hit your health goals, and you'll earn $NAO – a USD-pegged stablecoin that's truly usable anywhere, just like cash! Spend your rewards instantly via Apple Pay or Mastercard at your favorite gym, grocery store, 
          or even for that post-workout smoothie. As your health improves, so do your earning opportunities, with higher rewards for consistent progress and milestones.

          Say goodbye to generic plans and embrace truly personalized wellness with rewards that grow with you. Your comprehensive health data becomes a secure, living NFT you own on the blockchain, 
          empowering you with unparalleled control and privacy. This means seamless doctor visits by sharing a simple QR code, and robust security for all your health information. 

          The $NAO stablecoin itself is designed for future-proof value: built on a robust blockchain framework, its stability and utility are continually enhanced through
          community governance and potential algorithmic improvements, ensuring it remains a reliable, spendable asset as the Web3 ecosystem evolves. 

          Ready to unlock a new era of proactive well-being where your fitness journey is uniquely yours, financially rewarding, and constantly improving? Just sync Apple Health or Whoop in 60 seconds, set your first AI-driven goal, and link your card. Your first $1 reward is waiting – tap below to begin your healthier, wealthier journey.
        </p>
      </div>

<div className="flex flex-col items-start gap-6 mt-16 ml-10">
        <button
          className={`min-w-[280px] px-8 py-5 rounded-3xl text-lg font-semibold tracking-wide text-white
            backdrop-blur-md bg-white/5 border border-cyan-300/30 shadow-[0_2px_25px_0_rgba(0,255,255,0.25)]
            transition-all duration-200 ease-out ring-1 ring-inset ring-white/10
            hover:ring-cyan-400/50 hover:shadow-[0_4px_35px_0_rgba(0,255,255,0.45)]
            active:scale-95 active:shadow-[0_0_20px_0_rgba(0,255,255,0.6)]
            ${wearableConnected ? "text-white" : "text-cyan-100 animate-pulse"}`}
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
          style={{
            minWidth: "280px",
            padding: "14px 26px",
            borderRadius: "9999px",
            background: "linear-gradient(90deg, #00ffc8, #2D9CFF)",
            color: "white",
            fontWeight: 600,
            boxShadow: "0 0 12px #00ffc8, 0 0 4px #2D9CFF",
            border: "none",
            transition: "0.3s",
            cursor: "pointer",
            fontSize: "18px",
            letterSpacing: "0.025em"
          }}
          onClick={() => setCoinbaseLinked(true)}
          disabled={coinbaseLinked}
        >
          {coinbaseLinked ? "✅ Coinbase Wallet Linked" : "💰 Link Coinbase Wallet"}
        </button>

        <button
          style={{
            minWidth: "280px",
            padding: "14px 26px",
            borderRadius: "9999px",
            background: "linear-gradient(90deg, #00ffc8, #2D9CFF)",
            color: "white",
            fontWeight: 600,
            boxShadow: "0 0 12px #00ffc8, 0 0 4px #2D9CFF",
            border: "none",
            transition: "0.3s",
            cursor: "pointer",
            fontSize: "18px",
            letterSpacing: "0.025em"
          }}
          onClick={() => setApplePaySynced(true)}
          disabled={applePaySynced}
        >
          {applePaySynced ? "✅ Apple Pay Synced" : "💳 Sync Apple Pay for Stablecoin Usage"}
        </button>
      </div>

      <div className="w-full max-w-3xl mt-8 mx-auto">
        <h2 className="text-xl mb-2 text-cyan-400 font-semibold">NAO AI Companion</h2>
        <div className="border border-gray-600 rounded-2xl p-4">
          <EchoAssistant prompt="Begin your intelligence by typing here." />
        </div>
      </div>
    </div>
  );
}
