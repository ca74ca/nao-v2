import React, { useEffect, useState } from "react";
import useFraudStats from "../utils/useFraudStats";

export default function FraudStats() {
  const [stats, setStats] = useState<{
    fraudDollarsSaved: number;
    fakeTiktoksBlocked: number;
    viewsPrevented: number;
  } | null>(null);

  useEffect(() => {
    async function fetchStats() {
      // Fetch fraud stats from an API endpoint instead of using useFraudStats directly
      const response = await fetch("/api/fraud-stats");
      const result = await response.json();
      setStats(result);
    }
    fetchStats();
  }, []);

  if (!stats) {
    return (
      <div className="bg-black p-4 rounded-lg border border-green-500 shadow-lg w-full max-w-xl mx-auto mt-6">
        <h2 className="text-white text-xl font-bold mb-2">🛡️ Fraud Prevention (Last 24h)</h2>
        <div className="text-green-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-black p-4 rounded-lg border border-green-500 shadow-lg w-full max-w-xl mx-auto mt-6">
      <h2 className="text-white text-xl font-bold mb-2">🛡️ Fraud Prevention (Last 24h)</h2>
      <div className="text-green-400 text-lg">
        ${stats.fraudDollarsSaved.toFixed(2)} saved from fraud
      </div>
      <div className="text-red-500 text-sm">
        {stats.fakeTiktoksBlocked} Fake TikToks Blocked
      </div>
      <div className="text-red-500 text-sm">
        {(stats.viewsPrevented ?? 0).toLocaleString()} Views Prevented from Monetization Fraud
      </div>
    </div>
  );
}
