import React, { useState } from "react";
import { useRouter } from "next/router"; // For Next.js Pages Router

interface Props {
  email: string;
  defaultUsername?: string;
}

export default function NaoOnboardingForm({ email, defaultUsername = "" }: Props) {
  const [username, setUsername] = useState(defaultUsername);
  const [healthGoals, setHealthGoals] = useState("");
  const [connectWearables, setConnectWearables] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/onboardUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, healthGoals, connectWearables }),
      });
      const data = await res.json();
      if (!res.ok || !data) {
        setError(data.message || "Onboarding failed");
        setLoading(false);
        return;
      }
      // --- Store wallet address in localStorage if present ---
      if (data.walletAddress) {
        localStorage.setItem("wallet", data.walletAddress);
      }
      // Redirect to the backend's suggested URL (handles both /mint and /final-onboarding)
      router.push(data.redirectUrl || "/final-onboarding");
    } catch (err: any) {
      setError(err.message || "Onboarding failed");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "2rem auto", background: "#112", padding: 30, borderRadius: 20 }}>
      <h2 style={{ color: "#00fff9", textAlign: "center" }}>Complete Your NAO Onboarding</h2>
      <label>
        NAO Username:
        <input
          type="text"
          required
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{ width: "100%", padding: 8, margin: "8px 0" }}
        />
      </label>
      <label>
        Health Goals:
        <input
          type="text"
          required
          value={healthGoals}
          onChange={e => setHealthGoals(e.target.value)}
          placeholder="(e.g. Run a marathon)"
          style={{ width: "100%", padding: 8, margin: "8px 0" }}
        />
      </label>
      <label>
        Connect Wearables:
        <input
          type="checkbox"
          checked={connectWearables}
          onChange={e => setConnectWearables(e.target.checked)}
          style={{ marginLeft: 8 }}
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%", marginTop: 16, padding: 12, background: "#00fff9", color: "#012", fontWeight: 700, border: "none", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        {loading ? "Onboarding..." : "Complete Onboarding"}
      </button>
      {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
    </form>
  );
}
