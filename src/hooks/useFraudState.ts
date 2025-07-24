import { useEffect, useState } from "react";

type FraudStats = {
  fraudDollarsSaved: number;
  fakeTiktoksBlocked: number;
  viewsPrevented: number;
};

export function useFraudState() {
  const [stats, setStats] = useState<FraudStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/fraud-stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch fraud stats:", err);
      }
    };

    fetchStats();

    const interval = setInterval(fetchStats, 10000); // ⏱️ update every 10s
    return () => clearInterval(interval);
  }, []);

  return stats;
}

