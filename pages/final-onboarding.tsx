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
    <div className="relative w-full h-screen bg-black text-white">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/log_in_panel_3.png')" }}
      />
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-8 px-6">
        <div className="w-full max-w-3xl">
          <h2 className="text-xl text-cyan-400 font-semibold mb-4">NAO AI Companion</h2>
          <div className="border border-cyan-400/50 rounded-2xl p-4 bg-black/60 shadow-lg">
            <EchoAssistant prompt="Begin your intelligence by typing here." />
          </div>
        </div>

        <div className="flex flex-col items-center space-y-6">
          <button
            className="w-[300px] px-8 py-5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-lg font-semibold shadow-[0_0_30px_rgba(0,255,255,0.8)] hover:shadow-[0_0_40px_rgba(0,255,255,1)] transition-all"
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
            className="w-[300px] px-8 py-5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-lg font-semibold shadow-[0_0_30px_rgba(0,255,255,0.8)] hover:shadow-[0_0_40px_rgba(0,255,255,1)] transition-all"
            onClick={() => setCoinbaseLinked(true)}
            disabled={coinbaseLinked}
          >
            {coinbaseLinked ? "✅ Coinbase Wallet Linked" : "💰 Link Coinbase Wallet"}
          </button>

          <button
            className="w-[300px] px-8 py-5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-lg font-semibold shadow-[0_0_30px_rgba(0,255,255,0.8)] hover:shadow-[0_0_40px_rgba(0,255,255,1)] transition-all"
            onClick={() => setApplePaySynced(true)}
            disabled={applePaySynced}
          >
            {applePaySynced ? "✅ Apple Pay Synced" : "💳 Sync Apple Pay"}
          </button>
        </div>

        {allowContinue && (
          <button
            className="mt-10 w-[300px] px-10 py-5 rounded-full text-xl font-bold bg-gradient-to-r from-green-400 to-green-600 text-white shadow-[0_0_30px_rgba(0,255,0,0.8)] hover:shadow-[0_0_40px_rgba(0,255,0,1)] transition-all"
            onClick={handleFinish}
          >
            🚀 Mint My Health Passport
          </button>
        )}
      </div>
    </div>
  );
}
