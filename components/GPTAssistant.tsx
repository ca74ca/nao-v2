import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/router";

type Message = {
  sender: "User" | "NAO";
  text: string;
};

export default function GPTAssistant({ initialPrompt }: { initialPrompt: string }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { sender: "NAO", text: initialPrompt }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const threadIdRef = useRef<string | null>(null);

  // STEP 1: Create or load thread
  useEffect(() => {
    const existing = localStorage.getItem("nao_thread_id");
    if (existing) {
      threadIdRef.current = existing;
    } else {
      fetch("/api/thread", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          localStorage.setItem("nao_thread_id", data.threadId);
          threadIdRef.current = data.threadId;
        });
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMsg = { sender: "User", text: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    const thread_id = threadIdRef.current;
    if (!thread_id) return;

    // STEP 2: Send message
    await fetch("/api/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_id, content: input })
    });

    // STEP 3: Trigger assistant
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_id })
    });
    const { run_id } = await res.json();

    // STEP 4: Poll until complete
    let status = "queued";
    let toolCalls = [];
    while (status !== "completed" && status !== "failed") {
      const r = await fetch("/api/run-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id, run_id })
      });
      const data = await r.json();
      status = data.status;
      toolCalls = data.tool_calls;
      if (status !== "completed") await new Promise((res) => setTimeout(res, 1000));
    }

    // STEP 5: Handle tool calls (onboardUser, etc.)
    for (const tool of toolCalls || []) {
      const fn = tool.function.name;
      const args = JSON.parse(tool.function.arguments);

      if (fn === "createUserAndWallet") {
        const result = await fetch("/api/createUserAndWallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(args)
        });
        const data = await result.json();

        // Save user to localStorage
        localStorage.setItem("nao_user", JSON.stringify(data.user));

        await fetch("/api/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            thread_id,
            run_id,
            tool_call_id: tool.id,
            output: JSON.stringify({ success: true })
          })
        });

        setTimeout(() => router.push("/final-onboarding"), 1000);
      }

      // Add more tool functions here if needed
    }

    // STEP 6: Get assistant response
    const threadRes = await fetch("/api/thread-messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_id })
    });
    const msgData = await threadRes.json();
    const last = msgData.messages.at(-1)?.content?.[0]?.text?.value;
    if (last) setMessages((prev) => [...prev, { sender: "NAO", text: last }]);

    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="h-64 overflow-y-auto bg-neutral-900 rounded-xl p-4 text-white">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 ${msg.sender === "User" ? "text-right" : "text-left"}`}>
            <span className="font-bold">{msg.sender}:</span> {msg.text}
          </div>
        ))}
      </div>
      <div className="flex space-x-2">
        <input
          className="flex-1 px-4 py-2 rounded-lg text-black"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type to NAO..."
          disabled={loading}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          onClick={sendMessage}
          disabled={loading}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
