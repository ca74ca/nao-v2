import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";

interface EchoAssistantProps {
  initialMessage?: string;
  initialThreadId?: string | null;
  videoSrc?: string;
  inputPlaceholder?: string;
  onSend?: (input: string) => Promise<string>;
  prompt?: string;
}

export default function EchoAssistant({
  initialMessage,
  initialThreadId = null,
  videoSrc,
  inputPlaceholder = "Type your command...",
  onSend,
  prompt,
}: EchoAssistantProps) {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>(
    initialMessage
      ? [{ sender: "NAO", text: initialMessage }]
      : prompt
      ? [{ sender: "NAO", text: prompt }]
      : []
  );
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(initialThreadId);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);   // ★ NEW
  const router = useRouter();

  /* ───────────────── Fetch a threadId on mount ───────────────── */
  useEffect(() => {
    if (!threadId) {
      fetch("/api/thread", { method: "POST" })
        .then((r) => r.json())
        .then((d) => setThreadId(d.threadId))
        .catch(() => setThreadId(null));
    }
  }, [threadId]);

  /* ───────────────── Auto-scroll to bottom on new message ─────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ───────────────── Handle send ──────────────────────────────── */
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    if (!userEmail && /\S+@\S+\.\S+/.test(input.trim())) setUserEmail(input.trim());

    setMessages((msgs) => [...msgs, { sender: "You", text: input }]);
    setLoading(true);

    try {
      let reply: string | undefined;
      if (onSend) {
        reply = await onSend(input);
      } else {
        if (!threadId) {
          setMessages((m) => [...m, { sender: "System", text: "NAO is initializing, please wait..." }]);
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
          setMessages((m) => [...m, { sender: "System", text: "Error: " + (await res.text()) }]);
          setLoading(false);
          setInput("");
          return;
        }
        reply = (await res.json()).reply;
      }
      setMessages((m) => [...m, { sender: "NAO", text: reply || "NAO is thinking..." }]);

      /* optional redirect logic (kept as-is) */
      if (reply && /you're all set|onboarding complete/i.test(reply)) {
        const email = userEmail || reply.match(/[\w\-.]+@[\w\-.]+\.\w+/)?.[0];
        if (email) router.push({ pathname: "/mint", query: { email } });
      }
    } catch (err) {
      setMessages((m) => [...m, { sender: "System", text: "Network error: " + (err as Error).message }]);
    }
    setInput("");
    setLoading(false);
    inputRef.current?.focus();
  };

  /* ───────────────── JSX ──────────────────────────────────────── */
  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", color: "#fff" }}>
      {videoSrc && (
        <video
          autoPlay muted loop playsInline
          style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", objectFit: "cover", zIndex: 0 }}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

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
          zIndex: 2,
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
          }}
        >
          {/* Scrollable chat box */}
          <div
            style={{
  maxHeight: "40vh",
  minHeight: "120px",
  overflowY: "auto",
  marginBottom: 8,
  scrollBehavior: "smooth",
  transition: "max-height 0.3s ease",
}}

          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  margin: "0.25rem 0",
                  color:
                    msg.sender === "NAO"
                      ? "#00fff9"
                      : msg.sender === "System"
                      ? "#ff6b6b"
                      : "#cceeff",
                  textShadow:
                    msg.sender === "NAO"
                      ? "0 0 8px #00fff9, 0 0 2px #00fff9"
                      : msg.sender === "System"
                      ? "0 0 6px #ff6b6b"
                      : "0 0 6px #338fff",
                  fontSize: 17,
                  lineHeight: 1.33,
                  letterSpacing: 0.2,
                }}
              >
                <b>{msg.sender}:</b> {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />  {/* auto-scroll target */}
          </div>

          {/* Input bar */}
          <form onSubmit={handleSend} style={{ display: "flex", gap: 8, width: "100%", pointerEvents: "auto" }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={inputPlaceholder}
              disabled={loading}
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
              }}
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
