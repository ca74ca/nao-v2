import React from "react";
import { EngineSurgeBar } from "./EngineSurgeBar";

export const RewardsTracker: React.FC<{ state: any }> = ({ state }) => (
  <div style={{ width: "100%", marginBottom: 8 }}>
    {/* Burn Calories Progress */}
    <div style={{ marginBottom: 14, width: "100%" }}>
      <div style={{ fontWeight: 700, color: "#f6e27a", fontSize: 15, marginBottom: 2 }}>
        Burn Calories
      </div>
      <div style={{ fontSize: 12, color: "#f6e27a", marginBottom: 2 }}>
        {state.calories || 0} / 600 kcal
      </div>
      <div style={{
        background: "#fff8dc",
        borderRadius: 12,
        height: 18,
        width: "100%",
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
      }}>
        <div style={{
          width: `${Math.min((state.calories || 0) / 600 * 100, 100)}%`,
          height: "100%",
          background: "#f6e27a",
          transition: "width 0.5s",
        }} />
      </div>
    </div>
    {/* System Recovery (Sleep Progress) */}
    <div style={{ marginBottom: 14, width: "100%" }}>
      <div style={{ fontWeight: 700, color: "#7ED6FF", fontSize: 15, marginBottom: 2 }}>
        System Recovery
      </div>
      <div style={{ fontSize: 12, color: "#7ED6FF", marginBottom: 2 }}>
        {state.recoveryScore ?? 0}% (WHOOP Sleep Recovery)
      </div>
      <div style={{
        background: "#e5f7ff",
        borderRadius: 12,
        height: 18,
        width: "100%",
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
      }}>
        <div style={{
          width: `${Math.min(state.recoveryScore ?? 0, 100)}%`,
          height: "100%",
          background: "linear-gradient(90deg, #7ED6FF 0%, #2D9CFF 100%)",
          transition: "width 0.5s, background 0.5s",
        }} />
      </div>
    </div>
    {/* Workout Goal Progress */}
    <div style={{ marginBottom: 14, width: "100%" }}>
      <div style={{ fontWeight: 700, color: "#00fff9", fontSize: 15, marginBottom: 2 }}>
        Workout Goal
      </div>
      <div style={{ fontSize: 12, color: "#00fff9", marginBottom: 2 }}>
        {state.workoutsCompleted || 0} / 1
      </div>
      <div style={{
        background: "#a6f6ff",
        borderRadius: 12,
        height: 18,
        width: "100%",
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
      }}>
        <div style={{
          width: `${Math.min((state.workoutsCompleted || 0) * 100, 100)}%`,
          height: "100%",
          background: "#00fff9",
          transition: "width 0.5s",
        }} />
      </div>
    </div>
    {/* Engine Surge (WHOOP Strain) - always below others */}
    <EngineSurgeBar strainScore={state.strainScore} />
  </div>
);