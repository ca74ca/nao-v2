import React, { useEffect, useState } from "react";

export default function WhoopLiveData() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWhoop() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/whoop-data");
        if (!res.ok) throw new Error("Failed to fetch WHOOP data.");
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e.message || "Unknown error");
      }
      setLoading(false);
    }
    fetchWhoop();
    // Optionally poll every N seconds for "live"
    // const interval = setInterval(fetchWhoop, 60000);
    // return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading WHOOP data...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;
  if (!data) return <div>No data from WHOOP.</div>;

  return (
    <div style={{
      background: "#101b2d",
      border: "1px solid #2D9CFF",
      borderRadius: 12,
      padding: 18,
      margin: "18px 0",
      color: "#fff",
      boxShadow: "0 0 24px #2D9CFF55",
      maxWidth: 400
    }}>
      <h3 style={{ color: "#2D9CFF", marginBottom: 12 }}>WHOOP Live Data</h3>
      <div><strong>Name:</strong> {data.profile?.user?.first_name} {data.profile?.user?.last_name}</div>
      <div><strong>Recovery Score:</strong> {data.recovery?.score ?? "--"}</div>
      <div><strong>Strain Score:</strong> {data.strain?.score ?? "--"}</div>
      <div><strong>Sleep Score:</strong> {data.sleep?.score ?? "--"}</div>
      {/* Add more fields as desired */}
    </div>
  );
}