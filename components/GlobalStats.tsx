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
  });

  const [eveIQ, setEveIQ] = useState(0);
  const [clock, setClock] = useState<string>("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/getFraudStats");
        const data = await res.json();
        setStats({
          aiReviewsFlagged: data.aiReviewsFlagged ?? 0,
          fakeViewsBlocked: data.fakeViewsBlocked ?? 0,
          realCreatorBlocks: data.realCreatorBlocks ?? 0,
          aiPostsFlagged: data.aiPostsFlagged ?? 0,
          cheatsDetected: data.cheatsDetected ?? 0,
          referralsBlocked: data.referralsBlocked ?? 0,
          fakeContribsFlagged: data.fakeContribsFlagged ?? 0,
          lowEffortPostsBlocked: data.lowEffortPostsBlocked ?? 0,
          verifiedEffortEvents: data.verifiedEffortEvents ?? 0,
          effortScoreRequests: data.effortScoreRequests ?? 0,
          fraudDollarsSaved: data.fraudDollarsSaved ?? 0,
          viewsPrevented: data.viewsPrevented ?? 0,
        });
        setEveIQ(calculateEVEIQ(data));
      } catch (err) {
        console.error("Failed to fetch live stats", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setClock(timeString);
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
        <StatBlock label="Fraud Dollars Saved" value={`$${safeNumber(stats.fraudDollarsSaved)}`} />
        <StatBlock label="AI Reviews Flagged" value={safeNumber(stats.aiReviewsFlagged)} />
        <StatBlock label="Fake Views Blocked" value={safeNumber(stats.fakeViewsBlocked)} />
        <StatBlock label="Fake Creators Blocked" value={safeNumber(stats.realCreatorBlocks)} />
        <StatBlock label="AI Posts Flagged" value={safeNumber(stats.aiPostsFlagged)} />
        <StatBlock label="AI Cheating Caught" value={safeNumber(stats.cheatsDetected)} />
        <StatBlock label="Fake Referrals Stopped" value={safeNumber(stats.referralsBlocked)} />
        <StatBlock label="DAO Farming Flagged" value={safeNumber(stats.fakeContribsFlagged)} />
        <StatBlock label="Low-Effort Content Blocked" value={safeNumber(stats.lowEffortPostsBlocked)} />
        <StatBlock label="Verified Effort Events" value={safeNumber(stats.verifiedEffortEvents)} />
        <StatBlock label="Effort Score Requests" value={safeNumber(stats.effortScoreRequests)} />
        <StatBlock label="Views Prevented" value={safeNumber(stats.viewsPrevented)} />
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: "-1rem",
          fontSize: "1rem",
          color: "#00FF00",
          fontFamily: "monospace",
          letterSpacing: "1.5px",
        }}
      >
        {clock}
      </div>

      {/* Recipes Section */}
      <div
        style={{
          marginTop: "3rem",
          padding: "2rem",
          borderTop: "1px solid #333",
          fontFamily: "Inter, sans-serif",
          color: "#CCCCCC",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", color: "#39FF14" }}>
          Effort Verification Recipes
        </h2>

        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
            Reddit:
            <span style={{ marginLeft: "0.5rem", color: "#FF5555" }}>
              Block karma farming bots & AI-written advice
            </span>
          </h3>
          <ul style={{ marginLeft: "1rem", fontSize: "0.9rem", lineHeight: "1.5" }}>
            <li>❌ Flags GPT-written replies used for karma farming</li>
            <li>❌ Detects repeat posting patterns across subreddits</li>
            <li>❌ Blocks fake reviews or “sockpuppet” brand mentions</li>
            <li>✅ Protects genuine community contributions</li>
            <li>✅ Saves brands and moderators from AI-fueled manipulation</li>
          </ul>
        </div>

        <div>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
            YouTube Shorts:
            <span style={{ marginLeft: "0.5rem", color: "#FF5555" }}>
              Spot cloned videos & stolen content
            </span>
          </h3>
          <ul style={{ marginLeft: "1rem", fontSize: "0.9rem", lineHeight: "1.5" }}>
            <li>❌ Detects re-uploaded footage across channels</li>
            <li>❌ Flags AI voiceovers reading stolen scripts</li>
            <li>❌ Identifies engagement boosts from click farms</li>
            <li>✅ Prevents monetization of non-original content</li>
            <li>✅ Supports creator IP protection</li>
          </ul>
        </div>
      </div>
    </>
  );
};

// Helper for safe number formatting with fallback
function safeNumber(value: any): string {
  return typeof value === "number" && !isNaN(value)
    ? value.toLocaleString()
    : "0";
}

const StatBlock = ({ label, value }: { label: string; value: number | string }) => (
  <div
    style={{
      background: "#0b0b0b",
      border: "1px solid #1f1f1f",
      borderRadius: "12px",
      padding: "1.25rem",
      textAlign: "center",
      boxShadow: "0 0 10px rgba(57, 255, 20, 0.3)",
      transition: "all 0.3s ease-in-out",
    }}
  >
    <h2
      style={{
        fontSize: "2rem",
        fontWeight: 700,
        marginBottom: "0.4rem",
        color: "#eaf5e8",
        textShadow: "0 0 10px rgba(248, 251, 248, 0.6)",
      }}
    >
      {typeof value === "number" && !isNaN(value) ? value.toLocaleString() : value}
    </h2>
    <p style={{ fontSize: "0.9rem", opacity: 0.85 }}>{label}</p>
  </div>
);

function calculateEVEIQ(data: any): number {
  const {
    aiReviewsFlagged = 0,
    fakeViewsBlocked = 0,
    realCreatorBlocks = 0,
    aiPostsFlagged = 0,
    cheatsDetected = 0,
    referralsBlocked = 0,
    fakeContribsFlagged = 0,
    lowEffortPostsBlocked = 0,
    verifiedEffortEvents = 0,
    effortScoreRequests = 0,
  } = data;

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