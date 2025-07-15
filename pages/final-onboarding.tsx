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
        backgroundSize: "cover",
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
          className="px-10 py-4 rounded-full text-lg font-bold bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg hover:scale-105 transition"
          onClick={handleFinish}
        >
          🚀 Mint My Health Passport
        </button>
      </div>

      {/* AI Companion */}
      <div className="absolute top-1/2 right-12 w-[45%] z-10 transform -translate-y-1/2">
        <div className="w-full max-w-3xl">
          <h2 className="text-xl mb-2 text-cyan-400 font-semibold">
            NAO AI Companion
          </h2>
          <div className="border border-gray-600 rounded-2xl p-4 backdrop-blur-md bg-black/40">
            <EchoAssistant prompt="Begin your intelligence by typing here." />
          </div>
        </div>
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

       <div className="flex flex-col items-end gap-6 w-[45%] mx-auto mt-12 pr-4">
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
      letterSpacing: "0.025em",
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
      letterSpacing: "0.025em",
    }}
    onClick={() => setApplePaySynced(true)}
    disabled={applePaySynced}
  >
    {applePaySynced ? "✅ Apple Pay Synced" : "💳 Sync Apple Pay for Stablecoin Usage"}
  </button>
</div>

</div>
    </div>
  );
}
