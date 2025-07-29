import React, { useEffect, useState } from "react";

const GlobalStats: React.FC = () => {
  const [stats, setStats] = useState({
    aiReviewsFlagged: 0,
    fakeViewsBlocked: 0,
    realCreatorBlocks: 0,
    aiPostsFlagged: 0,
    cheatsDetected: 0,
    referralsBlocked: 0,
    fakeContribsFlagged: 0,
    lowEffortPostsBlocked: 0,
    verifiedEffortEvents: 0,
    effortScoreRequests: 0,
    fraudDollarsSaved: 0,
    viewsPrevented: 0,
    eveIQ: 0,
  });

  const [clock, setClock] = useState<string>("");

  // 🧠 Pull backend + animate deltas
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/getFraudStats");
        const data = await res.json();

        if (!data || typeof data !== "object") return;

        setStats((prev) => {
          const newStats = { ...prev };
          for (const key in prev) {
            if (typeof data[key] === "number") {
              const delta = Math.max(1, Math.floor((data[key] - prev[key]) / 20));
              newStats[key] = prev[key] + delta;
            }
          }

          // Final EVE IQ
          newStats.eveIQ = calculateEVEIQ(newStats);
          return newStats;
        });
      } catch (err) {
        console.error("Error fetching fraud stats:", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // ⏱ Wall Street Ticker
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClock(
        now.toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const {
    aiReviewsFlagged,
    fakeViewsBlocked,
    realCreatorBlocks,
    aiPostsFlagged,
    cheatsDetected,
    referralsBlocked,
    fakeContribsFlagged,
    lowEffortPostsBlocked,
    verifiedEffortEvents,
    effortScoreRequests,
    fraudDollarsSaved,
    viewsPrevented,
    eveIQ,
  } = stats;

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "1.5rem",
          padding: "2rem",
          marginTop: "4rem",
          width: "100%",
          color: "#39FF14",
          fontFamily: "Inter, sans-serif",
          fontWeight: 500,
        }}
      >
        <StatBlock label="EVE Effort IQ Score" value={eveIQ} />
        <StatBlock label="💵 Fraud Dollars Saved" value={`$${fraudDollarsSaved.toLocaleString()}`} />
        <StatBlock label="🔒 Views Prevented" value={viewsPrevented} />
        <StatBlock label="AI Reviews Flagged" value={aiReviewsFlagged} />
        <StatBlock label="Fake Views Blocked" value={fakeViewsBlocked} />
        <StatBlock label="Fake Creators Blocked" value={realCreatorBlocks} />
        <StatBlock label="AI Posts Flagged" value={aiPostsFlagged} />
        <StatBlock label="AI Cheating Caught" value={cheatsDetected} />
        <StatBlock label="Fake Referrals Stopped" value={referralsBlocked} />
        <StatBlock label="DAO Farming Flagged" value={fakeContribsFlagged} />
        <StatBlock label="Low-Effort Content Blocked" value={lowEffortPostsBlocked} />
        <StatBlock label="Verified Effort Events" value={verifiedEffortEvents} />
        <StatBlock label="Effort Score Requests" value={effortScoreRequests} />
      </div>

      <div style={{ textAlign: "center", marginTop: "-1rem", fontSize: "0.9rem", color: "#ffffffcc", fontFamily: "monospace", letterSpacing: "0.5px" }}>
        Last updated: {clock}
      </div>
    </>
  );
};

const StatBlock = ({ label, value }: { label: string; value: number | string }) => (
  <div
    style={{
      background: "rgba(0, 0, 0, 0.6)",
      border: "1px solid #1f1f1f",
      borderRadius: "16px",
      padding: "1.5rem",
      textAlign: "center",
      boxShadow: "0 0 12px rgba(57, 255, 20, 0.4)",
      transition: "all 0.3s ease-in-out",
    }}
  >
    <h2
      style={{
        fontSize: "2rem",
        fontWeight: 700,
        marginBottom: "0.5rem",
        color: "#eaf5e8",
        textShadow: "0 0 12px rgba(248, 251, 248, 0.7)",
      }}
    >
      {typeof value === "number" ? value.toLocaleString() : value}
    </h2>
    <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>{label}</p>
  </div>
);

function calculateEVEIQ(stats: any): number {
  const effortComponent = stats.verifiedEffortEvents * 1.0 + stats.effortScoreRequests * 0.25;
  const fraudComponent =
    stats.aiReviewsFlagged * 3.5 +
    stats.fakeViewsBlocked * 0.01 +
    stats.realCreatorBlocks * 7.5 +
    stats.aiPostsFlagged * 0.012 +
    stats.cheatsDetected * 15.0 +
    stats.referralsBlocked * 5.0 +
    stats.fakeContribsFlagged * 2.5 +
    stats.lowEffortPostsBlocked * 0.75;
  const rawScore = effortComponent + fraudComponent;
  return Math.min(100, Math.floor((rawScore / 1000) * 100));
}

export default GlobalStats;
