import { useState } from "react";
import { useRouter } from "next/router";
import { useRewardState } from "../src/hooks/useRewardState";
import { useNFTSync } from "../src/hooks/useNFTSync";
import GlobalStats from "@/components/GlobalStats";
import AuthModal from "../components/AuthModal";
import LeftColumnLiveFeed from "../components/LeftColumnLiveFeed";
import FraudStatsDisplay from "@/components/FraudStatsDisplay";
import FraudTicker from "@/components/FraudTicker";

const NFT_TOKEN_ID = "demo-nft-123";

function getUpdatedTraits(level: number) {
  return { color: level > 2 ? "gold" : "silver", aura: level };
}

async function evolveNFT({
  tokenId,
  newLevel,
  updatedTraits,
}: {
  tokenId: string;
  newLevel: number;
  updatedTraits: any;
}) {
  await fetch("/api/evolve", {
    method: "POST",
    body: JSON.stringify({ tokenId, newLevel, updatedTraits }),
    headers: { "Content-Type": "application/json" },
  });
}

export default function Home() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("nao_user") || "{}")
      : {};
  const { rewardState } = useRewardState(user.walletId || "");
  useNFTSync(rewardState, NFT_TOKEN_ID, evolveNFT, getUpdatedTraits);

  return (
    <>
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
        }}
      />

      {/* Main Layout Content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          height: "100vh",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <header style={{ padding: "2rem 3rem 0", display: "flex", alignItems: "center" }}>
          <h1 style={{ color: "#f6fafaff", fontWeight: 800, fontSize: "1.75rem", letterSpacing: "0.05em" }}>
            VERIFY FITNESS EFFORT
            <span
              style={{
                display: "inline-block",
                transform: "rotate(45deg)",
                width: "12px",
                height: "12px",
                borderRight: "2px solid lime",
                borderTop: "2px solid lime",
                margin: "0 0.5rem",
                boxShadow: "0 0 10px lime",
              }}
            />
            CRYPTO REWARD USER
            <span
              style={{
                display: "inline-block",
                transform: "rotate(45deg)",
                width: "12px",
                height: "12px",
                borderRight: "2px solid gold",
                borderTop: "2px solid gold",
                margin: "0 0.5rem",
                boxShadow: "0 0 10px gold",
              }}
            />
            ENGINE
            <span
              style={{
                display: "inline-block",
                transform: "rotate(45deg)",
                width: "12px",
                height: "12px",
                borderRight: "2px solid red",
                borderTop: "2px solid red",
                margin: "0 0.5rem",
                boxShadow: "0 0 10px red",
              }}
            />
            powered BY NAO
          </h1>
        </header>

        {/* Subheading */}
        <div
          style={{
            padding: "0 3rem 2rem",
            color: "#cceeff",
            fontWeight: 600,
            fontSize: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <span>Track Workouts</span>
          <span
            style={{
              transform: "rotate(45deg)",
              width: "12px",
              height: "12px",
              borderRight: "2px solid lime",
              borderTop: "2px solid lime",
              boxShadow: "0 0 10px lime",
            }}
          ></span>
          <span>Earn</span>
          <span
            style={{
              transform: "rotate(45deg)",
              width: "12px",
              height: "12px",
              borderRight: "2px solid gold",
              borderTop: "2px solid gold",
              boxShadow: "0 0 10px gold",
            }}
          ></span>
          <span>Evolve</span>
          <span
            style={{
              transform: "rotate(45deg)",
              width: "12px",
              height: "12px",
              borderRight: "2px solid red",
              borderTop: "2px solid red",
              boxShadow: "0 0 10px red",
            }}
          ></span>
          <span>Users</span>
        </div>

        {/* Decorative Icon */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "4rem",
          }}
        >
          <span
            style={{
              display: "inline-block",
              transform: "rotate(45deg)",
              width: "100px",
              height: "100px",
              borderRight: "8px solid lime",
              borderTop: "8px solid lime",
              boxShadow: "0 0 30px lime",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* CTA Button */}
       <div style={{ textAlign: "center", marginTop: "2rem" }}>
  <p style={{
    fontSize: "1rem",
    color: "#fff",
    marginBottom: "1rem",
    lineHeight: 1.5,
    maxWidth: 480,
    marginLeft: "auto",
    marginRight: "auto"
  }}>
    Plug-and-play fitness rewards engine. <br />
    Verified workouts. Crypto rewards. All yours.
  </p>

  <a
    href="#"
    style={{
      display: "inline-block",
      background: "linear-gradient(90deg, #f0f4f6ff, #39FF14)",
      color: "#000",
      fontWeight: "700",
      fontSize: "1rem",
      padding: "1rem 2rem",
      borderRadius: "999px",
      textDecoration: "none",
      boxShadow: "0 0 18px #39FF14",
      transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
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
    USE NAO ENGINE
  </a>
</div>


        <div style={{ flex: 1 }}></div>

        {/* Footer (keep ONLY this one) */}
        <footer style={{ padding: "1rem 2rem", color: "#cceeff", textAlign: "center" }}>
          &copy; 2025 NAOVERSE. All rights reserved.
        </footer>
      </div>

      {/* Global Stats Section */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 1280,
          margin: "4rem auto 0",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
        }}
      >
        <GlobalStats />

{/* POC 2: Fraud Verification Metrics */}
<div style={{ width: "100%", marginTop: "2rem" }}>
  <FraudStatsDisplay />
</div>

<div style={{ width: "100%", maxWidth: "400px", margin: "2rem auto" }}>
  <LeftColumnLiveFeed />
</div>
      </div>

      {/* Auth Modal - OUTSIDE LAYOUT for correct stacking and pointer events */}
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  );
}