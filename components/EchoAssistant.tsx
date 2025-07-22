import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";

interface EchoAssistantProps {
  initialMessage?: string;
  initialThreadId?: string | null;
  inputPlaceholder?: string;
  onSend?: (input: string) => Promise<string>;
  prompt?: string;
}

export default function EchoAssistant({
  initialMessage,
  initialThreadId = null,
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

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!threadId) {
      fetch("/api/thread", { method: "POST" })
        .then((r) => r.json())
        .then((d) => setThreadId(d.threadId))
        .catch(() => setThreadId(null));
    }
  }, [threadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

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
        const user = JSON.parse(localStorage.getItem("nao_user") || "{}");
        const walletId = user.walletId;
        const res = await fetch("/api/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId, message: input, walletId }),
        });
        if (!res.ok) {
          const errorText = await res.text();
          setMessages((m) => [...m, { sender: "System", text: "Error: " + errorText }]);
          setLoading(false);
          setInput("");
          return;
        }
        reply = (await res.json()).reply;
      }
      setMessages((m) => [...m, { sender: "NAO", text: reply || "NAO is thinking..." }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { sender: "System", text: "Network error: " + (err as Error).message },
      ]);
    }
    setInput("");
    setLoading(false);
    inputRef.current?.focus();
  };

  return (
    <div style={{
      maxWidth: 700,
      width: "100%",
      height: "80vh",
      margin: "2rem auto",
      padding: "1rem",
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: 20,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      color: "#fff",
      fontFamily: "Inter, sans-serif",
    }}>
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "1rem",
        marginBottom: "1rem",
        background: "#111",
        borderRadius: "12px",
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            margin: "0.75rem 0",
            color: "#fff",
            fontSize: "1.1rem",
            lineHeight: "1.5",
          }}>
            <b style={{ color: "#aaa" }}>{msg.sender}:</b> {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: "flex", gap: "1rem", paddingTop: "1rem" }}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={inputPlaceholder}
          disabled={loading}
          style={{
            flex: 1,
            padding: "1rem",
            borderRadius: "10px",
            background: "#111",
            color: "#fff",
            border: "1px solid #444",
            outline: "none",
            fontSize: "1.1rem",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "1rem 2rem",
            borderRadius: "10px",
            backgroundColor: "#fff",
            color: "#000",
            fontWeight: "bold",
            fontSize: "1.1rem",
            cursor: loading ? "not-allowed" : "pointer",
            border: "none",
          }}
        >
          {loading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
