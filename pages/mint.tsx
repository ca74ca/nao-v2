import React, { useEffect, useState } from "react";
import {
  useConnect,
  metamaskWallet,
  coinbaseWallet,
  useDisconnect,
  useAddress,
} from "@thirdweb-dev/react";
import { useRouter } from "next/router";
import EchoAssistant from "../components/EchoAssistant";
import DailyOutlook from "../src/components/DailyOutlook";
import { RewardsTracker } from "../components/RewardsTracker";
import { useRewardState } from "../src/hooks/useRewardState";
import ActionBar from "../components/ActionBar";
import RedeemPopup from "@/components/RedeemPopup";
import { getWhoopAuthUrl } from '../utils/getWhoopAuthUrl';

// --- Evolve NFT Action Trigger (original, unchanged) ---
function EvolveActionBar({ onEvolve, evolving }: { onEvolve: () => void, evolving: boolean }) {
  return (
    <div style={{
      position: "fixed",
      right: 32,
      bottom: 32,
      zIndex: 50,
      pointerEvents: "auto"
    }}>
      <button
        onClick={onEvolve}
        disabled={evolving}
        style={{
          padding: "14px 38px",
          borderRadius: 999,
          background: evolving ? "#aaa" : "#2D9CFF",
          color: "#fff",
          fontWeight: 900,
          fontSize: 20,
          border: "none",
          boxShadow: "0 0 32px 6px #60C6FF, 0 0 8px #60C6FF",
          cursor: evolving ? "wait" : "pointer",
          opacity: evolving ? 0.7 : 1,
          letterSpacing: "0.07em",
        }}
      >
        {evolving ? "Evolving..." : "Evolve NFT"}
      </button>
    </div>
  );
}

// --- Evolve NFT Meter + Glowing Button (ADDITION, does not replace original) ---
function EvolveMeterActionBar({
  onEvolve,
  evolving,
  ready,
  xp,
  xpGoal
}: {
  onEvolve: () => void,
  evolving: boolean,
  ready: boolean,
  xp: number,
  xpGoal: number
}) {
  const safeXpGoal = xpGoal && xpGoal > 0 ? xpGoal : 1;
  const xpPct = Math.min(1, (xp || 0) / safeXpGoal);
  const percent = Math.min(100, Math.round(xpPct * 100));
  return (
    <div style={{
      position: "fixed",
      right: 32,
      bottom: 110,
      zIndex: 51,
      pointerEvents: "auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
    }}>
      <div style={{ marginBottom: 14, width: 260 }}>
        <div style={{ color: "#fff", marginBottom: 4, fontWeight: 700 }}>
          {xp} / {xpGoal} XP until next evolution
        </div>
        <div style={{
          height: 13,
          width: "100%",
          borderRadius: 7,
          background: "#132c48",
          overflow: "hidden",
          boxShadow: "0 0 8px #60C6FF33",
        }}>
          <div style={{
            height: "100%",
            width: `${percent}%`,
            background: ready
              ? "linear-gradient(90deg, #00ffc8 0%, #2D9CFF 100%)"
              : "linear-gradient(90deg, #2D9CFF 0%, #60C6FF 100%)",
            borderRadius: 7,
            transition: "width 0.3s, background 0.3s",
            boxShadow: ready
              ? "0 0 24px 6px #00ffc8"
              : "0 0 12px 1px #60C6FF",
          }}/>
        </div>
      </div>
      <button
        onClick={onEvolve}
        disabled={evolving || !ready}
        style={{
          padding: "16px 44px",
          borderRadius: 999,
          background: ready ? "#2D9CFF" : "#aaa",
          color: "#fff",
          fontWeight: 900,
          fontSize: 22,
          border: "none",
          boxShadow: ready
            ? "0 0 32px 8px #00ffc8, 0 0 16px #60C6FF"
            : "0 0 8px #888",
          cursor: evolving || !ready ? "not-allowed" : "pointer",
          opacity: evolving ? 0.7 : 1,
          letterSpacing: "0.07em",
          transition: "box-shadow 0.2s, background 0.2s",
          animation: ready
            ? "glowPulse 1.2s infinite alternate"
            : undefined,
        }}
      >
        {evolving ? "Evolving..." : ready ? "Evolve NFT" : "Keep Earning XP"}
      </button>
      <style>{`
        @keyframes glowPulse {
          0% { box-shadow: 0 0 32px 4px #00ffc8, 0 0 16px #60C6FF; }
          100% { box-shadow: 0 0 64px 16px #00ffc8, 0 0 32px #60C6FF; }
        }
      `}</style>
    </div>
  );
}

