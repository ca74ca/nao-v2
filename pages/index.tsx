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
<header style={{ padding: "2rem 3rem 0", display: "flex", alignItems: "center" }}>
  <h1 style={{ color: "#00fff9", fontWeight: 800, fontSize: "1.75rem", letterSpacing: "0.05em" }}>
    WORKOUT
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
    EARN
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
    LEVEL UP
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
    FLEX NFTs
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
  <span>Earn XP</span>
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
  <span>Evolve NFT</span>
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
  <span>Claim Rewards</span>
</div>


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
    }}
  />
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

        {/* Footer Placeholder */}
        <footer style={{ padding: "1rem 2rem", color: "#cceeff", textAlign: "center" }}>
          &copy; 2025 NAOVERSE. All rights reserved.
        </footer>
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
