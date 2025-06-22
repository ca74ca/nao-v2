import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import EchoAssistant from "../components/EchoAssistant";
import DailyOutlook from "../src/components/DailyOutlook";
import { RewardsTracker } from "../components/RewardsTracker";
import { useRewardState } from "../src/hooks/useRewardState";
import ActionBar from "../components/ActionBar";

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
  const percent = Math.min(100, Math.round((xp / xpGoal) * 100));
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

// Util: Generate a random state for OAuth (min 8 chars, default 16)
function generateRandomState(length = 16) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let state = "";
  for (let i = 0; i < length; i++) {
    state += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return state;
}

function getWhoopAuthUrl() {
  const clientId = process.env.NEXT_PUBLIC_WHOOP_CLIENT_ID!;
  const redirectUri = process.env.NEXT_PUBLIC_WHOOP_REDIRECT_URI!;
  return `https://api.prod.whoop.com/oauth/oauth2/authenticate?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=read`;
}

export default function MintPage() {
  const router = useRouter();
  const { rewardState } = useRewardState();
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

  // --- AUTH & LOCAL USER LOAD ---
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
      } else {
        setUser(parsed);
      }
    } catch (e) {
      console.error("Failed to parse stored user", e);
      setError("Invalid user data. Please re-onboard.");
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Try to get the email from user object
  const email = user?.email || "";

  useEffect(() => {
    async function fetchWhoop() {
      setWhoopLoading(true);
      setWhoopError(null);
      try {
        const res = await fetch("/api/whoop-data");
        if (!res.ok) throw new Error("Failed to fetch WHOOP data.");
        const json = await res.json();
        setWhoopData(json);
      } catch (e: any) {
        setWhoopError(e.message || "Unknown error");
      }
      setWhoopLoading(false);
    }
    fetchWhoop();
  }, []);

  // Fetch user info from backend by email
  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/getUser?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [email]);

  // Live date/time update
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchWeather().then(setWeather);
  }, [user]);

  // --- dNFT fetch logic ---
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
    if (!user?.tokenId) return;
    setEvolving(true);
    await fetch(`/api/evolve?tokenId=${user.tokenId}`, { method: "POST" });
    const res = await fetch(`/api/nft-metadata?tokenId=${user.tokenId}`);
    const data = await res.json();
    setNftMeta(data);
    setEvolving(false);
  }

  const handleWhoopSync = () => {
    setWhoopSyncStatus("Opening WHOOP...");
    window.open(getWhoopAuthUrl(), "_blank", "width=500,height=700");
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

  // --- BEGIN: NAO SMART CHAT ADDITION ---
  const [threadId, setThreadId] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/thread", { method: "POST" })
      .then((res) => res.json())
      .then((data) => setThreadId(data.threadId))
      .catch(() => setThreadId(null));
  }, []);
  // Smart message handler for EchoAssistant
  const sendMessage = async (input: string) => {
    if (!threadId) return "NAO is initializing, please wait...";
    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          message: input,
          page: "mint",
          onboardingComplete: true,
        }),
      });
      const data = await res.json();
      if (data?.reply) {
        return data.reply;
      } else {
        return "NAO is thinking...";
      }
    } catch (err: any) {
      return "Network error: " + (err?.message || "Unknown error");
    }
  };
  // --- END: NAO SMART CHAT ADDITION ---

  if (loading) return <div>Loading your passport...</div>;
  if (error) return <div style={{ color: "red", padding: 20 }}>{error}</div>;
  if (!user) return <div>User not found. Please onboard again.</div>;

  const passportData = {
    username: user.username || "User",
    passportId: user.passportId || "N/A",
    xp: user.xp ?? 0,
    evolutionLevel: user.evolutionLevel ?? 1,
    nftImage: "/start_user_2nft.png",
    nftTitle: user.nftTitle || "NAO Health NFT",
    nftMeta: user.nftMeta || "Dynamic, evolving health record",
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

  // --- NEW: Workout Achieved Reward ---
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

  // XP goal for evolution (can be dynamic if needed)
  const xpGoal = 500;
  const xp = passportData.xp;
  const readyToEvolve = xp >= xpGoal;

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
      />

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
          {/* --- END VO2 Max Reward Card --- */}
        </div>
      </div>

      {/* RIGHT: RewardsTracker + dNFT Passport Card */}
      <div
        className="flex-1 flex justify-end items-center"
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <main
          className="w-full max-w-md mr-6 md:mr-14"
          style={{
            width: "100%",
            maxWidth: 420,
            marginRight: 34,
            position: "relative",
          }}
        >
          {/* 1. Show connected progress values */}
          <RewardsTracker
            state={{
              calories: caloriesBurned,
              workoutsCompleted: workoutAchieved ? 1 : 0,
              strainScore: whoopData?.strain?.score ?? 0,
              recoveryScore: whoopRecovery,
            }}
          />

          {/* 2. Show NFT art + evolution UI */}
          <section
            style={{
              borderRadius: 32,
              border: `2.5px solid ${BLUE}`,
              background: `linear-gradient(135deg, ${BLUE_BG} 70%, ${BLUE_DARK} 100%)`,
              boxShadow: `0 0 64px 10px ${BLUE_GLOW}, 0 0 16px 2px ${BLUE_SOFT}`,
              backdropFilter: "blur(18px)",
              padding: 36,
              minWidth: 320,
              maxWidth: 420,
              margin: "auto",
              textAlign: "center",
              marginTop: 32,
            }}
          >
            <div style={{ marginBottom: 24 }}>
              <span style={{
                fontSize: 18,
                color: BLUE,
                fontWeight: 800,
                letterSpacing: 1,
                textShadow: `0 0 12px ${BLUE_GLOW}`,
                display: "block",
                marginBottom: 12,
              }}>
                Evolving NFT
              </span>
              <div
                style={{
                  borderRadius: 22,
                  border: `2.5px solid ${BLUE}`,
                  background: `rgba(0,0,0,0.45)`,
                  boxShadow: `0 0 28px 6px ${BLUE_GLOW}`,
                  margin: "0 auto 12px auto",
                  width: 180,
                  height: 180,
                  padding: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={
                    nftMeta && nftMeta.image
                      ? nftMeta.image
                      : passportData.nftImage
                  }
                  alt={nftMeta?.name || "Starter dNFT"}
                  style={{
                    borderRadius: 18,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
              <div style={{
                color: BLUE,
                fontWeight: 700,
                fontSize: 22,
                marginBottom: 2,
              }}>
                {nftMeta?.name || passportData.nftTitle}
              </div>
              <div style={{
                color: WHITE_SOFT,
                fontSize: 15,
                marginBottom: 10
              }}>
                {nftMeta?.description || passportData.nftMeta}
              </div>
              <div style={{
                margin: "12px auto 0 auto",
                fontSize: 15,
                borderRadius: 999,
                background: `${BLUE_GLOW}33`,
                padding: "6px 20px",
                color: BLUE,
                fontWeight: 800,
                boxShadow: `0 0 12px 2px ${BLUE_SOFT}`,
                letterSpacing: "0.06em",
                display: "inline-block"
              }}>
                Evolution Level: {nftMeta?.attributes?.find(a => a.trait_type === "Level")?.value ?? passportData.evolutionLevel}
              </div>
              <div style={{ marginTop: 18 }}>
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
                  }}
                  onClick={handleEvolve}
                  disabled={evolving}
                >
                  {evolving ? "Evolving..." : "Evolve NFT"}
                </button>
              </div>
            </div>
            <div style={{ margin: "34px 0 12px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ color: WHITE_SOFT, fontWeight: 600, letterSpacing: 1 }}>Name</span>
                <span style={{ color: "#fff", fontWeight: 700 }}>{passportData.username}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ color: WHITE_SOFT, fontWeight: 600, letterSpacing: 1 }}>Passport ID</span>
                <span style={{ color: BLUE_SOFT, fontFamily: "monospace", fontWeight: 600 }}>{passportData.passportId}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ color: WHITE_SOFT, fontWeight: 600, letterSpacing: 1 }}>XP</span>
                <span style={{ color: BLUE, fontWeight: 800 }}>{passportData.xp}</span>
              </div>
            </div>
            {/* Placeholder NFT Preview and Celebrate Button */}
            <div style={{
              marginTop: 28,
              marginBottom: 0,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}>
              <div style={{
                width: 220,
                height: 220,
                background: "linear-gradient(145deg, #00fff9aa, #1267daa0)",
                borderRadius: 20,
                boxShadow: "0 0 20px #00fff9aa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: "bold",
                color: "#fff",
                textAlign: "center",
                padding: 20,
                marginBottom: 22
              }}>
                NFT Preview Coming Soon
              </div>
              <button
                onClick={() => alert("🎉 Mint logic coming soon")}
                style={{
                  padding: "12px 30px",
                  fontSize: 16,
                  borderRadius: 10,
                  background: "linear-gradient(90deg, #00fff9, #1267da)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 700,
                  boxShadow: "0 0 12px 3px #00fff9cc",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 0 18px 5px #00fff9cc";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 0 12px 3px #00fff9cc";
                }}
              >
                🚀 Celebrate My Mint
              </button>
            </div>
          </section>
        </main>
      </div>
      {/* Always-accessible Evolve NFT button (original) */}
      <EvolveActionBar onEvolve={handleEvolve} evolving={evolving} />

      {/* Always-accessible Evolve NFT XP Meter + Glow (ADDITION) */}
      <EvolveMeterActionBar
        onEvolve={handleEvolve}
        evolving={evolving}
        ready={passportData.xp >= 500}
        xp={passportData.xp}
        xpGoal={500}
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
            onSend={sendMessage} // <-- ADDED: connect smart chat!
          />
        </div>
      </div>
    </div>
  );
}