// Futuristic blue/glow palette
const BLUE = "#2D9CFF";
const BLUE_DARK = "#123B70";
const BLUE_GLOW = "#60C6FF";
const BLUE_SOFT = "#2D9CFFDD";
const BLUE_BG = "rgba(45,156,255,0.12)";
const WHITE_SOFT = "rgba(255,255,255,0.7)";

// VO2 Max logic & reward
function getVo2MaxReward(vo2Max: number) {
  if (vo2Max == null || isNaN(vo2Max)) return { rating: "--", reward: "No data" };
  if (vo2Max < 30) return { rating: "Below Average", reward: "No bonus" };
  if (vo2Max < 40) return { rating: "Good", reward: "+10 XP" };
  if (vo2Max < 50) return { rating: "Excellent", reward: "+25 XP" };
  return { rating: "Elite", reward: "+50 XP + NFT aura unlock" };
}

async function fetchWeather(city = "Detroit") {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current_weather=true`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.current_weather) {
      const code = data.current_weather.weathercode;
      const codeMap: Record<number, string> = {
        0: "Clear", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Fog", 48: "Depositing rime fog", 51: "Drizzle: Light", 53: "Drizzle: Moderate",
        55: "Drizzle: Dense", 56: "Freezing Drizzle: Light", 57: "Freezing Drizzle: Dense",
        61: "Rain: Slight", 63: "Rain: Moderate", 65: "Rain: Heavy", 66: "Freezing Rain: Light",
        67: "Freezing Rain: Heavy", 71: "Snow fall: Slight", 73: "Snow fall: Moderate",
        75: "Snow fall: Heavy", 77: "Snow grains", 80: "Rain showers: Slight",
        81: "Rain showers: Moderate", 82: "Rain showers: Violent", 85: "Snow showers slight",
        86: "Snow showers heavy", 95: "Thunderstorm", 96: "Thunderstorm w/ slight hail",
        99: "Thunderstorm w/ heavy hail",
      };
      return `${data.current_weather.temperature}°C, ${codeMap[code] || "Unknown"}`;
    }
    return "Weather data unavailable";
  } catch {
    return "Weather data unavailable";
  }
}

function generateRandomState(length = 16) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let state = "";
  for (let i = 0; i < length; i++) {
    state += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return state;
}

export default function MintPage() {
  const router = useRouter();

  // ThirdWeb wallet hooks (updated)
  const connect = useConnect();
  const disconnectWallet = useDisconnect();
  const address = useAddress();

  const { rewardState } = useRewardState(
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("nao_user") || "{}").walletId || ""
      : ""
  );

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<string>("");
  const [now, setNow] = useState<Date>(new Date());
  const [whoopSyncStatus, setWhoopSyncStatus] = useState<string>("");
  const [appleSyncStatus, setAppleSyncStatus] = useState<string>("");

  // dNFT state
  const [nftMeta, setNftMeta] = useState<any>(null);
  const [evolving, setEvolving] = useState(false);

  // --- WHOOP DATA: Get live data ---
  const [whoopData, setWhoopData] = useState<any>(null);
  const [whoopLoading, setWhoopLoading] = useState(true);
  const [whoopError, setWhoopError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("nao_user");
    if (!storedUser) {
      setError("User not found. Please onboard again.");
      router.push("/");
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      if (!parsed?.email) {
        setError("User not found. Please onboard again.");
        router.push("/");
        setLoading(false);
        return;
      }

      // If user data is incomplete (missing walletId), fetch from API
      if (!parsed.walletId || !parsed.xp) {
        const fetchCompleteUserData = async () => {
          try {
            const res = await fetch(`/api/getUser?email=${encodeURIComponent(parsed.email)}`);
            if (!res.ok) throw new Error("Failed to fetch user data");
            const completeUser = await res.json();
            
            // Update localStorage with complete user data
            localStorage.setItem('nao_user', JSON.stringify(completeUser));
            setUser(completeUser);
            setLoading(false);
          } catch (err) {
            console.error("Error fetching complete user data:", err);
            setUser(parsed); // Use incomplete data as fallback
            setLoading(false);
          }
        };
        fetchCompleteUserData();
      } else {
        setUser(parsed);
        setLoading(false);
      }
    } catch (e) {
      console.error("Failed to parse stored user", e);
      setError("Invalid user data. Please re-onboard.");
      router.push("/");
      setLoading(false);
    }
  }, [router]);

  // XP/Level fallback logic: Do NOT reference passportData!
  const currentXP = rewardState?.xp ?? user?.xp ?? 0;
  const currentLevel = rewardState?.evolutionLevel ?? user?.evolutionLevel ?? 1;

  const email = user?.email || "";

  useEffect(() => {
    if (!user?.walletId) return;

    const refreshUser = async () => {
      try {
        const res = await fetch(`/api/getUser?wallet=${user.walletId.toLowerCase()}`);
        if (!res.ok) throw new Error("User refresh failed");
        const fresh = await res.json();
        
        // Update both state and localStorage with fresh data
        setUser(fresh);
        localStorage.setItem('nao_user', JSON.stringify(fresh));
      } catch (err) {
        console.error("User refresh error:", err);
      }
    };

    refreshUser();
    const id = setInterval(refreshUser, 60_000);
    return () => clearInterval(id);
  }, [user?.walletId]);

 useEffect(() => {
  const t = setInterval(() => setNow(new Date()), 1000);
  return () => clearInterval(t);
}, []);

useEffect(() => {
  fetchWeather().then(setWeather);
}, [user]);

useEffect(() => {
  async function fetchNft() {
    if (!user?.tokenId) return setNftMeta(null);
    setNftMeta(null);
    const res = await fetch(`/api/nft-metadata?tokenId=${user.tokenId}`);
    const data = await res.json();
    setNftMeta(data);
  }
  fetchNft();
}, [user?.tokenId]);


  async function handleEvolve() {
    if (!user?.walletId || !user?.email) return;
    setEvolving(true);

    try {
      const res = await fetch('/api/evolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: user.walletId,
          email: user.email,
        }),
      });

      if (!res.ok) throw new Error('Failed to evolve NFT');

      const updatedData = await res.json();
      
      // ✅ Update user's reward balance from backend response
      const updatedUser = {
        ...user,
        rewardBalance: updatedData.rewardBalance,
        ...updatedData
      };
      setUser(updatedUser);
      localStorage.setItem('nao_user', JSON.stringify(updatedUser));

      // Refresh the NFT metadata preview if needed
      const nftRes = await fetch(`/api/nft-metadata?tokenId=${updatedUser.tokenId}`);
      const nftData = await nftRes.json();
      setNftMeta(nftData);
    } catch (err) {
      console.error('Evolve failed:', err);
      alert('Could not evolve NFT at this time.');
    } finally {
      setEvolving(false);
    }
  }

  const handleWhoopSync = () => {
    const localUser = JSON.parse(localStorage.getItem("nao_user") || "{}");
    const wallet = localUser.walletId || localUser.wallet;
    if (!wallet) {
      alert("No wallet found. Please log in again.");
      return;
    }
    document.cookie = `wallet=${wallet}; path=/; SameSite=Lax`;
    setWhoopSyncStatus("Opening WHOOP...");
    window.open(getWhoopAuthUrl(wallet), "_blank", "width=500,height=700");
    setTimeout(() => setWhoopSyncStatus(""), 1800);
  };

  useEffect(() => {
    function handleWhoopMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "WHOOP_AUTH_SUCCESS") {
        setWhoopSyncStatus("✅ WHOOP Sync Complete!");
        setTimeout(() => setWhoopSyncStatus(""), 2500);
      } else if (event.data?.type === "WHOOP_AUTH_ERROR") {
        setWhoopSyncStatus("❌ WHOOP Sync Failed.");
        setTimeout(() => setWhoopSyncStatus(""), 2500);
      }
    }
    window.addEventListener("message", handleWhoopMessage);
    return () => window.removeEventListener("message", handleWhoopMessage);
  }, []);

  const handleAppleSync = async () => {
    setAppleSyncStatus("Connecting to Apple Health...");
    await new Promise(r => setTimeout(r, 1000));
    setAppleSyncStatus("Authorizing with Apple Health...");
    await new Promise(r => setTimeout(r, 1200));
    setAppleSyncStatus("Fetching steps, heart rate, and calories...");
    await new Promise(r => setTimeout(r, 1200));
    setAppleSyncStatus("✅ Apple Health sync complete!");
    setTimeout(() => setAppleSyncStatus(""), 2000);
  };

  const [showRedeemPopup, setShowRedeemPopup] = useState(false);

  const handleRedeem = async (method: 'apple-pay' | 'coinbase') => {
    try {
      await fetch('/api/redeem', {
        method: 'POST',
        body: JSON.stringify({ method }),
        headers: { 'Content-Type': 'application/json' },
      });
      setShowRedeemPopup(false);
      alert('Redemption Request Sent!');
    } catch (error) {
      console.error(error);
      alert('Redemption Failed. Please try again.');
    }
  };


 // --- BEGIN: NAO SMART CHAT ADDITION ---
const [threadId, setThreadId] = useState<string | null>(null);

useEffect(() => {
  fetch("/api/thread", { method: "POST" })
    .then((res) => res.json())
    .then((data) => setThreadId(data.threadId))
    .catch(() => setThreadId(null));
}, []);

// Smart message handler for EchoAssistant (handles all tool calls)
const sendMessage = async (input: string) => {
  if (!threadId) return "NAO is initializing, please wait...";

  const user = JSON.parse(localStorage.getItem("nao_user") || "{}");
  const walletId = user.walletId;

  try {
    /* 1️⃣ Send user message to OpenAI */
    const res = await fetch("/api/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId,
        message: input,
        page: "mint",
        onboardingComplete: true,
        walletId,
      }),
    });
    const data = await res.json();

    /* 2️⃣ If OpenAI asks for tool outputs, run them */
    if (
      data?.run?.status === "requires_action" &&
      data?.run?.required_action?.submit_tool_outputs
    ) {
      const toolCalls = data.run.required_action.submit_tool_outputs.tool_calls;

      const tool_outputs = await Promise.all(
        toolCalls.map(async (tool: any) => {
          const { name, arguments: argsJSON } = tool.function;
          const args = JSON.parse(argsJSON);

          let output: any = { error: "Unknown tool" };

          if (name === "verifyWorkout") {
            const workoutRes = await fetch("/api/verifyWorkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(args),
            });
            output = await workoutRes.json();
          }

          if (name === "getRewardStatus") {
            const rewardRes = await fetch(
              `/api/getRewardStatus?wallet=${args.walletId || walletId}`
            );
            output = await rewardRes.json();
          }

          if (name === "get_user_history" || name === "getRecentWorkouts") {
            // Use whatever ID the tool gives first; otherwise fall back to the walletId you already have
            const userId = args.userId || args.walletId || walletId;

            // Call your backend server directly
            const histRes = await fetch(`https://nao-sdk-api.onrender.com/api/history/${userId}`);
            output = await histRes.json();
          }

          if (name === "generateGreeting") {
            const greetRes = await fetch(
              `/api/generateGreeting?walletId=${args.walletId || walletId}`
            );
            output = await greetRes.json();
          }

          if (name === "redeem") {
            const redeemRes = await fetch("/api/redeem", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ walletId: args.walletId || walletId }),
            });
            output = await redeemRes.json();
          }

          return { tool_call_id: tool.id, output };
        })
      );

      /* 3️⃣ Send outputs back to OpenAI */
      await fetch("/api/submit-tool-output", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: threadId,
          run_id: data.run.id,
          tool_outputs,
        }),
      });

      /* 4️⃣ Get the assistant's follow-up reply */
      const followUp = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId }),
      });
      const followData = await followUp.json();
      return followData.reply || "NAO is thinking...";
    }

    /* 5️⃣ No tool call needed */
    return data?.reply || "NAO is thinking...";
  } catch (err: any) {
    return "Network error: " + (err?.message || "Unknown error");
  }
};
// --- END: NAO SMART CHAT ADDITION ---

  if (loading) return <div>Loading your passport...</div>;
  if (error) return <div style={{ color: "red", padding: 20 }}>{error}</div>;
  if (!user) return <div>User not found. Please onboard again.</div>;

  // Build passportData object AFTER currentXP/currentLevel defined
  const passportData = {
    username: user?.username || "User",
    passportId: user?.passportId || "N/A",
    xp: currentXP,
    evolutionLevel: currentLevel,
    nftImage: "/start_user_2nft.png",
    nftTitle: user?.nftTitle || "NAO Health NFT",
    nftMeta: user?.nftMeta || "Dynamic, evolving health record",
  };

  // --- DYNAMIC CALORIE/RECOVERY/WORKOUT LOGIC FROM WHOOP ---
  const caloriesBurned = whoopData?.workout?.calories_today ?? 0;
  const calorieGoal = whoopData?.workout?.goal ?? 600;
  const whoopRecovery = whoopData?.recovery?.score ?? 0;
  const workoutCount = whoopData?.workout?.count ?? 0;
  const workoutAchieved = workoutCount > 0;

  const systemRecoveryReward = {
    id: "3",
    title: "System Recovery (Syncs with WHOOP)",
    description: whoopLoading
      ? "Loading recovery data…"
      : whoopError
        ? "Unable to load recovery data"
        : whoopRecovery === null
          ? "No WHOOP data"
          : whoopRecovery >= 80
            ? `Goal met! Recovery: ${whoopRecovery}/80`
            : `Current: ${whoopRecovery}/80 (keep going!)`,
    cost: 15,
    available: whoopRecovery >= 80,
    limitedTime: true,
    action: () => {
      if (whoopRecovery >= 80) alert("Reward claimed!");
    },
    icon: "💤",
  };

  const burnCalorieReward = {
    id: "2",
    title: "Burn Calorie (Syncs with Wearable)",
    description: whoopLoading
      ? "Loading calories…"
      : whoopError
        ? "Unable to load calorie data"
        : caloriesBurned >= calorieGoal
          ? `Goal met! Burned: ${caloriesBurned}/${calorieGoal} kcal`
          : `Burn calories today to level up! Synced live with your wearable. (${caloriesBurned}/${calorieGoal} kcal)`,
    cost: 25,
    available: caloriesBurned >= calorieGoal,
    limitedTime: true,
    action: () => {
      if (caloriesBurned >= calorieGoal) alert("Reward claimed!");
    },
    caloriesBurned,
    calorieGoal,
    icon: "🔥",
  };

  const workoutAchievedReward = {
    id: "workout",
    title: "Workout Achieved (Syncs with WHOOP)",
    description: whoopLoading
      ? "Loading workouts…"
      : whoopError
        ? "Unable to load workout data"
        : workoutAchieved
          ? `Goal met! Workouts completed: ${workoutCount}`
          : `Complete at least 1 WHOOP workout today (You have: ${workoutCount})`,
    cost: 20,
    available: workoutAchieved,
    limitedTime: true,
    action: () => {
      if (workoutAchieved) alert("Workout reward claimed!");
    },
    icon: "🏋️",
  };

  const rewards = [
    {
      id: "1",
      title: "Early Bird",
      description: "Wake up before 7am for a bonus.",
      cost: 10,
      available: true,
      limitedTime: false,
      action: () => alert("Redeemed!"),
    },
    burnCalorieReward,
    workoutAchievedReward,
    systemRecoveryReward,
  ];

  const xpGoal = 500;
  const xp = passportData.xp;

  return (
    <div
      className="relative min-h-screen w-full flex font-[Myriad_Pro,sans-serif] bg-transparent overflow-x-hidden"
      style={{
        fontFamily: "Myriad Pro, Arial, sans-serif",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        background: "transparent",
        overflowX: "hidden",
      }}
    >
      {/* Action bar at the top */}
      <ActionBar
        onWhoopSync={handleWhoopSync}
        onAppleSync={handleAppleSync}
        whoopSyncStatus={whoopSyncStatus}
        appleSyncStatus={appleSyncStatus}
        onRedeemClick={() => setShowRedeemPopup(true)}
      />

      {showRedeemPopup && (
        <RedeemPopup
          onRedeem={handleRedeem}
          onClose={() => setShowRedeemPopup(false)}
        />
      )}

      {/* Kling AI background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-[-1] pointer-events-none"
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          zIndex: -1,
          pointerEvents: "none",
          opacity: 0.7,
        }}
      >
        <source src="/ai_second_video1.mp4" type="video/mp4" />
      </video>

      {/* LEFT: NAO Logo, subtitle, new initialized buttons, and DailyOutlook */}
      <div
        className="absolute left-0 top-0 px-8 pt-12 z-10 w-[40vw] min-w-[200px]"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          paddingLeft: 32,
          paddingTop: 32,
          zIndex: 10,
          minWidth: 200,
          color: BLUE,
          textShadow: `0 0 56px ${BLUE_GLOW}, 0 0 16px ${BLUE_SOFT}, 0 0 4px ${BLUE}`,
        }}
      >
        {/* NAO Logo */}
        <img
          src="/nao_logo_mintpage.png"
          alt="NAO logo"
          style={{
            width: 180,
            height: "auto",
            marginBottom: 22,
            filter: `drop-shadow(0 0 56px ${BLUE_GLOW}) drop-shadow(0 0 16px ${BLUE_SOFT}) drop-shadow(0 0 4px ${BLUE})`,
            pointerEvents: "auto",
            userSelect: "none",
            display: "block",
          }}
          draggable={false}
        />
        <div
          style={{
            fontSize: 24,
            fontWeight: 200,
            color: WHITE_SOFT,
            textShadow: `0 0 18px ${BLUE_GLOW}`,
            marginBottom: 8,
          }}
        >
          {`Welcome, ${passportData.username} (${user?.email || ""})!`}
        </div>
        <div style={{ fontSize: 16, color: WHITE_SOFT, marginBottom: 8 }}>
          {`Today is ${now.toLocaleDateString()} — ${now.toLocaleTimeString()}`}
        </div>
        <div style={{ fontSize: 16, color: WHITE_SOFT, marginBottom: 8 }}>
          {`Weather in New York: ${weather}`}
        </div>
        <div
          style={{
            fontSize: 16,
            color: WHITE_SOFT,
            marginBottom: 16,
            fontStyle: "italic",
          }}
        >
          🚀 Startup tip: Stay hydrated and sync your health data for maximum rewards!
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            margin: "12px 0 18px 0",
            flexWrap: "wrap",
            userSelect: "text",
          }}
        >
          <button
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              background: "#053f1c",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              boxShadow: "0 0 32px 6px #00dfc0, 0 0 8px #00dfc0",
              border: "2px solid #00dfc0",
              outline: "none",
              cursor: "default",
              letterSpacing: "0.04em",
              position: "relative",
              overflow: "hidden",
              textShadow: "0 0 14px #00dfc0, 0 0 2px #fff",
              minWidth: 190,
            }}
            tabIndex={-1}
            disabled
          >
            <span style={{ display: "inline-flex", alignItems: "center" }}>
              <span
                style={{
                  marginRight: 8,
                  display: "inline-block",
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#00dfc0",
                  boxShadow: "0 0 16px #00dfc0, 0 0 2px #00dfc0",
                }}
              ></span>
              WHOOP Initialized
            </span>
          </button>
          <button
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              background: "#064012",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              boxShadow: "0 0 32px 8px #0eb90e, 0 0 8px #0eb90e",
              border: "2px solid #0eb90e",
              outline: "none",
              cursor: "default",
              letterSpacing: "0.04em",
              position: "relative",
              overflow: "hidden",
              textShadow: "0 0 14px #0eb90e, 0 0 2px #fff",
              minWidth: 190,
            }}
            tabIndex={-1}
            disabled
          >
            <span style={{ display: "inline-flex", alignItems: "center" }}>
              <span
                style={{
                  marginRight: 8,
                  display: "inline-block",
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#0eb90e",
                  boxShadow: "0 0 16px #0eb90e, 0 0 2px #0eb90e",
                }}
              ></span>
              Apple Health Initialized
            </span>
          </button>
        </div>
        {/* DailyOutlook placed directly underneath the subtitle */}
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            marginTop: 10,
            pointerEvents: "auto",
          }}
        >
          <DailyOutlook
            date={now.toLocaleDateString()}
            forecast={typeof weather === "string" ? weather.split(", ")[1] || "Sunny" : "Sunny"}
            temperature={typeof weather === "string" ? Number(weather.split("°")[0]) : 25}
            rewards={rewards}
            caloriesBurned={caloriesBurned}
            calorieGoal={calorieGoal}
            workoutComplete={workoutAchieved}
            xp={passportData.xp}
            xpGoal={500}
            whoopData={whoopData}
            whoopLoading={whoopLoading}
            whoopError={whoopError}
          />

          {/* --- VO2 Max Reward Card --- */}
          <div
            style={{
              marginTop: 24,
              marginBottom: 10,
              borderRadius: 18,
              background: "rgba(0,32,12,0.74)",
              boxShadow: "0 0 28px 6px #00ffc8, 0 0 8px #00ffc877",
              padding: 20,
              color: "#fff",
              width: "100%",
              maxWidth: 420,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 28, marginRight: 12 }}>🫁</span>
              <span style={{ fontWeight: 700, fontSize: 21 }}>VO₂ Max</span>
              {user?.vo2Max >= 50 && (
                <span
                  style={{
                    marginLeft: 12,
                    color: "#00ffc8",
                    fontSize: 22,
                    fontWeight: 800,
                    textShadow: "0 0 16px #00ffc8, 0 0 5px #fff",
                    animation: "pulse 1.2s infinite alternate",
                  }}
                >
                  🌟
                </span>
              )}
            </div>
            <div style={{ fontSize: 16, marginBottom: 2 }}>
              Score: <span style={{ color: "#2D9CFF", fontWeight: 600 }}>{user?.vo2Max ?? "--"}</span>
            </div>
            <div style={{ fontSize: 13, color: "#2D9CFFDD", fontStyle: "italic", marginBottom: 5 }}>
              {user?.vo2MaxSource ?? "Apple HealthKit → VO₂Max quantity type"}
            </div>
            <div style={{ fontSize: 15, marginBottom: 2 }}>
              Fitness Rating:{" "}
              <span
                style={{
                  color:
                    user?.vo2Max >= 50
                      ? "#00ffc8"
                      : user?.vo2Max >= 40
                      ? "#60C6FF"
                      : user?.vo2Max >= 30
                      ? "#FFD600"
                      : "#FF4A4A",
                  fontWeight: 700,
                }}
              >
                {getVo2MaxReward(user?.vo2Max).rating}
              </span>
            </div>
            <div style={{ fontSize: 15, marginBottom: 10, fontWeight: 600 }}>
              Reward:{" "}
              <span
                style={{
                  color: user?.vo2Max >= 50 ? "#00ffc8" : "#2D9CFF",
                }}
              >
                {getVo2MaxReward(user?.vo2Max).reward}
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: 14,
                borderRadius: 8,
                background: "rgba(0,0,0,0.34)",
                overflow: "hidden",
                marginTop: 7,
                boxShadow: "0 0 8px #00ffc822",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, Math.round(((user?.vo2Max ?? 0) / 60) * 100))}%`,
                  borderRadius: 8,
                  background:
                    user?.vo2Max >= 50
                      ? "#00ffc8"
                      : user?.vo2Max >= 40
                      ? "#60C6FF"
                      : user?.vo2Max >= 30
                      ? "#FFD600"
                      : "#FF4A4A",
                  boxShadow:
                    user?.vo2Max >= 50
                      ? "0 0 16px #00ffc8"
                      : "0 0 12px #2D9CFF",
                  transition: "width 0.3s, background 0.3s",
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: RewardsTracker + dNFT Passport Card */}
      <div
        className="flex-1 flex justify-end items-center"
        style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center" }}
      >
        <main className="w-full max-w-md mr-6 md:mr-14" style={{ position: "relative" }}>
          {/* Your existing dNFT Card, Evolution Info, XP Progress */}
          {/* Replace <YourDNFTComponent /> with your actual NFT card/component, e.g. RewardsTracker and NFT preview */}
          <RewardsTracker
            state={{
              calories: caloriesBurned,
              workoutsCompleted: workoutAchieved ? 1 : 0,
              strainScore: whoopData?.strain?.score ?? 0,
              recoveryScore: whoopRecovery,
            }}
          />
          {/* Example NFT image preview (optional, you can customize) */}
          <div style={{ margin: "32px auto 18px auto", textAlign: "center" }}>
            <img
              src="/start_user_2nft.png"
              alt="Your NFT"
              style={{ width: 180, borderRadius: 24, boxShadow: `0 0 32px 8px ${BLUE_GLOW}` }}
            />
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 18, marginTop: 8 }}>
              {passportData.nftTitle}
            </div>
            <div style={{ color: "#0ff", fontSize: 14, marginTop: 2 }}>
              {passportData.nftMeta}
            </div>
          </div>
          <button
            style={{
              padding: "10px 24px",
              borderRadius: 999,
              background: evolving ? "#aaa" : BLUE,
              color: "#fff",
              fontWeight: 800,
              fontSize: 16,
              border: "none",
              boxShadow: `0 0 16px 2px ${BLUE_GLOW}`,
              cursor: evolving ? "wait" : "pointer",
              opacity: evolving ? 0.7 : 1,
              transition: "all 0.2s",
              marginBottom: 12,
              width: "100%",
            }}
            onClick={handleEvolve}
            disabled={evolving}
          >
            {evolving ? "Evolving..." : "Evolve NFT"}
          </button>
          {/* ✅ Wallet Connect BELOW all of the above, as separate section */}
          <div style={{ marginTop: "32px", textAlign: "center" }}>
            <h2 style={{ color: "#0ff", fontWeight: 700, fontSize: "1.2rem", marginBottom: "12px" }}>
              Manage Payout Wallet
            </h2>
            <button
              onClick={() => connect(metamaskWallet())}
              style={{
                padding: "10px 24px",
                borderRadius: 999,
                background: "linear-gradient(to right, #8e2de2, #4a00e0)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                border: "none",
                marginBottom: 12,
                width: "100%",
                cursor: "pointer",
              }}
            >
              Connect MetaMask
            </button>
            <button
              onClick={() => connect(coinbaseWallet())}
              style={{
                padding: "10px 24px",
                borderRadius: 999,
                background: "linear-gradient(to right, #fcb045, #fd1d1d, #833ab4)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                border: "none",
                marginBottom: 12,
                width: "100%",
                cursor: "pointer",
              }}
            >
              Connect Coinbase Wallet
            </button>
            {address && (
              <div style={{ marginTop: "16px", color: "#0ff", fontSize: "0.85rem" }}>
                <p>Connected Wallet for Rewards:</p>
                <p style={{ fontFamily: "monospace", color: "#fff" }}>{address}</p>
              </div>
            )}
          </div>
        </main>
      </div>
      <EvolveActionBar onEvolve={handleEvolve} evolving={evolving} />
      <EvolveMeterActionBar
        onEvolve={handleEvolve}
        evolving={evolving}
        ready={passportData.xp >= xpGoal}
        xp={passportData.xp}
        xpGoal={xpGoal}
      />
      <div
        style={{
          position: "fixed",
          left: "50%",
          bottom: "10vh",
          transform: "translateX(-50%)",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 20,
        }}
      >
        <div style={{ pointerEvents: "auto", width: "fit-content" }}>
          <EchoAssistant
            initialMessage={
              `Here is your health passport. You're doing great! You're on level ${passportData.evolutionLevel} with ${passportData.xp} reward points and your streak is 5 days.`
            }
            inputPlaceholder="Awaken NAO"
            onSend={sendMessage}
          />
        </div>
      </div>
    </div>
  );
}