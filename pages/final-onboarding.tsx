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
        if (!res.ok) throw new Error();
        const data = await res.json();
        setWearableConnected(Boolean(data?.whoopLinked || data?.appleHealthLinked));
      } catch {
        console.error("Could not check wearable status.");
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
      console.error("Error linking Apple Health.");
    } finally {
      setLoadingWearable(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-white">
      {/* Left: Background + Model */}
      <div
        className="relative w-full md:w-1/2 h-[50vh] md:h-screen bg-cover bg-center"
        style={{ backgroundImage: "url('/log_in_panel_3.png')" }}
      >
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
          <h1 className="text-6xl font-extrabold text-cyan-400 tracking-widest drop-shadow-lg">NAO</h1>
          <p className="mt-4 text-cyan-100 text-lg">Meet your NAO model</p>
          <p className="text-cyan-100 text-base">Your Health AI</p>
        </div>
      </div>

      {/* Right: Onboarding */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-10 py-14 relative">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-6 text-cyan-300">Welcome to NAO: Your Health Passport</h2>
          <p className="text-cyan-100 mb-8 leading-relaxed text-[15px]">
            NAO evolves with your health progress, syncing your wearables and rewarding healthy habits. As you thrive, your NFT levels up and unlocks real rewards. Connect your systems below to continue.
          </p>

          <div className="flex flex-col gap-4">
            <button
              className={`rounded-2xl py-4 font-semibold text-white ${
                wearableConnected ? "bg-green-500" : "bg-cyan-600"
              } transition`}
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
              className={`rounded-2xl py-4 font-semibold ${
                coinbaseLinked ? "bg-green-500" : "bg-gradient-to-r from-cyan-400 to-blue-600"
              } text-white transition`}
              onClick={() => setCoinbaseLinked(true)}
              disabled={coinbaseLinked}
            >
              {coinbaseLinked ? "✅ Coinbase Wallet Linked" : "💰 Link Coinbase Wallet"}
            </button>

            <button
              className={`rounded-2xl py-4 font-semibold ${
                applePaySynced ? "bg-green-500" : "bg-gradient-to-r from-cyan-400 to-blue-600"
              } text-white transition`}
              onClick={() => setApplePaySynced(true)}
              disabled={applePaySynced}
            >
              {applePaySynced ? "✅ Apple Pay Synced" : "💳 Sync Apple Pay for Stablecoin Usage"}
            </button>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-cyan-300 mb-2">NAO AI Companion</h3>
            <div className="rounded-xl border border-cyan-400 p-4">
              <EchoAssistant prompt="Begin your intelligence by typing here." />
            </div>
          </div>

          <button
            className={`w-full mt-10 py-4 rounded-xl font-bold text-lg transition ${
              allowContinue
                ? "bg-gradient-to-r from-cyan-400 to-green-400 text-black hover:scale-105"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
            disabled={!allowContinue}
            onClick={() => router.push("/mint")}
          >
            {allowContinue ? "🚀 Continue to Your Health Passport" : "Complete Setup to Continue"}
          </button>

          <p className="mt-3 text-center text-sm text-cyan-400">
            {allowContinue ? "✅ All systems go." : "⚠️ Finish setup to unlock your NFT."}
          </p>
        </div>
      </div>
    </div>
  );
}
