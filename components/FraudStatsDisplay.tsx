import React from "react";
import { useFraudState } from "../src/hooks/useFraudState";

export default function FraudStatsDisplay() {
  const stats = useFraudState();

  if (!stats) return null;

  const statBlocks = [
    {
      title: "Fraud Dollars Saved",
      value: `$${stats.fraudDollarsSaved.toLocaleString()}`,
      color: "text-green-500",
    },
    {
      title: "Fake TikToks Blocked",
      value: stats.fakeTiktoksBlocked.toLocaleString(),
      color: "text-red-500",
    },
    {
      title: "Fraud Views Prevented",
      value: stats.viewsPrevented.toLocaleString(),
      color: "text-red-500",
    },
  ];

  return (
    <div
      className="nao-echo-container"
      style={{
        display: "flex",
        gap: "2rem",
        padding: "2rem",
        background: "#181818",
        borderRadius: "1rem",
        color: "#39FF14",
        fontFamily: "Inter, sans-serif",
        fontWeight: 500,
        justifyContent: "center",
      }}
    >
      <div className="nao-echo-inner" style={{ display: "flex", gap: "2rem", flex: 1 }}>
        {statBlocks.map((block) => (
          <div
            key={block.title}
            style={{
              background: "rgba(0,0,0,0.7)",
              border: "1px solid #333",
              borderRadius: "16px",
              padding: "2rem",
              textAlign: "center",
              minWidth: 150,
              flex: 1,
            }}
            className={block.color}
          >
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
                color: "inherit",
                textShadow: "0 0 12px rgba(248,251,248,0.7)",
              }}
            >
              {block.value}
            </div>
            <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>{block.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
