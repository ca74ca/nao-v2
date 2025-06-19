import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import EchoAssistant from "@/components/EchoAssistant";
import { useSession } from "next-auth/react";

export default function FinalOnboarding() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wearableConnected, setWearableConnected] = useState(false);
  const [coinbaseLinked, setCoinbaseLinked] = useState(false);
  const [applePaySynced, setApplePaySynced] = useState(false);
  const [allowContinue, setAllowContinue] = useState(false);
  const [loadingWearable, setLoadingWearable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "loading") return; // Wait for session to resolve
    if (!session) router.push("/signin");
  }, [session, status, router]);

  // Check Whoop/Apple Health connection status from backend
  useEffect(() => {
    const checkWearable = async () => {
      if (!session?.user?.email) return;
      setLoadingWearable(true);
      try {
        const res = await fetch(`/api/getUser?email=${encodeURIComponent(session.user.email)}`);
        if (!res.ok) throw new Error("Could not fetch user status");
        const data = await res.json();
        // Adjust the property name as needed to match your DB
        if (data?.whoopLinked) setWearableConnected(true);
        else setWearableConnected(false);
      } catch (e) {
        setError("Could not check wearable status.");
      } finally {
        setLoadingWearable(false);
      }
    };
    checkWearable();
  }, [session]);

  // Enable continue when all are connected
  useEffect(() => {
    setAllowContinue(wearableConnected && coinbaseLinked && applePaySynced);
  }, [wearableConnected, coinbaseLinked, applePaySynced]);

  const handleWhoopConnect = () => {
    window.location.href = "/api/whoop-auth";
  };

  const handleFinish = () => {
    router.push("/mint");
  };

  return (
    <div className="min-h-screen bg-black text-white px-8 py-10 flex flex-col items-start justify-start space-y-6">
      <h1 className="text-4xl font-bold">Welcome to NAO: Your Health Intelligence Passport</h1>
      <p className="text-lg max-w-2xl">
        You’re about to mint your Health dNFT and unlock a system that tracks your wellness, powers your AI insights,
        and allows real-world stablecoin rewards. To continue, please connect the following:
      </p>

      <div className="space-y-4">
        {/* WHOOP/Apple Health connect */}
        <button
          className={`px-5 py-3 rounded-2xl border ${wearableConnected ? 'border-green-400' : 'border-white'} bg-transparent`}
          onClick={handleWhoopConnect}
          disabled={loadingWearable || wearableConnected}
        >
          {loadingWearable
            ? "Checking wearable status..."
            : wearableConnected
            ? "✅ Wearable Connected (Whoop/Apple Health)"
            : "Connect Wearable Device"}
        </button>

        {/* Coinbase + Apple Pay (toggle for now) */}
        <button
          className={`px-5 py-3 rounded-2xl border ${coinbaseLinked ? 'border-green-400' : 'border-white'} bg-transparent`}
          onClick={() => setCoinbaseLinked(true)}
          disabled={coinbaseLinked}
        >
          {coinbaseLinked ? "✅ Coinbase Linked" : "Link Coinbase Wallet"}
        </button>

        <button
          className={`px-5 py-3 rounded-2xl border ${applePaySynced ? 'border-green-400' : 'border-white'} bg-transparent`}
          onClick={() => setApplePaySynced(true)}
          disabled={applePaySynced}
        >
          {applePaySynced ? "✅ Apple Pay Synced" : "Sync Apple Pay for Stablecoin Usage"}
        </button>
      </div>

      {error && (
        <div className="text-red-400 font-semibold">{error}</div>
      )}

      <div className="w-full max-w-3xl mt-8">
        <h2 className="text-xl mb-2">NAO AI Companion</h2>
        <div className="border border-gray-600 rounded-2xl p-4">
          <EchoAssistant session={session} prompt="Begin your intelligence by typing here." />
        </div>
      </div>

      <button
        className="mt-8 px-6 py-3 bg-blue-500 rounded-2xl text-white font-semibold disabled:opacity-40"
        disabled={!allowContinue}
        onClick={handleFinish}
      >
        Continue to Health Passport
      </button>
    </div>
  );
}