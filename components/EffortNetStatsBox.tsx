import React, { useEffect, useState } from "react";

export default function EffortNetStatsBox() {
  const [stats, setStats] = useState<null | {
    fraudDollarsSaved: number;
    fakeTiktoksBlocked: number;
    fakeReviewsDetected: number;
    aiSpamCommentsBlocked: number;
    verifiedHumanEffort: number;
    clonedContentFlagged: number;
    viewsPrevented: number;
    effortApiCalls: number;
  }>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/fraud-stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("EffortNet stats fetch failed:", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  const statBlocks = [
    { title: "Fraud Dollars Saved", value: `$${stats.fraudDollarsSaved.toLocaleString()}`, icon: "💵" },
    { title: "Fake TikToks Blocked", value: stats.fakeTiktoksBlocked.toLocaleString(), icon: "📹" },
    { title: "Fake Reviews Detected", value: stats.fakeReviewsDetected.toLocaleString(), icon: "🛒" },
    { title: "AI-Spam Comments Blocked", value: stats.aiSpamCommentsBlocked.toLocaleString(), icon: "💬" },
    { title: "Verified Human Effort", value: stats.verifiedHumanEffort.toLocaleString(), icon: "🧠" },
    { title: "Cloned Content Flagged", value: stats.clonedContentFlagged.toLocaleString(), icon: "🔁" },
    { title: "Views Prevented from Fraud", value: stats.viewsPrevented.toLocaleString(), icon: "👁️" },
    { title: "Effort Scoring Requests", value: stats.effortApiCalls.toLocaleString(), icon: "📈" },
  ];

  return (
    <div
      className="w-full max-w-6xl mx-auto p-6 rounded-2xl shadow-lg border border-gray-800"
      style={{
        background: "#0e0e0e",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "2rem",
      }}
    >
      {statBlocks.map((stat, i) => (
        <div key={i} style={{ textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: "2rem" }}>{stat.icon}</div>
          <h2 style={{ fontSize: "1.5rem", marginTop: "0.25rem" }}>{stat.value}</h2>
          <p style={{ fontSize: "0.9rem", color: "#ccc", marginTop: "0.25rem" }}>{stat.title}</p>
        </div>
      ))}
    </div>
  );
}
