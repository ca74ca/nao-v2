import React, { useState, useRef, useEffect } from "react";
import { useRewardState } from "../src/hooks/useRewardState";
import { useNFTSync } from "../src/hooks/useNFTSync";
import Image from "next/image";
import { RewardsTracker } from "../components/RewardsTracker";
import ActionBar from "../commands/ActionBar"; // <-- NEW: import the techy ActionBar

// Simulated NFT tokenId for demo (replace with actual user's NFT token id)
const NFT_TOKEN_ID = "demo-nft-123";

// Example: function to build the new NFT traits per level
function getUpdatedTraits(level: number) {
  // Replace this with your actual NFT trait logic
  return { color: level > 2 ? "gold" : "silver", aura: level };
}

// Example: call your NFT evolution API
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
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Logo fade-in state
  const [showLogo, setShowLogo] = useState(false);

  // Reward state and NFT evolution sync
  const { rewardState, applyRewardEvent } = useRewardState();
  useNFTSync(rewardState, NFT_TOKEN_ID, evolveNFT, getUpdatedTraits);

  // Fetch a new threadId when the component mounts
  useEffect(() => {
    fetch("/api/thread", { method: "POST" })
      .then((res) => res.json())
      .then((data) => setThreadId(data.threadId))
      .catch(() => setThreadId(null));
  }, []);

  // Trigger fade-in effect for logo
  useEffect(() => {
    setShowLogo(true);
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !threadId || loading) return;
    setMessages((msgs) => [...msgs, { sender: "You", text: input }]);
    setLoading(true);

    // ⬇️ Example: Command triggers for reward events
    if (/workout/i.test(input)) {
      applyRewardEvent({ type: "workout", complete: true });
      setMessages((msgs) => [
        ...msgs,
        { sender: "NAO", text: "Workout complete! XP and credits awarded." }
      ]);
    }
    if (/calories/i.test(input)) {
      applyRewardEvent({ type: "calories", value: 600, goal: 600 });
      setMessages((msgs) => [
        ...msgs,
        { sender: "NAO", text: "Calorie goal achieved! XP and credits awarded." }
      ]);
    }

    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, message: input }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        setMessages((msgs) => [
          ...msgs,
          { sender: "System", text: "Error from server: " + errorText }
        ]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setMessages((msgs) => [...msgs, { sender: "NAO", text: data.reply }]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { sender: "System", text: "Network error: " + (err as Error).message }
      ]);
    }
    setInput("");
    setLoading(false);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div style={{
      position: "relative",
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      color: "#fff"
    }}>
      <ActionBar />
      {/* Logo in upper left with fade-in */}
      
      {/* Fullscreen Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          zIndex: 0
        }}
      >
        <source src="/ai_intro_video1.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Floating Chat at Bottom Third */}
      <div
        style={{
          position: "fixed",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: "10vh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pointerEvents: "none",
          zIndex: 2
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            maxWidth: 700,
            width: "95vw",
            background: "rgba(13, 32, 60, 0.38)",
            border: "2px solid #00fff9",
            boxShadow: "0 0 18px 2px #00fff9cc, 0 0 4px 1px #00fff9",
            borderRadius: 30,
            padding: 14,
            backdropFilter: "blur(10px)",
            marginBottom: 6,
            minHeight: 0,
          }}
        >
          <div style={{
            maxHeight: 110,
            overflowY: "auto",
            marginBottom: 8,
            scrollBehavior: "smooth",
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                margin: "0.25rem 0",
                color: msg.sender === "NAO"
                  ? "#00fff9"
                  : msg.sender === "System"
                    ? "#ff6b6b"
                    : "#cceeff",
                textShadow: msg.sender === "NAO"
                  ? "0 0 8px #00fff9, 0 0 2px #00fff9"
                  : msg.sender === "System"
                    ? "0 0 6px #ff6b6b"
                    : "0 0 6px #338fff",
                fontSize: 17,
                lineHeight: 1.33,
                letterSpacing: 0.2,
              }}>
                <b>{msg.sender}:</b> {msg.text}
              </div>
            ))}
          </div>
          <form
            onSubmit={sendMessage}
            style={{
              display: "flex",
              gap: 8,
              width: "100%",
              pointerEvents: "auto"
            }}
          >
            <input
              type="text"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="AWAKEN NAO..."
              style={{
                flex: 1,
                padding: "10px 18px",
                fontSize: 16,
                borderRadius: 18,
                background: "rgba(20, 30, 60, 0.5)",
                color: "#bbffff",
                border: "2px solid #00fff9",
                outline: "none",
                boxShadow: "0 0 8px 2px #00fff9",
                fontWeight: 500,
                textAlign: "center",
                backdropFilter: "blur(2px)",
                transition: "box-shadow 0.2s",
              }}
              autoFocus
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 28px",
                background: "linear-gradient(90deg, #00fff9 0%, #1267da 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 18,
                fontWeight: "bold",
                boxShadow: "0 0 12px 2px #00fff9",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "box-shadow 0.2s, background 0.2s"
              }}
            >
              {loading ? "..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}