import React from "react";
import { useRouter } from "next/router";

export default function DevPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at center, #000 40%, #111 100%)",
        color: "#fff",
        padding: "4rem 2rem",
        fontFamily: "Inter, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      {/* Header Title */}
      <h1 style={{ fontSize: "2.75rem", fontWeight: 800, marginBottom: "1rem" }}>
        NAO’s EVE Engine
      </h1>

      {/* Subheadline */}
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 500,
          marginBottom: "2.5rem",
          maxWidth: 720,
          color: "#ccc",
          lineHeight: 1.5,
        }}
      >
        Quantify Human Effort. Unmask AI Content.
      </h2>

      {/* CTA */}
      <button
        onClick={() => router.push("/get-started")}
        style={{
          padding: "1rem 2rem",
          background: "linear-gradient(to right, #39FF14, #00ffcc)",
          borderRadius: "999px",
          color: "#000",
          fontWeight: 700,
          fontSize: "1rem",
          cursor: "pointer",
          border: "none",
          boxShadow: "0 0 20px #00ffcc",
          transition: "transform 0.2s ease-in-out",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        Get API Key
      </button>
    </div>
  );
}
