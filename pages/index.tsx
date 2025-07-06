import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import NaoOnboardingForm from "../components/NaoOnboardingForm";

import { useRewardState } from "../src/hooks/useRewardState";
import { useNFTSync } from "../src/hooks/useNFTSync";
import Image from "next/image";
import { RewardsTracker } from "../components/RewardsTracker";

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

type OnboardFields = {
  username?: string;
  name?: string;
  password?: string;
  email?: string;
  healthGoals?: string;
  connectWearables?: boolean;
};

export default function Home() {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  useEffect(() => {
    const chatContainer = document.querySelector('[style*="overflow-y: auto"]');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showLogo, setShowLogo] = useState(false);

  // Onboarding state and router
  const [isOnboarded, setIsOnboarded] = useState(false);
  const router = useRouter();

  // Reward state and NFT evolution sync
  const user = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("nao_user") || "{}")
    : {};
  const { rewardState, applyRewardEvent } = useRewardState(user.walletId || "");
  useNFTSync(rewardState, NFT_TOKEN_ID, evolveNFT, getUpdatedTraits);

  // --- Add State for Awaiting User Choice ---
  const [awaitingAccountChoice, setAwaitingAccountChoice] = useState(true);

  // Chat-based onboarding state
  const [onboardingStep, setOnboardingStep] = useState<
    null | "username" | "name" | "password" | "email" | "healthGoals" | "connectWearables" | "creating" | "loginUsername" | "loginPassword" | "resetPassword"
  >(null);
  const [onboardFields, setOnboardFields] = useState<OnboardFields>({});

  // --- BEGIN: FIXED WELCOME EFFECT (only on first page load) ---
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  useEffect(() => {
    if (
      !hasShownWelcome &&
      messages.length === 0 &&
      awaitingAccountChoice
    ) {
      setMessages([
        {
          sender: "NAO",
          text: "Welcome! I am NAO, your health intelligence. Do you already have a NAO health passport, or would you like to create one?",
        },
      ]);
      setHasShownWelcome(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasShownWelcome, messages.length, awaitingAccountChoice]);
  // --- END: FIXED WELCOME EFFECT ---

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

  // INTENT RECOGNITION for smarter onboarding
  function checkIntentSwitch(input: string) {
    const lower = input.toLowerCase();
    if (["sign in", "login", "already", "have account", "i have an account"].some(k => lower.includes(k))) {
      return "login";
    }
    if (["sign up", "create", "register", "new account"].some(k => lower.includes(k))) {
      return "signup";
    }
    return null;
  }

  // Chat-based onboarding in sendMessage
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !threadId || loading) return;
    setMessages((msgs) => [...msgs, { sender: "You", text: input }]);
    setInput(""); // Clear input immediately after sending
    setLoading(true);

    // --- Account Choice Interception ---
    if (awaitingAccountChoice) {
      const msg = input.toLowerCase();
      if (
        ["yes", "already", "i have one", "login"].some((phrase) => msg.includes(phrase))
      ) {
        setAwaitingAccountChoice(false);
        setOnboardingStep("loginUsername");
        setMessages((msgs) => [
          ...msgs,
          { sender: "NAO", text: "Please enter your username or email to sign in." }
        ]);
        setLoading(false);
        return;
      } else if (
        ["no", "create", "sign up", "new"].some((phrase) => msg.includes(phrase))
      ) {
        setAwaitingAccountChoice(false);
        setOnboardingStep("username");
        setMessages((msgs) => [
          ...msgs,
          {
            sender: "NAO",
            text: "Great! Let's create your NAO health passport. What would you like your username to be?",
          },
        ]);
        setLoading(false);
        return;
      } else {
        setMessages((msgs) => [
          ...msgs,
          {
            sender: "NAO",
            text: "Please say 'yes' if you already have a NAO profile, or 'no' to create your health passport.",
          },
        ]);
        setLoading(false);
        return;
      }
    }

    // --- Chat-based onboarding steps with INTENT CHECKS ---
    if (onboardingStep) {
      // Check if the user is switching intent during onboarding
      const detectedIntent = checkIntentSwitch(input);
      if (detectedIntent === "login") {
        setMessages((msgs) => [
          ...msgs,
          {
            sender: "NAO",
            text: "It looks like you want to sign in instead. Please say 'yes' if you already have a NAO profile, or 'no' to create your health passport.",
          },
        ]);
        setAwaitingAccountChoice(true);
        setOnboardingStep(null);
        setOnboardFields({});
        setLoading(false);
        return;
      }
      if (detectedIntent === "signup" && onboardingStep !== "username") {
        setMessages((msgs) => [
          ...msgs,
          {
            sender: "NAO",
            text: "You're already creating a new account. Please answer the current question to continue.",
          },
        ]);
        setLoading(false);
        return;
      }

      // --- HANDLE loginUsername step ---
      if (onboardingStep === "loginUsername") {
        if (!input.includes("@") && input.length < 3) {
          setMessages((msgs) => [
            ...msgs,
            {
              sender: "NAO",
              text: "Please enter a valid email address or username.",
            },
          ]);
          setLoading(false);
          return;
        }
        setOnboardFields((fields) => ({ ...fields, email: input }));
        setOnboardingStep("loginPassword");
        setMessages((msgs) => [
          ...msgs,
          { sender: "NAO", text: "Please enter your password." }
        ]);
        setLoading(false);
        return;
      }

      // --- HANDLE loginPassword step with "forgot" logic ---
      if (onboardingStep === "loginPassword") {
        if (
          ["forgot", "don't know", "do not know", "cant remember", "can't remember", "reset"].some(phrase =>
            input.toLowerCase().includes(phrase)
          )
        ) {
          setMessages((msgs) => [
            ...msgs,
            {
              sender: "NAO",
              text: "No worries! (In production, you'd get a password reset email.) For testing, please enter a new password you'd like to set for your account.",
            },
          ]);
          setOnboardingStep("resetPassword");
          setLoading(false);
          return;
        }

        if (input.length < 6) {
          setMessages((msgs) => [
            ...msgs,
            { sender: "NAO", text: "Please enter a valid password (at least 6 characters)." }
          ]);
          setLoading(false);
          return;
        }
        setOnboardFields((fields) => ({ ...fields, password: input }));
        setMessages((msgs) => [
          ...msgs,
          { sender: "NAO", text: "Signing you in..." }
        ]);
        setTimeout(() => {
          setMessages((msgs) => [
            ...msgs,
            { sender: "NAO", text: "Welcome back! You are now signed in!" }
          ]);
          // --- PATCH: Merge and preserve walletId and other fields ---
          const prev = JSON.parse(localStorage.getItem("nao_user") || "{}");
          localStorage.setItem("nao_user", JSON.stringify({
            ...prev,
            email: onboardFields.email ?? prev.email ?? "",
            username: onboardFields.username ?? prev.username ?? "",
          }));
          router.push("/mint");
          setLoading(false);
        }, 1600);
        return;
      }

      // --- HANDLE resetPassword step ---
      if (onboardingStep === "resetPassword") {
        if (input.length < 6) {
          setMessages((msgs) => [
            ...msgs,
            { sender: "NAO", text: "Please enter a new password at least 6 characters long." }
          ]);
          setLoading(false);
          return;
        }
        setOnboardFields((fields) => ({ ...fields, password: input }));
        setMessages((msgs) => [
          ...msgs,
          { sender: "NAO", text: "Password reset successful! Signing you in..." }
        ]);
        setTimeout(() => {
          setMessages((msgs) => [
            ...msgs,
            { sender: "NAO", text: "Welcome back! You are now signed in!" }
          ]);
          // --- PATCH: Merge and preserve walletId and other fields ---
          const prev = JSON.parse(localStorage.getItem("nao_user") || "{}");
          localStorage.setItem("nao_user", JSON.stringify({
            ...prev,
            email: onboardFields.email ?? prev.email ?? "",
            username: onboardFields.username ?? prev.username ?? "",
          }));
          router.push("/mint");
          setLoading(false);
        }, 1600);
        return;
      }

      // --- SIGNUP FLOW ---

      if (onboardingStep === "username") {
        if (input.length < 3 || /\s/.test(input)) {
          setMessages((msgs) => [
            ...msgs,
            { sender: "NAO", text: "Please enter a valid username (at least 3 characters, no spaces)." },
          ]);
          setLoading(false);
          return;
        }
        setOnboardFields((fields) => ({ ...fields, username: input }));
        setOnboardingStep("name");
        setMessages((msgs) => [
          ...msgs,
          { sender: "NAO", text: "And your full name?" }
        ]);
        setLoading(false);
        return;
      }
      if (onboardingStep === "name") {
        if (input.length < 2) {
          setMessages((msgs) => [
            ...msgs,
            { sender: "NAO", text: "Please enter your full name." },
          ]);
          setLoading(false);
          return;
        }
        setOnboardFields((fields) => ({ ...fields, name: input }));
        setOnboardingStep("password");
        setMessages((msgs) => [
          ...msgs,
          { sender: "NAO", text: "Choose a password. (Don't worry, it's encrypted!)" }
        ]);
        setLoading(false);
        return;
      }
      if (onboardingStep === "password") {
        if (input.length < 6) {
          setMessages((msgs) => [
            ...msgs,
            { sender: "NAO", text: "Please choose a password at least 6 characters long." },
          ]);
          setLoading(false);
          return;
        }
        setOnboardFields((fields) => ({ ...fields, password: input }));
        setOnboardingStep("email");
        setMessages((msgs) => [
          ...msgs,
          { sender: "NAO", text: "What email should be associated with your account?" }
        ]);
        setLoading(false);
        return;
      }
      // 🟡 NEW: Ask for health goals after email
      if (onboardingStep === "email") {
        if (!/\S+@\S+\.\S+/.test(input)) {
          setMessages((msgs) => [
            ...msgs,
            { sender: "NAO", text: "That doesn't look like a valid email. Please try again." },
          ]);
          setLoading(false);
          return;
        }
        setOnboardFields((fields) => ({ ...fields, email: input }));
        setOnboardingStep("healthGoals");
        setMessages((msgs) => [
          ...msgs,
          {
            sender: "NAO",
            text: "What are your main health goals with NAO? (e.g., lose weight, improve sleep, general wellness, etc.)"
          }
        ]);
        setLoading(false);
        return;
      }
      // 🟢 NEW: Ask for connectWearables after health goals
      if (onboardingStep === "healthGoals") {
        setOnboardFields((fields) => ({ ...fields, healthGoals: input }));
        setOnboardingStep("connectWearables");
        setMessages((msgs) => [
          ...msgs,
          {
            sender: "NAO",
            text: "Would you like to connect any wearable devices such as Fitbit or Apple Watch? (yes/no)"
          }
        ]);
        setLoading(false);
        return;
      }
      // 🟣 NEW: After connectWearables, POST everything to backend
      if (onboardingStep === "connectWearables") {
        const wantsWearables = /^y(es)?$/i.test(input.trim());
        setOnboardFields((fields) => ({ ...fields, connectWearables: wantsWearables }));
        setOnboardingStep("creating");
        setMessages((msgs) => [
          ...msgs,
          { sender: "NAO", text: "Creating your NAO account and secure health wallet..." }
        ]);
        setLoading(true);

        try {
          const res = await fetch("/api/onboardUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: onboardFields.username,
              name: onboardFields.name,
              password: onboardFields.password,
              email: onboardFields.email,
              healthGoals: onboardFields.healthGoals,
              connectWearables: wantsWearables,
            }),
          });
          const data = await res.json();
          if (data.status === "success" && data.redirectUrl) {
            setTimeout(() => {
              setMessages((msgs) => [
                ...msgs,
                {
                  sender: "NAO",
                  text: "Done! Your NAO health passport and wallet are ready. Let's continue onboarding.",
                },
              ]);
              setOnboardingStep(null);
              setLoading(false);
              router.push(data.redirectUrl);
            }, 1600);
            return;
          }
          if (data.status === "exists" && data.redirectUrl) {
            setMessages((msgs) => [
              ...msgs,
              { sender: "System", text: "User already exists. Redirecting to login..." }
            ]);
            setOnboardingStep(null);
            setLoading(false);
            setTimeout(() => router.push(data.redirectUrl), 1000);
            return;
          }
          setMessages((msgs) => [
            ...msgs,
            { sender: "System", text: "Error creating account: " + (data.message || "Unknown error.") }
          ]);
          setOnboardingStep(null);
          setLoading(false);
          return;
        } catch (err) {
          setMessages((msgs) => [
            ...msgs,
            { sender: "System", text: "Network error: " + (err as Error).message }
          ]);
          setOnboardingStep(null);
          setLoading(false);
        }
        return;
      }
      setLoading(false);
      return;
    }

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
  // Retrieve walletId from localStorage
  const user = JSON.parse(localStorage.getItem("nao_user") || "{}");
  const walletId = user.walletId;

  const res = await fetch("/api/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      threadId,
      message: input,
      walletId, // <-- ADD THIS LINE
    }),
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
  // ...rest of your code...
      const data = await res.json();
      setMessages((msgs) => [...msgs, { sender: "NAO", text: data.reply }]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { sender: "System", text: "Network error: " + (err as Error).message }
      ]);
    }
    setLoading(false);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div style={{
      position: "relative",
      width: "200vw",
      height: "200vh",
      overflow: "hidden",
      color: "#fff"
    }}>
      <div
        style={{
          position: "fixed",
          top: 20,
          left: 24,
          zIndex: 100,
          fontSize: 18,
          fontWeight: 500,
          letterSpacing: 2,
          color: "#00fff9",
          textShadow: "0 0 6px rgb(208, 223, 223), 0 0 2px rgb(232, 239, 239)",
          fontFamily: "inherit",
          background: "rgba(0, 0, 0, 0.3)",
          padding: "4px 10px",
          boxShadow: "0 0 10px rgba(8, 8, 8, 0.67)",
        }}
      >
        N A O HEALTH INTELLIGENCE REWARDED
      </div>
      <video
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
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