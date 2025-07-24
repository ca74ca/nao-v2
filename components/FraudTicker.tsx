import React, { useEffect, useState } from "react";

export default function FraudTicker() {
  const [stats, setStats] = useState<{
    fraudDollarsSaved: number;
    fakeTiktoksBlocked: number;
    viewsPrevented: number;
  } | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/getFraudStats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch fraud stats:", err);
      }
    }
    fetchStats();
  }, []);

  if (!stats) return null;

  return (
    <div className="w-full overflow-hidden bg-black py-2 border-t border-b border-green-500">
      <div className="animate-marquee text-green-400 font-medium text-sm whitespace-nowrap px-4">
        ${stats.fraudDollarsSaved.toFixed(2)} saved from fraud&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
        {stats.fakeTiktoksBlocked} fake TikToks blocked&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
        {stats.viewsPrevented.toLocaleString()} fraudulent views prevented
      </div>
    </div>
  );
}
