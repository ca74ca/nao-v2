import React, { useState } from "react";
// Using relative paths for component imports.
// This assumes 'index.tsx' is in 'pages/' and your components are in a 'components/' directory
// that is a direct sibling to the 'pages/' directory (i.e., both are under the project root).
import GlobalStats from "../components/GlobalStats";
import AuthModal from "../components/AuthModal";
import LeftColumnLiveFeed from "../components/LeftColumnLiveFeed";
import FraudStatsDisplay from "../components/FraudStatsDisplay"; // Your live meter component
import EffortNetStatsBox from "../components/EffortNetStatsBox";
import { useRouter } from "next/router"; // Standard Next.js import

export default function Home() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  // Define your highest impact metrics here for the headline and subheading.
  // These are the "shocking" numbers that grab attention immediately.
  // In a real application, these might be fetched from a high-level analytics API.
  const projectedEcommerceFraud2029 = "$107 Billion"; // Global E-commerce Fraud Losses by 2029
  const projectedAdFraud2028 = "$172 Billion";       // Digital Ad Fraud Losses by 2028
  const costPer100Fraud = "$207";                   // Cost multiplier: for every $100 of fraud, it costs $207
  const projectedAIFraud2027 = "$40 Billion";         // AI's Direct Financial Impact on US Financial Sector Fraud by 2027

  return (
    <>
      {/* Viewport Meta Tag for Mobile Responsiveness */}
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>

      {/* Full Screen Background */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundImage: "url('/index_background_4.png')",
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Main Layout Content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          minHeight: "100vh", // Ensures content pushes layout if it overflows viewport
          flexDirection: "column",
          fontFamily: "Inter, sans-serif", // Apply font globally
        }}
      >
        {/* Header - Sharp, direct, and financially impactful */}
        <header style={{ padding: "2rem 1.5rem 0", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <h1
            style={{
              color: "#f6fafaff",
              fontWeight: 800,
              fontSize: "clamp(1.5rem, 5vw, 2.75rem)", // Responsive font size
              letterSpacing: "0.05em",
              lineHeight: 1.2,
              maxWidth: "900px", // Limit width for readability
            }}
          >
            EVE: EffortIQ.
            <br />
            Stop the **{projectedEcommerceFraud2029}** AI Fraud Epidemic.
          </h1>
        </header>

        {/* Subheading - Reinforce the problem and introduce the unique solution */}
        <div
          style={{
            padding: "0 1.5rem 2rem",
            color: "#cceeff",
            fontWeight: 600,
            fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)", // Responsive font size
            textAlign: "center",
            maxWidth: "700px", // Limit width for readability
            margin: "1rem auto 0", // Center align
            lineHeight: 1.5,
          }}
        >
          AI-driven fraud is projected to cost industries **{projectedAdFraud2028}** in ad spend and **{projectedAIFraud2027}** in financial losses. For every $100 of fraud, it costs businesses **{costPer100Fraud}**.
          <br />
          EVE's unique **Human Effort Score** identifies genuine interactions, blocks sophisticated fakes, and recovers your wasted spending.
        </div>

        {/* Live Fraud Impact Meter (FraudStatsDisplay) - Placed prominently */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "2rem", // Adjust margin to position it well
            width: "100%",
            padding: "0 1.5rem", // Add padding for mobile
            boxSizing: "border-box", // Include padding in width calculation
          }}
        >
          {/* This is your component that fetches and displays live fraud stats */}
          <FraudStatsDisplay />
        </div>

        {/* CTA Button and supporting text */}
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <p
            style={{
              fontSize: "clamp(0.9rem, 2.5vw, 1rem)", // Responsive font size
              color: "#fff",
              marginBottom: "1rem",
              lineHeight: 1.5,
              maxWidth: 480,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Fraud defense as infrastructure — for apps, feeds, and reward engines.
            <br />
            **Start protecting your revenue today.**
          </p>

          <button
            onClick={() => router.push("/get-started")}
            style={{
              display: "inline-block",
              background: "linear-gradient(90deg, #f0f4f6ff, #39FF14)",
              color: "#000",
              fontWeight: "700",
              fontSize: "clamp(0.9rem, 3vw, 1.1rem)", // Responsive font size
              padding: "1rem 2rem",
              borderRadius: "999px",
              textDecoration: "none",
              boxShadow: "0 0 18px #39FF14",
              transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
              cursor: "pointer",
              border: "none", // Ensure no default button border
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 0 28px #00ff87";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 0 18px #39FF14";
            }}
          >
            SECURE YOUR PLATFORM NOW
          </button>
        </div>

        {/* Other Stats Sections - Can follow the main live meter and CTA */}
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 1280,
            margin: "4rem auto 0", // Increased margin to separate from CTA/Live Meter
            padding: "2rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          {/* GlobalStats component is now here, displaying live global fraud data */}
          <GlobalStats />

          {/* EffortNetStatsBox */}
          <div style={{ marginTop: "3rem", width: "100%" }}>
            <EffortNetStatsBox />
          </div>

          {/* LeftColumnLiveFeed */}
          <div style={{ width: "100%", maxWidth: "400px", margin: "2rem auto" }}>
            <LeftColumnLiveFeed />
          </div>
        </div>

        {/* Auth Modal - OUTSIDE LAYOUT for correct stacking and pointer events */}
        {showModal && <AuthModal onClose={() => setShowModal(false)} />}
      </div>
    </>
  );
}