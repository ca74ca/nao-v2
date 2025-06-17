import React, { useState } from "react";

const naoBlue = "#2D9CFF";
const darkBg = "#10141A";
const neonGlow = "0 0 12px #2D9CFF, 0 0 6px #60C6FF";

export default function ActionBar() {
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        zIndex: 100,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 18,
        padding: "0.75rem 2.5rem",
        boxSizing: "border-box",
        background: "rgba(15,22,40,0.81)",
        backdropFilter: "blur(18px)",
        borderBottom: `2px solid ${naoBlue}`,
        boxShadow: neonGlow,
        fontFamily: "'Orbitron', 'Consolas', 'Arial', monospace",
      }}
    >
      <div
        style={{
          marginRight: 28,
          padding: "10px 34px",
          borderRadius: 14,
          background: "rgba(22,28,50,0.8)",
          color: naoBlue,
          fontWeight: 700,
          fontSize: "1.15rem",
          letterSpacing: "0.08em",
          border: `2px solid ${naoBlue}`,
          boxShadow: neonGlow,
          textAlign: "center",
          textTransform: "uppercase",
          fontFamily: "'Orbitron', 'Consolas', 'Arial', monospace",
          textShadow: "0 0 16px #2D9CFF, 0 0 4px #60C6FF",
          transition: "box-shadow 0.25s",
        }}
      >
        Welcome to NAO
      </div>

      {!loggedIn ? (
        <ActionButton onClick={() => setLoggedIn(true)} label="Log In to NAO" />
      ) : (
        <ActionButton onClick={() => setLoggedIn(false)} label="Log Out" />
      )}
      <ActionButton onClick={() => alert("Support coming soon!")} label="Need Help?" />
      <ActionButton onClick={() => alert("Workout started!")} label="Start Session" />
      <ActionButton onClick={() => alert("Device sync coming soon!")} label="Sync Wearable" />
    </div>
  );
}

function ActionButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 28px",
        borderRadius: 14,
        background: "rgba(25,36,70,0.72)",
        color: "#AFFCFF",
        fontWeight: 700,
        fontSize: "1rem",
        border: `2px solid #2D9CFF`,
        boxShadow: "0 0 10px #2D9CFF44, 0 0 2px #2D9CFF",
        letterSpacing: "0.07em",
        fontFamily: "'Orbitron', 'Consolas', 'Arial', monospace",
        textShadow: "0 0 12px #2D9CFF, 0 0 6px #60C6FF",
        cursor: "pointer",
        outline: "none",
        marginLeft: 0,
        marginRight: 0,
        transition: "background 0.2s, box-shadow 0.2s, color 0.2s",
      }}
      onMouseOver={e => {
        e.currentTarget.style.background = "#2D9CFF";
        e.currentTarget.style.color = "#10141A";
        e.currentTarget.style.boxShadow = "0 0 24px #2D9CFF, 0 0 8px #60C6FF";
      }}
      onMouseOut={e => {
        e.currentTarget.style.background = "rgba(25,36,70,0.72)";
        e.currentTarget.style.color = "#AFFCFF";
        e.currentTarget.style.boxShadow = "0 0 10px #2D9CFF44, 0 0 2px #2D9CFF";
      }}
      onMouseDown={e => {
        e.currentTarget.style.background = "#60C6FF";
        e.currentTarget.style.color = "#10141A";
      }}
      onMouseUp={e => {
        e.currentTarget.style.background = "#2D9CFF";
        e.currentTarget.style.color = "#10141A";
      }}
    >
      {label}
    </button>
  );
}