import React, { useEffect, useState } from "react";

const GlobalStats: React.FC = () => {
  const [workouts, setWorkouts] = useState(15230);
  const [weightLifted, setWeightLifted] = useState(10928450);
  const [hrZones, setHRZones] = useState(76320);
  const [xpEarned, setXPEarned] = useState(481290);

  // Simulate live increase
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkouts((prev) => prev + Math.floor(Math.random() * 3));
      setWeightLifted((prev) => prev + Math.floor(Math.random() * 100));
      setHRZones((prev) => prev + Math.floor(Math.random() * 2));
      setXPEarned((prev) => prev + Math.floor(Math.random() * 10));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "1.5rem",
        padding: "2rem",
        marginTop: "4rem",
        width: "100%",
        color: "#e0e0e0",
        fontFamily: "Inter, sans-serif",
        fontWeight: 500,
      }}
    >
      <StatBlock label="Workouts Completed" value={workouts} />
      <StatBlock label="LBS Lifted Total" value={weightLifted} />
      <StatBlock label="HR Zone Hours" value={hrZones} />
      <StatBlock label="XP Earned" value={xpEarned} />
    </div>
  );
};

const StatBlock = ({ label, value }: { label: string; value: number }) => (
  <div
    style={{
      background: "rgba(255, 255, 255, 0.05)",
      border: "1px solid #333",
      borderRadius: "16px",
      padding: "1.5rem",
      textAlign: "center",
      boxShadow: "0 0 8px rgba(0, 255, 249, 0.2)",
    }}
  >
    <h2
      style={{
        fontSize: "2rem",
        fontWeight: 700,
        marginBottom: "0.5rem",
        color: "#00fff9",
        textShadow: "0 0 8px #00fff9aa",
      }}
    >
      {value.toLocaleString()}
    </h2>
    <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>{label}</p>
  </div>
);

export default GlobalStats;
