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
  // WHOOP integration props (for future use)
  whoopData?: any;
  whoopLoading?: boolean;
  whoopError?: string | null;
};

const BLUE = "#2D9CFF";
const BLUE_SOFT = "#2D9CFFDD";
const WHITE_SOFT = "rgba(255,255,255,0.7)";
const GREEN = "#22c55e";

export default function DailyOutlook({
  date,
  forecast,
  temperature,
  rewards,
  caloriesBurned = 0,
  calorieGoal = 1,
  workoutComplete = false,
  xp = 0,
  xpGoal = 1,
}: DailyOutlookProps) {
  const safeCalorieGoal = calorieGoal > 0 ? calorieGoal : 1;
  const safeXpGoal = xpGoal > 0 ? xpGoal : 1;

  const caloriePct = Math.min(1, Math.max(0, caloriesBurned / safeCalorieGoal));
  const xpPct = Math.min(1, Math.max(0, xp / safeXpGoal));

  return (
    <div className="w-full max-w-[525px] mx-auto mb-8">
      <div
        className="rounded-2xl bg-black/40"
        style={{
          marginBottom: 36,
          background: "rgba(45,156,255,0.09)",
          padding: "28px",
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
                      background: reward.available === false ? "#e0e0e0" : "#fff",
                      border: `1.5px solid ${BLUE_SOFT}`,
                      borderRadius: 14,
                      padding: "14px 22px",
                      boxShadow: reward.available === false ? "none" : `0 0 14px 2px ${BLUE}`,
                      cursor: reward.available === false ? "not-allowed" : "pointer",
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
                        {reward.title}
                        {reward.limitedTime && (
                          <span style={{ fontSize: 15, color: "#E67E22", marginLeft: 8 }}>⏰ Limited!</span>
                        )}
                      </div>
                      <div style={{ fontSize: 15, color: "#444" }}>{reward.description}</div>
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

      <div className="flex flex-col gap-10 w-full max-w-[525px] mx-auto">
        {/* Burn Calories */}
        <div className={`w-full rounded-2xl bg-black/30 p-8 ${caloriePct >= 0.8 && caloriePct < 1 ? "animate-pulse" : ""}`}>
          <div className="flex items-center mb-3">
            <span className="text-3xl mr-3">🔥</span>
            <span className="font-semibold text-white/90 text-xl">Burn Calories</span>
          </div>
          <div className="text-base text-white/80 mb-4">
            Progress: <span style={{ color: BLUE }}>{caloriesBurned} / {safeCalorieGoal} kcal</span>
          </div>
          <div role="progressbar" aria-valuenow={Math.round(caloriePct * 100)} aria-valuemin={0} aria-valuemax={100} className="w-full relative h-5 rounded-full bg-black/80 mt-2 mb-1 overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.round(caloriePct * 100)}%`,
                background: caloriePct >= 1 ? GREEN : BLUE,
                boxShadow: caloriePct >= 1 ? "0 0 18px 6px #22c55e" : "0 0 18px 6px #2D9CFF",
                border: "1.5px solid #fff8",
              }}
            />
          </div>
        </div>

        {/* Workout Completion */}
        <div className={`w-full rounded-2xl bg-black/30 p-8 ${workoutComplete ? "animate-pulse" : ""}`}>
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
          <div role="progressbar" aria-valuenow={workoutComplete ? 100 : 0} aria-valuemin={0} aria-valuemax={100} className="w-full relative h-5 rounded-full bg-black/80 mt-2 mb-1 overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
              style={{
                width: workoutComplete ? "100%" : "0%",
                background: workoutComplete ? GREEN : BLUE,
                boxShadow: workoutComplete ? "0 0 18px 6px #22c55e" : "0 0 18px 6px #2D9CFF",
                border: "1.5px solid #fff8",
              }}
            />
          </div>
        </div>

        {/* Energy Credits Progress */}
        <div className={`w-full rounded-2xl bg-black/30 p-8 ${xpPct >= 0.8 && xpPct < 1 ? "animate-pulse" : ""} ${xpPct >= 1 ? "ring-4 ring-green-400/70" : ""}`}>
          <div className="flex items-center mb-3">
            <span className="text-3xl mr-3">🎁</span>
            <span className="font-semibold text-white/90 text-xl">Reward Progress</span>
          </div>
          <div className="text-base text-white/80 mb-4">
            {xpPct >= 1 ? (
              <span style={{ color: GREEN, fontWeight: 700 }}>
                {xp} / {safeXpGoal} Energy Credits — <span className="text-green-400">Reward ready to redeem!</span>
              </span>
            ) : (
              <>
                <span style={{ color: BLUE }}>{xp} / {safeXpGoal} Energy Credits</span>
                {xpPct >= 0.8 && (
                  <span className="ml-3 text-[#2D9CFF] animate-pulse">Almost there!</span>
                )}
              </>
            )}
          </div>
          <div role="progressbar" aria-valuenow={Math.round(xpPct * 100)} aria-valuemin={0} aria-valuemax={100} className="w-full relative h-5 rounded-full bg-black/80 mt-2 mb-1 overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.round(xpPct * 100)}%`,
                background: xpPct >= 1 ? GREEN : BLUE,
                boxShadow: xpPct >= 1 ? "0 0 18px 6px #22c55e" : "0 0 18px 6px #2D9CFF",
                border: "1.5px solid #fff8",
              }}
            />
          </div>

          <div className="mt-4 text-sm text-gray-300">
            🪙 <strong>Next $NAO Reward Unlock:</strong> {safeXpGoal} XP (You're at {xp} XP)
            <br />
            🎖️ <strong>Next NFT Evolution:</strong> Level 6 → <span className="text-cyan-200">Endurance+ Trait</span>
          </div>
        </div>
      </div>
    </div>
  );
}
