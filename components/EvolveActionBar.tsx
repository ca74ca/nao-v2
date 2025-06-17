import React from "react";

const BLUE = "#2D9CFF";
const BLUE_GLOW = "#60C6FF";

export default function EvolveActionBar({
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
    <div
      style={{
        position: "fixed",
        right: 32,
        bottom: 32,
        zIndex: 50,
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
      }}
    >
      <div
        style={{
          marginBottom: 14,
          width: 260,
        }}
      >
        <div style={{ color: "#fff", marginBottom: 4, fontWeight: 700 }}>
          {xp} / {xpGoal} XP until next evolution
        </div>
        <div
          style={{
            height: 13,
            width: "100%",
            borderRadius: 7,
            background: "#132c48",
            overflow: "hidden",
            boxShadow: "0 0 8px #60C6FF33",
          }}
        >
          <div
            style={{
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
            }}
          />
        </div>
      </div>
      <button
        onClick={onEvolve}
        disabled={evolving || !ready}
        style={{
          padding: "16px 44px",
          borderRadius: 999,
          background: ready ? BLUE : "#aaa",
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