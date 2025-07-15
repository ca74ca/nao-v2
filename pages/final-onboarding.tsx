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
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* ✅ Background - fixed, no stretch */}
      <div className="absolute inset-0 bg-black">
        <div
          className="absolute inset-0 bg-center bg-no-repeat bg-contain"
          style={{ backgroundImage: "url('/log_in_panel_3.png')" }}
        />
      </div>

      {/* ✅ Foreground Content */}
      <div className="relative z-10 w-full h-full flex flex-col justify-center items-center p-8">
        {/* AI Assistant Box */}
        <div className="w-full max-w-3xl mb-12">
          <h2 className="text-xl text-cyan-400 font-semibold mb-2">NAO AI Companion</h2>
          <div className="border border-cyan-400/50 rounded-2xl p-4 backdrop-blur-md bg-black/50 shadow-lg">
            <EchoAssistant prompt="Begin your intelligence by typing here." />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center mt-4">
          <button
            className={`px-8 py-4 rounded-full text-lg font-semibold tracking-wide text-white transition-all duration-200 ease-out shadow-lg
              ${wearableConnected ? "bg-green-600 hover:bg-green-700" : "bg-cyan-700/40 hover:bg-cyan-700 animate-pulse"}`}
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
            className="px-8 py-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold shadow-lg hover:scale-105 transition"
            onClick={() => setCoinbaseLinked(true)}
            disabled={coinbaseLinked}
          >
            {coinbaseLinked ? "✅ Coinbase Wallet Linked" : "💰 Link Coinbase Wallet"}
          </button>

          <button
            className="px-8 py-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold shadow-lg hover:scale-105 transition"
            onClick={() => setApplePaySynced(true)}
            disabled={applePaySynced}
          >
            {applePaySynced ? "✅ Apple Pay Synced" : "💳 Sync Apple Pay for Stablecoin Usage"}
          </button>
        </div>

        {/* Final Mint Button */}
        {allowContinue && (
          <div className="absolute bottom-8 left-8">
            <button
              className="px-10 py-4 rounded-full text-lg font-bold bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg hover:scale-105 transition"
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
