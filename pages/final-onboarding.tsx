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
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Pull user from localStorage and hydrate wallet context
  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("nao_user") : null;

    if (stored) {
      try {
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        if (parsedUser.wallet) setWallet(parsedUser.wallet);
      } catch (e) {
        console.error("Failed to parse nao_user from localStorage:", e);
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router, setWallet]);

  // Check wearable status once we have a user
  useEffect(() => {
    const checkWearable = async () => {
      if (!user?.email) return;

      setLoadingWearable(true);
      try {
        const res = await fetch(
          `/api/getUser?email=${encodeURIComponent(user.email)}`
        );
        if (!res.ok) throw new Error("Could not fetch user status");
        const data = await res.json();
        setWearableConnected(
          Boolean(data?.whoopLinked || data?.appleHealthLinked)
        );
        setError(null);
      } catch (e) {
        setError("Could not check wearable status.");
      } finally {
        setLoadingWearable(false);
      }
    };

    checkWearable();
  }, [user]);

  // Enable “Continue” only when all three syncs are complete
  useEffect(() => {
    setAllowContinue(wearableConnected && coinbaseLinked && applePaySynced);
  }, [wearableConnected, coinbaseLinked, applePaySynced]);

  // Handlers
  const handleWhoopConnect = () => {
    window.location.href = "/api/whoop-auth";
  };

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
      if (data.status === "linked") {
        setWearableConnected(true);
        setError(null);
      } else {
        setError(data.error || "Apple Health link failed.");
      }
    } catch (err) {
      console.error("Apple Health link error:", err);
      setError("Error linking Apple Health.");
    } finally {
      setLoadingWearable(false);
    }
  };

  const handleFinish = () => {
    router.push("/mint");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-row relative">
      {/* Video background */}
      <video
        className="fixed top-1/2 left-1/2 w-screen h-screen object-cover -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none"
        src="/sign_u_sign_in_vidd_1.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* LEFT: Sticky NAO model (hidden on mobile) */}
      <div className="hidden md:flex relative z-10 flex-shrink-0 w-[420px] flex-col items-center justify-center">
        <div className="sticky top-0 flex flex-col items-center w-full h-screen justify-center">
          <div className="w-[320px] h-[480px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl shadow-2xl flex items-center justify-center border border-gray-700">
            <span className="text-5xl font-bold text-cyan-400 tracking-tighter">
              NAO
            </span>
          <div className="mt-8 text-center text-lg text-gray-300 px-4">
            Meet your NAO model
            <br />
            Your Health AI
          </div>
        </div>
      </div>

   {/* RIGHT: Onboarding content */}
<div className="absolute top-24 right-16 w-[42%] z-10 text-cyan-200 text-[15px] leading-7 border border-cyan-500/40 rounded-2xl p-6 backdrop-blur-md bg-black/40 shadow-2xl max-h-[75vh] overflow-y-auto space-y-4">
  <h1 className="text-4xl font-extrabold mb-4 text-cyan-300 drop-shadow-lg">
    Welcome to NAO: Your Health Intelligence Passport
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

{/* Sync Buttons */}
<div className="space-y-5 w-full mt-8">
  <h2 className="text-xl font-bold text-cyan-300 tracking-wide mb-4">
    🔗 Sync Your Systems
  </h2>

  {/* Apple Health */}
  <button
    className={`relative px-6 py-4 rounded-2xl w-full text-lg font-medium tracking-wide text-white
      transition-all duration-200 border border-cyan-400/30 shadow-lg backdrop-blur
      ${
        wearableConnected
          ? "bg-green-600/70 hover:bg-green-700"
          : "bg-black/30 hover:bg-cyan-500/20 animate-pulse"
      } active:scale-95`}
    onClick={handleAppleHealthLink}
    disabled={loadingWearable || wearableConnected}
  >
    {loadingWearable
      ? "🔄 Checking Apple Health..."
      : wearableConnected
      ? "✅ Apple Health Linked"
      : "📲 Link Apple Health"}
  </button>

  {/* Coinbase Wallet */}
  <button
    className={`relative px-6 py-4 rounded-2xl w-full text-lg font-medium tracking-wide text-white
      transition-all duration-200 border border-cyan-400/30 shadow-lg backdrop-blur
      ${
        coinbaseLinked
          ? "bg-green-600/70 hover:bg-green-700"
          : "bg-black/30 hover:bg-cyan-500/20 animate-pulse"
      } active:scale-95`}
    onClick={() => setCoinbaseLinked(true)}
    disabled={coinbaseLinked}
  >
    {coinbaseLinked ? "✅ Coinbase Wallet Linked" : "💰 Link Coinbase Wallet"}
  </button>

  {/* Apple Pay */}
  <button
    className={`relative px-6 py-4 rounded-2xl w-full text-lg font-medium tracking-wide text-white
      transition-all duration-200 border border-cyan-400/30 shadow-lg backdrop-blur
      ${
        applePaySynced
          ? "bg-green-600/70 hover:bg-green-700"
          : "bg-black/30 hover:bg-cyan-500/20 animate-pulse"
      } active:scale-95`}
    onClick={() => setApplePaySynced(true)}
    disabled={applePaySynced}
  >
    {applePaySynced
      ? "✅ Apple Pay Synced"
      : "💳 Sync Apple Pay for Stablecoin Usage"}
  </button>
</div>

{/* Error notice */}
{error && (
  <div className="text-red-400 font-semibold mt-2 animate-pulse text-center">
    {error}
  </div>
)}



        {/* AI Companion */}
        <div className="w-full max-w-3xl mt-8">
          <h2 className="text-xl mb-2 text-cyan-400 font-semibold">
            NAO AI Companion
          </h2>
          <div className="border border-gray-600 rounded-2xl p-4">
            <EchoAssistant prompt="Begin your intelligence by typing here." />
          </div>
        </div>

        {/* Progress helper text */}
        {allowContinue ? (
          <p className="text-green-400 mt-4">
            ✅ All systems go — you’re ready to mint your Health dNFT.
          </p>
        ) : (
          <p className="text-yellow-300 mt-4">
            ⚠️ Please complete every connection above to continue.
          </p>
        )}

        {/* Continue button */}
        <button
className="mt-4 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-2xl text-white font-semibold disabled:opacity-40 transition"
          disabled={!allowContinue}
          onClick={handleFinish}
        >
          Continue to Health Passport
        </button>
      </div>
    </div>
  );
}
