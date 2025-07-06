"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useThread } from "@/ThreadContext";

export default function NAOCommandInput() {
  const { threadId } = useThread();
  const router = useRouter();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requiredToolCalls, setRequiredToolCalls] = useState<any[] | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const handleSubmitCredentials = async () => {
    if (!usernameInput.trim() || !passwordInput.trim() || !threadId || !runId || !requiredToolCalls) return;

    setIsLoading(true);
    const onboardToolCall = requiredToolCalls.find(call => call.function.name === 'onboardUser');

    const toolOutputs = [
      {
        tool_call_id: onboardToolCall.id,
        output: JSON.stringify({ username: usernameInput.trim(), password: passwordInput.trim() }),
      },
    ];

    try {
      const res = await fetch("/api/submit-tool-output", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: threadId, run_id: runId, tool_outputs: toolOutputs }),
      });
      const data = await res.json();
      if (data.status) {
        setRequiredToolCalls(null);
        setUsernameInput("");
        setPasswordInput("");
        await pollRunStatus(runId);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "❌ Failed to submit." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const pollRunStatus = async (currentRunId: string) => {
    let retries = 0;
    let status = "in_progress";

    while (status !== "completed" && status !== "requires_action" && retries < 30) {
      const res = await fetch("/api/run-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: threadId, run_id: currentRunId }),
      });
      const data = await res.json();
      status = data.status;

      if (status === "requires_action") {
        setRequiredToolCalls(data.required_action?.submit_tool_outputs?.tool_calls || []);
        return;
      }

      await new Promise(r => setTimeout(r, 1000));
      retries++;
    }

    if (status === "completed") {
      const replyRes = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: threadId }),
      });
      const replyData = await replyRes.json();
      setMessages(prev => [...prev, { role: "assistant", content: replyData.reply || "⚠️ NAO didn’t respond." }]);
    } else {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ NAO timed out or failed." }]);
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!input.trim() || !threadId || isLoading) return;
    const userInput = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userInput }]);
    setInput("");
    setIsLoading(true);
    setRequiredToolCalls(null);

    try {
  const user = JSON.parse(localStorage.getItem("nao_user") || "{}");
  const walletId = user.walletId;

  await fetch("/api/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      threadId: threadId, 
      message: userInput, 
      walletId // <-- include walletId here
    }),
  });

  const runRes = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId: threadId }),
  });
      const runData = await runRes.json();
      const receivedRunId = runData.run_id;
      setRunId(receivedRunId);
      if (receivedRunId) await pollRunStatus(receivedRunId);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "❌ Error communicating with NAO." }]);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 min-h-[300px] justify-center">
      {!threadId ? (
        <p className="text-white font-mono animate-pulse text-center mt-10">🕒 Initializing NAO...</p>
      ) : (
        <>
          <div className="w-full max-w-sm bg-black/40 p-3 rounded-xl h-[220px] overflow-y-auto text-sm font-mono shadow-inner space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className={`w-fit px-3 py-2 rounded-xl text-white ${msg.role === "user" ? "bg-[#00ffcc]/20 self-end text-right" : "bg-white/10 self-start text-left"}`}>
                <strong>{msg.role === "user" ? "You" : "NAO"}:</strong> {msg.content}
              </div>
            ))}
            {isLoading && !requiredToolCalls && <div className="text-white/60 text-center animate-pulse">NAO is thinking...</div>}
          </div>

          {requiredToolCalls && runId ? (
            <div className="w-full max-w-sm flex flex-col gap-2">
              <input
                type="text"
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                placeholder="Username"
                className="w-full h-[56px] px-5 text-white bg-transparent border border-[#00ccff] rounded-xl text-center font-mono placeholder:text-white"
              />
              <input
                type="password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="Password"
                onKeyDown={e => e.key === "Enter" && handleSubmitCredentials()}
                className="w-full h-[56px] px-5 text-white bg-transparent border border-[#00ccff] rounded-xl text-center font-mono placeholder:text-white"
              />
              <button
                onClick={handleSubmitCredentials}
                disabled={isLoading}
                className="w-full h-[56px] bg-[#00ccff]/20 text-white font-mono rounded-xl hover:bg-[#00ccff]/40"
              >
                Submit
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={input}
              disabled={isLoading}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="AWAKEN NAO..."
              className="w-full max-w-sm h-[56px] px-5 text-white bg-transparent border border-[#00ccff] rounded-xl text-center font-mono placeholder:text-white"
            />
          )}
        </>
      )}
    </div>
  );
}
