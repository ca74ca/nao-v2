import { useEffect, useState } from "react";

export type FraudStats = {
  fraudDollarsSaved: number;
  fakeTiktoksBlocked: number;
  viewsPrevented: number;
};

export function useFraudState(): FraudStats | null {
  const [stats, setStats] = useState<FraudStats | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const res = await fetch("/api/fraud-stats");
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const data = await res.json();

        if (
          typeof data.fraudDollarsSaved === "number" &&
          typeof data.fakeTiktoksBlocked === "number" &&
          typeof data.viewsPrevented === "number"
        ) {
          if (isMounted) {
            setStats(data);
          }
        } else {
          console.warn("Unexpected data shape in /api/fraud-stats:", data);
        }
      } catch (err) {
        console.error("Failed to fetch fraud stats:", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return stats;
}
