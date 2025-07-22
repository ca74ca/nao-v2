import React, { useEffect, useState } from "react";

const sampleFeed = [
  "@user234: 10 NAO Coins",
  "@michelle1: +1 Stablecoin",
  "@gymratx: 500 Calories Burned",
  "@mover34: 2 PRs Today",
  "@user985: 300 Calories Burned",
  "@trainharder: 20 NAO Coins Earned",
];

const LeftColumnLiveFeed = () => {
  const [feedIndex, setFeedIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFeedIndex((prevIndex) => (prevIndex + 1) % sampleFeed.length);
    }, 2000); // Every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        padding: "1rem",
        color: "#cceeff",
        fontSize: "0.85rem",
        lineHeight: "1.5",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        border: "1px solid #333",
        borderRadius: "12px",
        backgroundColor: "#0e192a",
      }}
    >
      <div>
        <p style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Today's XP Live</p>
        <p>XP Burned: <strong>1,253,892</strong></p>
        <p>Live Challenge:</p>
        <p>Burn 500 cal, Zone 5 for 5 min</p>
        <p>+15 XP</p>
      </div>

      <div style={{ borderTop: "1px solid #333", paddingTop: "1rem" }}>
        <p style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Live Activity</p>
        <div
          style={{
            minHeight: "2rem",
            transition: "all 0.3s ease-in-out",
          }}
        >
          {sampleFeed[feedIndex]}
        </div>
      </div>
    </div>
  );
};

export default LeftColumnLiveFeed;

     