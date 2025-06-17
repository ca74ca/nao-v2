"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface ThreadContextType {
  threadId: string | null;
}

const ThreadContext = createContext<ThreadContextType>({ threadId: null });

export const useThread = () => useContext(ThreadContext);

export const ThreadProvider = ({ children }: { children: ReactNode }) => {
  const [threadId, setThreadId] = useState<string | null>(null);

  useEffect(() => {
    const createThread = async () => {
      try {
        const res = await fetch("/api/thread", { method: "POST" });
        const data = await res.json();
        setThreadId(data.id);
        console.log("✅ Thread ID created:", data.id);
      } catch (err) {
        console.error("❌ Error creating thread", err);
      }
    };

    createThread();
  }, []);

  return (
    <ThreadContext.Provider value={{ threadId }}>
      {children}
    </ThreadContext.Provider>
  );
};
