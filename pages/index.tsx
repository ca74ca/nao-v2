import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import NaoOnboardingForm from "../components/NaoOnboardingForm";
import { useRewardState } from "../src/hooks/useRewardState";
import { useNFTSync } from "../src/hooks/useNFTSync";
import { RewardsTracker } from "../components/RewardsTracker";
import GlobalStats from "@/components/GlobalStats";

// Simulated NFT tokenId for demo (replace with actual user's NFT token id)
const NFT_TOKEN_ID = "demo-nft-123";

// Example: function to build the new NFT traits per level
function getUpdatedTraits(level: number) {
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
          text: "Welcome! I am NAO. Ready to start earning rewards for your workouts? Just enter your email to begin",
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
      const user = JSON.parse(localStorage.getItem("nao_user") || "{}");
      const walletId = user.walletId;

      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          message: input,
          walletId,
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

  const address = user?.walletId;

  return (
    <>
  
      {/* --- Full Screen Background --- */}
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

      {/* --- Chat UI --- */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 480,
          margin: "auto",
          marginTop: "20vh",
          padding: "1rem",
          background: "rgba(8, 18, 30, 0.9)",
          borderRadius: 16,
          boxShadow: "0 0 10px #00fff933",
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxHeight: 160,
            overflowY: "auto",
            marginBottom: 8,
            scrollBehavior: "smooth",
            padding: "0 4px",
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                color:
                  msg.sender === "NAO"
                    ? "#00fff9"
                    : msg.sender === "System"
                    ? "#ff6b6b"
                    : "#cceeff",
                fontWeight: msg.sender === "NAO" ? 600 : 400,
                margin: "3px 0",
                fontSize: "0.95em",
              }}
            >
              <b>{msg.sender}:</b> {msg.text}
            </div>
          ))}
        </div>

        <form
          onSubmit={sendMessage}
          style={{
            display: "flex",
            gap: "0.5rem",
            width: "100%",
          }}
        >
          <input
            type="text"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your email to begin..."
            style={{
              flex: 1,
              padding: "0.5rem 1rem",
              fontSize: 14,
              borderRadius: 14,
              background: "#0e192a",
              color: "#cceeff",
              border: "1px solid #00fff9",
              outline: "none",
              textAlign: "center",
            }}
            autoFocus
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.5rem 1.5rem",
              background: "linear-gradient(90deg, #00fff9 0%, #1267da 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? "..." : "Send"}
          </button>
        </form>
      </div>

      {/* --- Global Reward Tracker Below --- */}
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