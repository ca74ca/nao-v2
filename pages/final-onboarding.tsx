import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import EchoAssistant from "@/components/EchoAssistant";

export default function FinalOnboarding() {
  const router = useRouter();

  // ────────────────────────────────────
  // Local state
  // ────────────────────────────────────
  const [wearableConnected, setWearableConnected] = useState(false);
  const [coinbaseLinked, setCoinbaseLinked] = useState(false);
  const [applePaySynced, setApplePaySynced] = useState(false);
  const [allowContinue, setAllowContinue] = useState(false);

  const [loadingWearable, setLoadingWearable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // ────────────────────────────────────
  // Pull user from localStorage
  // ────────────────────────────────────
  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("nao_user") : null;

    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse nao_user from localStorage:", e);
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  // ────────────────────────────────────
  // Check wearable status once we have a user
  // ────────────────────────────────────
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

  // ────────────────────────────────────
  // Prevent page scrolling while component is mounted
  // ────────────────────────────────────
  useEffect(() => {
    // Store the original overflow style
    const originalOverflow = document.body.style.overflow;
    
    // Prevent scrolling
    document.body.style.overflow = "hidden";
    
    // Restore original overflow when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);
  // ────────────────────────────────────
  // Enable “Continue” only when all three syncs are complete
  // ────────────────────────────────────
  useEffect(() => {
    setAllowContinue(wearableConnected && coinbaseLinked && applePaySynced);
  }, [wearableConnected, coinbaseLinked, applePaySynced]);

  // ────────────────────────────────────
  // Handlers
  // ────────────────────────────────────
  const handleWhoopConnect = () => {
    window.location.href = "/api/whoop-auth";
  };

  const handleFinish = () => {
    router.push("/mint");
  };

  // ────────────────────────────────────
  // JSX
  // ────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white flex flex-row relative">
      {/* ─── Video background ─────────────────────────────────────── */}
      <video
        className="fixed top-1/2 left-1/2 w-screen h-screen object-cover -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none"
        src="/sign_u_sign_in_vidd_1.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* ─── LEFT: Sticky NAO model (hidden on mobile) ───────────── */}
      <div className="hidden md:flex relative z-10 flex-shrink-0 w-[420px] flex-col items-center justify-center">
        <div className="sticky top-0 flex flex-col items-center w-full h-screen justify-center">
          {/* Swap this placeholder with your actual model / Lottie / Three.js */}
          <div className="w-[320px] h-[480px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl shadow-2xl flex items-center justify-center border border-gray-700">
            <span className="text-5xl font-bold text-cyan-400 tracking-tighter">
              NAO
            </span>
          </div>
          <div className="mt-8 text-center text-lg text-gray-300 px-4">
            Meet your NAO model
            <br />
            Your Health AI
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Onboarding content ───────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col items-start justify-start px-8 py-10 space-y-6 max-w-2xl ml-auto">
        <h1 className="text-4xl font-bold">
          Welcome to NAO: Your Health Intelligence Passport
        </h1>

        <p className="text-lg">
          You’re about to mint your Health dNFT and unlock a system that tracks
          your wellness, powers your AI insights, and earns real-world
          stablecoin rewards. To continue, please connect the following:
        </p>

        {/* ─── Sync buttons ─────────────────────────────────────── */}
        <div className="space-y-4 w-full">
          {/* WHOOP / Apple Health */}
          <button
            className={`px-5 py-3 rounded-2xl border ${
              wearableConnected ? "border-green-400" : "border-white"
            } bg-transparent w-full`}
            onClick={handleWhoopConnect}
            disabled={loadingWearable || wearableConnected}
          >
            {loadingWearable
              ? "Checking wearable status..."
              : wearableConnected
              ? "✅ Wearable Connected (Whoop/Apple Health)"
              : "Connect Wearable Device"}
          </button>

          {/* Coinbase Wallet */}
          <button
            className={`px-5 py-3 rounded-2xl border ${
              coinbaseLinked ? "border-green-400" : "border-white"
            } bg-transparent w-full`}
            onClick={() => setCoinbaseLinked(true)} // TODO: replace with real wallet connect
            disabled={coinbaseLinked}
          >
            {coinbaseLinked ? "✅ Coinbase Linked" : "Link Coinbase Wallet"}
          </button>

          {/* Apple Pay */}
          <button
            className={`px-5 py-3 rounded-2xl border ${
              applePaySynced ? "border-green-400" : "border-white"
            } bg-transparent w-full`}
            onClick={() => setApplePaySynced(true)} // TODO: replace with real Apple Pay sync
            disabled={applePaySynced}
          >
            {applePaySynced
              ? "✅ Apple Pay Synced"
              : "Sync Apple Pay for Stablecoin Usage"}
          </button>
        </div>

        {/* ─── Error notice ──────────────────────────────────────── */}
        {error && (
          <div className="text-red-400 font-semibold mt-2 animate-pulse">
            {error}
          </div>
        )}

        {/* ─── AI Companion ─────────────────────────────────────── */}
        <div className="w-full max-w-3xl mt-8">
          <h2 className="text-xl mb-2 text-cyan-400 font-semibold">
            NAO AI Companion
          </h2>
          <div className="border border-gray-600 rounded-2xl p-4">
            <EchoAssistant prompt="Begin your intelligence by typing here." />
          </div>
        </div>

        {/* ─── Progress helper text ─────────────────────────────── */}
        {allowContinue ? (
          <p className="text-green-400 mt-4">
            ✅ All systems go — you’re ready to mint your Health dNFT.
          </p>
        ) : (
          <p className="text-yellow-300 mt-4">
            ⚠️ Please complete every connection above to continue.
          </p>
        )}

        {/* ─── Continue button ──────────────────────────────────── */}
        <button
          className="mt-4 px-6 py-3 bg-blue-500 rounded-2xl text-white font-semibold disabled:opacity-40"
          disabled={!allowContinue}
          onClick={handleFinish}
        >
          Continue to Health Passport
        </button>
      </div>
    </div>
  );
}
