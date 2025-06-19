import React, { useState, useRef, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import NaoOnboardingForm from "../components/NaoOnboardingForm";

import { useRewardState } from "../src/hooks/useRewardState";
import { useNFTSync } from "../src/hooks/useNFTSync";
import Image from "next/image";
import { RewardsTracker } from "../components/RewardsTracker";
// ActionBar import REMOVED as requested
// import ActionBar from "../commands/ActionBar"; // <-- REMOVED as requested

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
  loginUsername?: string;
  loginPassword?: string;
};

export default function Home() {
  const { data: session, status } = useSession();

  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showLogo, setShowLogo] = useState(false);

  // Onboarding state and router
  const [isOnboarded, setIsOnboarded] = useState(false);
  const router = useRouter();

  // Glow state for small NextAuth button
  const [btnHover, setBtnHover] = useState(false);

  // Reward state and NFT evolution sync
  const { rewardState, applyRewardEvent } = useRewardState();
  useNFTSync(rewardState, NFT_TOKEN_ID, evolveNFT, getUpdatedTraits);

  // --- Add State for Awaiting User Choice ---
  const [awaitingAccountChoice, setAwaitingAccountChoice] = useState(true);

  // Chat-based onboarding state
  const [onboardingStep, setOnboardingStep] = useState<
    null | "username" | "name" | "password" | "email" | "creating" | "loginUsername" | "loginPassword"
  >(null);
  const [onboardFields, setOnboardFields] = useState<OnboardFields>({});

  // Show welcome greeting on initial mount if needed
  useEffect(() => {
    if (
      messages.length === 0 &&
      awaitingAccountChoice &&
      !session
    ) {
      setMessages([
        {
          sender: "NAO",
          text: "Welcome! I am NAO, your health intelligence. Do you already have a NAO health passport, or would you like to create one?",
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AI Prompt When Session Is Active
  useEffect(() => {
    if (session && awaitingAccountChoice) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "NAO",
          text: "Do you already have a NAO health passport, or would you like to create one?",
        },
      ]);
    }
  }, [session, awaitingAccountChoice]);

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

  // Onboard user on login
  useEffect(() => {
    const onboard = async () => {
      if (session && !isOnboarded) {
        try {
          const res = await fetch("/api/onboardUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: session.user?.email, name: session.user?.name }),
          });
          if (!res.ok) throw new Error(await res.text());
          setIsOnboarded(true);
          router.push("/mint");
        } catch (e) {
          // Optionally handle error (show message, etc)
        }
      }
    };
    onboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isOnboarded, router]);

  // INTENT RECOGNITION for smarter onboarding
  function checkIntentSwitch(input: string) {
    const lower = input.toLowerCase();
    if (["sign in", "login", "already", "have account", "i have an account"].some(k => lower.includes(k))) {
      // user wants to switch to login
      return "login";
    }
    if (["sign up", "create", "register", "new account"].some(k => lower.includes(k))) {
      // user wants to switch to signup
      return "signup";
    }
    return null;
  }

  // Chat-based onboarding in sendMessage
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    // === DEBUG LOGS FOR NON-RESPONSIVE/REDIRECTING AI CHAT ===
    console.log("DEBUG: sendMessage called");
    console.log("DEBUG: input =", input);
    console.log("DEBUG: awaitingAccountChoice =", awaitingAccountChoice);
    console.log("DEBUG: onboardingStep =", onboardingStep);
    console.log("DEBUG: loading =", loading);
    console.log("DEBUG: threadId =", threadId);

    if (!input.trim() || !threadId || loading) return;
    setMessages((msgs) => [...msgs, { sender: "You", text: input }]);
    setInput(""); // Clear input immediately after sending
    setLoading(true);

    // --- Account Choice Interception ---
    if (awaitingAccountChoice) {
      const msg = input.toLowerCase();
      console.log("DEBUG: In awaitingAccountChoice branch, msg =", msg);
      if (
        ["yes", "already", "i have one", "login"].some((phrase) => msg.includes(phrase))
      ) {
        // Smart AI login flow: if not signed in, prompt for username, else go to mint
        if (!session) {
          console.log("DEBUG: Not signed in, starting AI-driven login flow.");
          setAwaitingAccountChoice(false);
          setOnboardingStep("loginUsername");
          setMessages((msgs) => [
            ...msgs,
            { sender: "NAO", text: "Please enter your username or email to sign in." }
          ]);
          setLoading(false);
          return;
        }
        console.log("DEBUG: 'YES' branch matched. Navigating to /mint ...");
        setAwaitingAccountChoice(false);
        setLoading(false);
        router.push("/mint");
        return;
      } else if (
        ["no", "create", "sign up", "new"].some((phrase) => msg.includes(phrase))
      ) {
        console.log("DEBUG: 'NO' branch matched. Starting onboarding ...");
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
        console.log("DEBUG: Fallback branch in awaitingAccountChoice.");
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

    // --- Smart AI Sign In Flow ---
    if (onboardingStep === "loginUsername") {
      setOnboardFields((fields) => ({ ...fields, loginUsername: input }));
      setOnboardingStep("loginPassword");
      setMessages((msgs) => [
        ...msgs,
        { sender: "NAO", text: "Please enter your password." }
      ]);
      setLoading(false);
      return;
    }
    if (onboardingStep === "loginPassword") {
      const username = onboardFields.loginUsername;
      const password = input;
      setMessages((msgs) => [
        ...msgs,
        { sender: "NAO", text: "Verifying your credentials..." }
      ]);
      try {
        const res = await fetch("/api/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (res.ok) {
          setMessages((msgs) => [
            ...msgs,
            { sender: "NAO", text: "Login successful! Redirecting to your health passport..." }
          ]);
          setOnboardingStep(null);
          setLoading(false);
          // Wait a moment for session to update, then go to /mint
          setTimeout(() => {
            router.push("/mint");
          }, 1200);
        } else {
          const errorText = await res.text();
          setMessages((msgs) => [
            ...msgs,
            { sender: "System", text: "Login failed: " + errorText },
            { sender: "NAO", text: "Please enter your username or email to try again." }
          ]);
          setOnboardingStep("loginUsername");
          setLoading(false);
        }
      } catch (err) {
        setMessages((msgs) => [
          ...msgs,
          { sender: "System", text: "Network error: " + (err as Error).message },
          { sender: "NAO", text: "Please enter your username or email to try again." }
        ]);
        setOnboardingStep("loginUsername");
        setLoading(false);
      }
      return;
    }

    // --- Chat-based onboarding steps with INTENT CHECKS ---
    if (onboardingStep) {
      // Check if the user is switching intent during onboarding
      const detectedIntent = checkIntentSwitch(input);
      if (detectedIntent === "login") {
        console.log("DEBUG: Detected intent switch to login during onboardingStep.");
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
        console.log("DEBUG: Detected repeated signup intent during onboardingStep.");
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

      if (onboardingStep === "username") {
        if (input.length < 3 || /\s/.test(input)) {
          console.log("DEBUG: Username validation failed:", input);
          setMessages((msgs) => [
            ...msgs,
            { sender: "NAO", text: "Please enter a valid username (at least 3 characters, no spaces)." },
          ]);
          setLoading(false);
          return;
        }
        console.log("DEBUG: Username accepted:", input);
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
          console.log("DEBUG: Name validation failed:", input);
          setMessages((msgs) => [
            ...msgs,
            { sender: "NAO", text: "Please enter your full name." },
          ]);
          setLoading(false);
          return;
        }
        console.log("DEBUG: Name accepted:", input);
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
          console.log("DEBUG: Password validation failed:", input);
          setMessages((msgs) => [
            ...msgs,
            { sender: "NAO", text: "Please choose a password at least 6 characters long." },
          ]);
          setLoading(false);
          return;
        }
        console.log("DEBUG: Password accepted.");
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
          console.log("DEBUG: Email validation failed:", input);
          setMessages((msgs) => [
            ...msgs,
            { sender: "NAO", text: "That doesn't look like a valid email. Please try again." },
          ]);
          setLoading(false);
          return;
        }
        console.log("DEBUG: Email accepted:", input);
        setOnboardFields((fields) => ({ ...fields, email: input }));
        setOnboardingStep("creating");
        setMessages((msgs) => [
          ...msgs,
          { sender: "NAO", text: "Creating your NAO account and secure health wallet..." }
        ]);
        // Call backend to create user and wallet
        try {
          // Simulated backend call; replace with your real endpoint
          const res = await fetch("/api/createUserAndWallet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: onboardFields.username,
              name: onboardFields.name,
              password: onboardFields.password,
              email: input, // current input is the email
            }),
          });
          if (!res.ok) {
            const errorText = await res.text();
            console.log("DEBUG: Error creating account:", errorText);
            setMessages((msgs) => [
              ...msgs,
              { sender: "System", text: "Error creating account: " + errorText }
            ]);
            setOnboardingStep(null);
            setLoading(false);
            return;
          }
          // You might want to parse the wallet address or user info here
          // const data = await res.json();
          setTimeout(() => {
            console.log("DEBUG: Account and wallet created.");
            setMessages((msgs) => [
              ...msgs,
              {
                sender: "NAO",
                text: "Done! Your NAO health passport and wallet are ready. Let's continue onboarding.",
              },
            ]);
            setOnboardingStep(null);
            setLoading(false);
            router.push("/final-onboarding");
          }, 1600); // Small delay for effect
        } catch (err) {
          console.log("DEBUG: Network error creating account:", err);
          setMessages((msgs) => [
            ...msgs,
            { sender: "System", text: "Network error: " + (err as Error).message }
          ]);
          setOnboardingStep(null);
          setLoading(false);
        }
        return;
      }
      // Prevent running normal message flow if onboarding step active
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

      {/* Small NextAuth Button on Top Right */}
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 100,
          background: "rgba(8,24,58,0.68)",
          borderRadius: 10,
          padding: "6px 12px",
          border: "1.5px solid #00fff9",
          boxShadow: "0 0 12px 1px #00fff9cc",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          backdropFilter: "blur(4px)"
        }}
      >
        {status === "loading" ? (
          <span>Loading...</span>
        ) : session ? (
          <>
            <span style={{ color: "#00fff9", fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>
              Signed in as {session.user?.email || session.user?.name}
            </span>
            <button
              onClick={() => signOut()}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{
                marginTop: 10,
                background: "none",
                color: "#fff",
                border: "1.5px solid #00fff9",
                borderRadius: 10,
                padding: "7px 26px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 400,
                transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
                boxShadow: btnHover
                  ? "0 0 16px 4px #00fff9, 0 0 6px 2px #00fff9"
                  : "0 0 8px 2px #00fff9cc"
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <button
            onClick={() => signIn("google", { callbackUrl: "/mint" })}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{
              background: "linear-gradient(90deg, #00fff9 0%, #1267da 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "8px 18px",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: 1,
              cursor: "pointer",
              boxShadow: btnHover
                ? "0 0 24px 8px #00fff9, 0 0 12px 2px #00fff9"
                : "0 0 8px 2px #00fff9cc",
              textShadow: "0 0 4px #00fff9, 0 0 1px #00fff9",
              transition: "box-shadow 0.2s, background 0.2s"
            }}
          >
            Sign up / Sign in with Google
          </button>
        )}
      </div>

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