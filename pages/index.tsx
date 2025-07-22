import React from "react";
import { useRouter } from "next/router";
import { useRewardState } from "../src/hooks/useRewardState";
import { useNFTSync } from "../src/hooks/useNFTSync";
import GlobalStats from "@/components/GlobalStats";

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
  const user = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("nao_user") || "{}")
    : {};
  const { rewardState } = useRewardState(user.walletId || "");
  useNFTSync(rewardState, NFT_TOKEN_ID, evolveNFT, getUpdatedTraits);

  return (
    <>
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
        <header style={{ padding: "1rem 2rem", display: "flex", alignItems: "center" }}>
          <h1 style={{ color: "#00fff9", fontWeight: 800, fontSize: "1.5rem" }}>
            WORKOUT, EARN, LEVEL UP, FLEX NFTs
          </h1>
        </header>

        {/* Subheading */}
        <div style={{ padding: "0 2rem", color: "#cceeff", fontWeight: 600, fontSize: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <span>Track Workouts</span>
          <span style={{ width: "30px", height: "2px", background: "lime", boxShadow: "0 0 10px lime" }}></span>
          <span>Earn XP</span>
          <span style={{ transform: "rotate(45deg)", width: "12px", height: "12px", borderRight: "2px solid gold", borderTop: "2px solid gold", boxShadow: "0 0 10px gold" }}></span>
          <span>Evolve NFT</span>
          <span style={{ width: "30px", height: "2px", background: "red", boxShadow: "0 0 10px red" }}></span>
          <span>Claim Rewards</span>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          {/* Left Sidebar (Empty for now) */}
          <div style={{ width: "200px" }}></div>

          {/* Main Content */}
          <div style={{ textAlign: "center", flex: 1 }}>
            <h2 style={{ color: "#cceeff", fontSize: "2rem", marginBottom: "1rem" }}>
              Rewards for Your Fitness. Crypto for Your Effort.
            </h2>
            <div style={{ color: "#cceeff", marginBottom: "1rem" }}>
              XP: {rewardState.xp} | Streak: {rewardState.streak}
            </div>
            <button
              onClick={() => router.push("/mint")}
              style={{
                padding: "1rem 3rem",
                background: "linear-gradient(90deg, #00fff9 0%, #1267da 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 20,
                fontWeight: 700,
                fontSize: "1.25rem",
                cursor: "pointer",
                marginTop: "2rem",
              }}
            >
              Start Earning
            </button>
          </div>

          <div style={{ width: "200px" }}></div>
        </div>

        {/* Footer Placeholder */}
        <footer style={{ padding: "1rem 2rem", color: "#cceeff", textAlign: "center" }}>
          &copy; 2025 NAOVERSE. All rights reserved.
        </footer>
      </div>

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
      </div>
    </>
  );
}
