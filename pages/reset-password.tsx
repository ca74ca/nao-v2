import React, { useState } from "react";

type Props = {
  setTab: (tab: "login" | "signup" | "reset") => void;
};

export default function ResetPassword({ setTab }: Props) {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    setError("");

    if (!email || !newPassword) {
      setError("Please enter both email and new password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/resetPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Failed to reset password.");
      } else {
        setDone(true);
        setTimeout(() => {
          setTab("login");
        }, 2000);
      }
    } catch (err) {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "1rem", color: "#cceeff" }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Reset Password</h2>

      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: "0.75rem", marginBottom: "0.75rem", width: "100%" }}
      />

      <input
        type="password"
        placeholder="New password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        style={{ padding: "0.75rem", marginBottom: "1rem", width: "100%" }}
      />

      <button
        onClick={handleReset}
        disabled={loading || done}
        style={{
          padding: "1rem",
          width: "100%",
          backgroundColor: "lime",
          color: "black",
          borderRadius: "9999px",
          fontWeight: "bold",
          border: "none",
          cursor: "pointer",
        }}
      >
        {loading ? "Resetting..." : done ? "✅ Reset!" : "Reset Password"}
      </button>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}

      {done && (
        <p style={{ color: "lime", marginTop: "1rem" }}>
          ✅ Password updated. Redirecting to login...
        </p>
      )}
    </div>
  );
}
