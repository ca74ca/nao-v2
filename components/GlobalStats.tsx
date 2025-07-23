import React, { useEffect, useState } from "react";

const GlobalStats: React.FC = () => {
  const [workouts, setWorkouts] = useState(15522);
  const [weightLifted, setWeightLifted] = useState(10944070);
  const [hrZones, setHRZones] = useState(76468);
  const [xpEarned, setXPEarned] = useState(482611);
  const [clock, setClock] = useState<string>("");

  // Static B2B metrics (non-animated)
  const verifiedWorkouts = 11882;
  const usersActivated = 1874;
  const evolvedRewards = 6421;
  const ethPaid = 9.31;
  const stablecoinUSD = 12844;
  const chainInteractions = 14233;

  // Animate legacy stats
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkouts((prev) => prev + Math.floor(Math.random() * 3));
      setWeightLifted((prev) => prev + Math.floor(Math.random() * 100));
      setHRZones((prev) => prev + Math.floor(Math.random() * 2));
      setXPEarned((prev) => prev + Math.floor(Math.random() * 10));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Wall Street-style time ticker
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
        {/* Animated legacy stats */}
        <StatBlock label="Workouts Completed" value={workouts} />
        <StatBlock label="LBS Lifted Total" value={weightLifted} />
        <StatBlock label="HR Zone Hours" value={hrZones} />
        <StatBlock label="XP Earned" value={xpEarned} />

        {/* New B2B static stats */}
        <StatBlock label="Verified Workouts" value={verifiedWorkouts} />
        <StatBlock label="Users Activated" value={usersActivated} />
        <StatBlock label="dNFTs Evolved" value={evolvedRewards} />
        <StatBlock label="ETH Paid Out" value={`Ξ${ethPaid}`} />
        <StatBlock label="Stablecoin USD Delivered" value={`$${stablecoinUSD.toLocaleString()}`} />
        <StatBlock label="Smart Contract Calls" value={chainInteractions} />
      </div>

      {/* Wall Street-style timestamp */}
      <div style={{
        textAlign: "center",
        marginTop: "-1rem",
        fontSize: "0.9rem",
        color: "#ffffffcc",
        fontFamily: "monospace",
        letterSpacing: "0.5px"
      }}>
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

export default GlobalStats;
