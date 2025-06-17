import React from "react";

type RewardOption = {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  cost: number;
  available?: boolean;
  limitedTime?: boolean;
  action: () => void;
};

type DailyOutlookProps = {
  date: string;
  forecast: string;
  temperature: number;
  rewards: RewardOption[];
  caloriesBurned?: number;
  calorieGoal?: number;
  workoutComplete?: boolean;
  xp?: number;
  xpGoal?: number;
  // 👇 Add these props to get WHOOP data from parent
  whoopData?: any;
  whoopLoading?: boolean;
  whoopError?: string | null;
};

const BLUE = "#2D9CFF";
const BLUE_SOFT = "#2D9CFFDD";
const WHITE_SOFT = "rgba(255,255,255,0.7)";
const BLUE_GLOW = "#60C6FF";
const GREEN = "#22c55e";

export default function DailyOutlook({
  date,
  forecast,
  temperature,
  rewards,
  caloriesBurned = 376,
  calorieGoal = 600,
  workoutComplete = true,
  xp = 410,
  xpGoal = 500,
  whoopData,
  whoopLoading,
  whoopError,
}: DailyOutlookProps) {
  // 👇 WHOOP DATA: Extract scores if available
  const recovery = whoopData?.recovery?.score ?? "--";
  const strain = whoopData?.strain?.score ?? "--";
  const sleep = whoopData?.sleep?.score ?? "--";

  const caloriePct = Math.min(1, caloriesBurned / calorieGoal);
  const xpPct = Math.min(1, xp / xpGoal);

  // Bluer at start, greener near completion
  const progressColor = (pct: number) =>
    pct >= 1
      ? GREEN
      : `linear-gradient(90deg, ${BLUE} 70%, ${GREEN} ${pct * 100}%)`;

  return (
    <div className="w-full max-w-[525px] mx-auto mb-8">
      {/* Main Card */}
      <div
        className="rounded-2xl bg-black/40"
        style={{
          marginBottom: 36,
          background: "rgba(45,156,255,0.09)",
          padding: "28px 28px 22px 28px",
          color: BLUE,
          textShadow: `0 0 14px ${BLUE_SOFT}`,
          fontWeight: 500,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 14 }}>
          Daily Outlook — {date}
        </div>
        <div style={{ fontSize: 18, color: WHITE_SOFT, marginBottom: 6 }}>
          Forecast: <span style={{ color: BLUE }}>{forecast}</span>
        </div>
        <div style={{ fontSize: 18, color: WHITE_SOFT, marginBottom: 18 }}>
          Temperature: <span style={{ color: BLUE }}>{temperature}°C</span>
        </div>

        {/* WHOOP LIVE DATA BLOCK */}
        <div style={{ marginBottom: 18, marginTop: 12 }}>
          <div style={{ fontWeight: 600, color: BLUE, fontSize: 17, marginBottom: 4 }}>
            WHOOP Live Scores
          </div>
          {whoopLoading ? (
            <div style={{ color: WHITE_SOFT }}>Loading WHOOP data…</div>
          ) : whoopError ? (
            <div style={{ color: "#ff5555" }}>Error: {whoopError}</div>
          ) : (
            <div style={{ display: "flex", gap: 18 }}>
              <div>
                <span style={{ fontWeight: 700, color: BLUE }}>Recovery:</span>{" "}
                <span>{recovery}</span>
              </div>
              <div>
                <span style={{ fontWeight: 700, color: BLUE }}>Strain:</span>{" "}
                <span>{strain}</span>
              </div>
              <div>
                <span style={{ fontWeight: 700, color: BLUE }}>Sleep:</span>{" "}
                <span>{sleep}</span>
              </div>
            </div>
          )}
        </div>
        {/* End WHOOP LIVE DATA BLOCK */}

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 9, color: BLUE, fontSize: 17 }}>
            Reward Options
          </div>
          {rewards.length === 0 ? (
            <div style={{ color: WHITE_SOFT }}>No rewards available today.</div>
          ) : (
            <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
              {rewards.map((reward) => (
                <li key={reward.id} style={{ marginBottom: 16 }}>
                  <button
                    onClick={reward.action}
                    disabled={reward.available === false}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background:
                        reward.available === false ? "#e0e0e0" : "#fff",
                      border: `1.5px solid ${BLUE_SOFT}`,
                      borderRadius: 14,
                      padding: "14px 22px",
                      boxShadow:
                        reward.available === false
                          ? "none"
                          : `0 0 14px 2px ${BLUE_GLOW}`,
                      cursor:
                        reward.available === false ? "not-allowed" : "pointer",
                      opacity: reward.available === false ? 0.6 : 1,
                      width: "100%",
                      textAlign: "left",
                      fontSize: 17,
                    }}
                  >
                    <span style={{ fontSize: 28, marginRight: 14 }}>
                      {reward.icon || "🎁"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: BLUE }}>
                        {reward.title}{" "}
                        {reward.limitedTime && (
                          <span
                            style={{
                              fontSize: 15,
                              color: "#E67E22",
                              marginLeft: 8,
                            }}
                          >
                            ⏰ Limited!
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 15, color: "#444" }}>
                        {reward.description}
                      </div>
                    </div>
                    <div
                      style={{
                        marginLeft: 18,
                        fontWeight: 700,
                        color: BLUE,
                        background: "#f4faff",
                        borderRadius: 10,
                        padding: "4px 13px",
                        fontSize: 15,
                      }}
                    >
                      {`${reward.cost} XP`}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {/* Enhanced Progress Modules */}
      <div className="flex flex-col gap-10 w-full max-w-[525px] mx-auto">
        {/* Burn Calories Tracker */}
        <div
          className={`
            w-full rounded-2xl bg-black/30 p-8
            motion-safe:animate-fadeIn
            ${caloriePct >= 0.8 && caloriePct < 1 ? "animate-pulse" : ""}
          `}
        >
          <div className="flex items-center mb-3">
            <span className="text-3xl mr-3">🔥</span>
            <span className="font-semibold text-white/90 text-xl">Burn Calories</span>
          </div>
          <div className="text-base text-white/80 mb-4">
            Progress: <span style={{ color: BLUE }}>{caloriesBurned} / {calorieGoal} kcal</span>
          </div>
          <div className="w-full relative h-5 rounded-full bg-black/80 mt-2 mb-1 overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.round(caloriePct * 100)}%`,
                background: caloriePct >= 1 ? GREEN : BLUE,
                boxShadow: caloriePct >= 1
                  ? "0 0 18px 6px #22c55e, 0 0 2px 0 #fff8"
                  : "0 0 18px 6px #2D9CFF, 0 0 2px 0 #fff8",
                border: "1.5px solid #fff8",
                transition: "width 0.3s, background 0.3s"
              }}
            />
          </div>
        </div>
        {/* Completed Workout Today */}
        <div
          className={`
            w-full rounded-2xl bg-black/30 p-8
            motion-safe:animate-fadeIn
            ${workoutComplete ? "animate-pulse" : ""}
          `}
        >
          <div className="flex items-center mb-3">
            <span className="text-3xl mr-3">{workoutComplete ? "✅" : "🏋️"}</span>
            <span className="font-semibold text-white/90 text-xl">Workout Goal</span>
            {workoutComplete && (
              <span className="ml-3 text-green-400 text-2xl font-bold animate-bounce">✔️</span>
            )}
          </div>
          <div className="text-base text-white/80 mb-4">
            Status: {workoutComplete ? (
              <span className="text-green-400 font-semibold">1 of 1 completed</span>
            ) : (
              <span>0 of 1 completed</span>
            )}
          </div>
          <div className="w-full relative h-5 rounded-full bg-black/80 mt-2 mb-1 overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
              style={{
                width: workoutComplete ? "100%" : "0%",
                background: workoutComplete ? GREEN : BLUE,
                boxShadow: workoutComplete
                  ? "0 0 18px 6px #22c55e, 0 0 2px 0 #fff8"
                  : "0 0 18px 6px #2D9CFF, 0 0 2px 0 #fff8",
                border: "1.5px solid #fff8",
              }}
            />
          </div>
        </div>
        {/* Energy Credits to Reward Bar */}
        <div
          className={`
            w-full rounded-2xl bg-black/30 p-8
            motion-safe:animate-fadeIn
            ${xpPct >= 0.8 && xpPct < 1 ? "animate-pulse" : ""}
            ${xpPct >= 1 ? "ring-4 ring-green-400/70" : ""}
          `}
        >
          <div className="flex items-center mb-3">
            <span className="text-3xl mr-3">🎁</span>
            <span className="font-semibold text-white/90 text-xl">Reward Progress</span>
          </div>
          <div className="text-base text-white/80 mb-4">
            {xpPct >= 1 ? (
              <span style={{ color: GREEN, fontWeight: 700 }}>
                {xp} / {xpGoal} Energy Credits — <span className="text-green-400">Reward ready to redeem!</span>
              </span>
            ) : (
              <>
                <span style={{ color: BLUE }}>{xp} / {xpGoal} Energy Credits</span>
                {xpPct >= 0.8 && (
                  <span className="ml-3 text-[#2D9CFF] animate-pulse">Almost there!</span>
                )}
              </>
            )}
          </div>
          <div className="w-full relative h-5 rounded-full bg-black/80 mt-2 mb-1 overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.round(xpPct * 100)}%`,
                background: xpPct >= 1 ? GREEN : BLUE,
                boxShadow: xpPct >= 1
                  ? "0 0 18px 6px #22c55e, 0 0 2px 0 #fff8"
                  : "0 0 18px 6px #2D9CFF, 0 0 2px 0 #fff8",
                border: "1.5px solid #fff8",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}