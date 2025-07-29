import React, { useEffect, useState } from "react";

const GlobalStats: React.FC = () => {
  const [aiReviewsFlagged, setAiReviewsFlagged] = useState(0);
  const [fakeViewsBlocked, setFakeViewsBlocked] = useState(0);
  const [realCreatorBlocks, setRealCreatorBlocks] = useState(0);
  const [aiPostsFlagged, setAiPostsFlagged] = useState(0);
  const [cheatsDetected, setCheatsDetected] = useState(0);
  const [referralsBlocked, setReferralsBlocked] = useState(0);
  const [fakeContribsFlagged, setFakeContribsFlagged] = useState(0);
  const [lowEffortPostsBlocked, setLowEffortPostsBlocked] = useState(0);
  const [verifiedEffortEvents, setVerifiedEffortEvents] = useState(0);
  const [effortScoreRequests, setEffortScoreRequests] = useState(0);
  const [eveIQ, setEveIQ] = useState(0);
  const [clock, setClock] = useState<string>("");

  // ✅ Fetch live fraud stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/getFraudStats");
        const data = await res.json();

        setAiReviewsFlagged(data.aiReviewsFlagged || 0);
        setFakeViewsBlocked(data.fakeViewsBlocked || 0);
        setRealCreatorBlocks(data.realCreatorBlocks || 0);
        setAiPostsFlagged(data.aiPostsFlagged || 0);
        setCheatsDetected(data.cheatsDetected || 0);
        setReferralsBlocked(data.referralsBlocked || 0);
        setFakeContribsFlagged(data.fakeContribsFlagged || 0);
        setLowEffortPostsBlocked(data.lowEffortPostsBlocked || 0);
        setVerifiedEffortEvents(data.verifiedEffortEvents || 0);
        setEffortScoreRequests(data.effortScoreRequests || 0);

        setEveIQ(calculateEVEIQ(data));
      } catch (error) {
        console.error("Failed to fetch fraud stats:", error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // ⏱ Clock ticker
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      };
      setClock(now.toLocaleString("en-US", options));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

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

      <div
        style={{
          textAlign: "center",
          marginTop: "-1rem",
          fontSize: "0.9rem",
          color: "#ffffffcc",
          fontFamily: "monospace",
          letterSpacing: "0.5px",
        }}
      >
        Last updated: {clock}
      </div>
    </>
  );
};

// 💡 Neon stat card
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

// 🧠 Scoring logic
function calculateEVEIQ({
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
}: any): number {
  const effortComponent = verifiedEffortEvents * 1.0 + effortScoreRequests * 0.25;

  const fraudComponent =
    aiReviewsFlagged * 3.5 +
    fakeViewsBlocked * 0.01 +
    realCreatorBlocks * 7.5 +
    aiPostsFlagged * 0.012 +
    cheatsDetected * 15.0 +
    referralsBlocked * 5.0 +
    fakeContribsFlagged * 2.5 +
    lowEffortPostsBlocked * 0.75;

  const rawScore = effortComponent + fraudComponent;
  return Math.min(100, Math.floor((rawScore / 1000) * 100));
}

export default GlobalStats;
