import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";

interface EchoAssistantProps {
  initialMessage?: string;
  initialThreadId?: string | null;
  videoSrc?: string;
  inputPlaceholder?: string;
  onSend?: (input: string) => Promise<string>; // <-- ADDED THIS LINE
}

export default function EchoAssistant({
  initialMessage,
  initialThreadId = null,
  videoSrc,
  inputPlaceholder = "Type your command...",
  onSend, // <-- ADDED THIS ARGUMENT
}: EchoAssistantProps) {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>(
    initialMessage
      ? [{ sender: "NAO", text: initialMessage }]
      : []
  );
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(initialThreadId);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null); // <--- NEW
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fetch a new threadId when the component mounts, if not provided
  useEffect(() => {
    if (!threadId) {
      fetch("/api/thread", { method: "POST" })
        .then((res) => res.json())
        .then((data) => setThreadId(data.threadId))
        .catch(() => setThreadId(null));
    }
  }, [threadId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Capture the user's email if it looks like one
    if (!userEmail && /\S+@\S+\.\S+/.test(input.trim())) {
      setUserEmail(input.trim());
    }

    setMessages((msgs) => [...msgs, { sender: "You", text: input }]);
    setLoading(true);

    try {
      let reply: string | undefined;
      if (onSend) {
        reply = await onSend(input);
      } else {
        if (!threadId) {
          setMessages((msgs) => [
            ...msgs,
            { sender: "System", text: "NAO is initializing, please wait..." }
          ]);
          setLoading(false);
          setInput("");
          return;
        }
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
          setInput("");
          return;
        }
        const data = await res.json();
        reply = data.reply;
      }
      setMessages((msgs) => [...msgs, { sender: "NAO", text: reply || "NAO is thinking..." }]);

      // ---- Redirection logic: if onboarding is complete ----
      if (
        reply &&
        (
          reply.toLowerCase().includes("you're all set") ||
          reply.toLowerCase().includes("onboarding complete")
        )
      ) {
        if (userEmail) {
          router.push({ pathname: "/mint", query: { email: userEmail } });
        } else if (reply) {
          // fallback: try to extract from reply, if ever included
          const match = reply.match(/[\w\-.]+@[\w\-.]+\.\w+/);
          if (match) {
            router.push({ pathname: "/mint", query: { email: match[0] } });
          }
        }
      }
      // -----------------------------------------------------
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
      {/* Optional Fullscreen Video */}
      {videoSrc && (
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
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

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
            onSubmit={handleSend}
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
              placeholder={inputPlaceholder}
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