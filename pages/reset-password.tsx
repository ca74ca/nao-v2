import React, { useState } from "react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/resetPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          newPassword,
        }),
      });

      if (!res.ok) {
        setError("Failed to reset.");
      } else {
        setDone(true);
      }
    } catch (err) {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "5rem", textAlign: "center" }}>
      <h1 style={{ color: "lime", marginBottom: "2rem" }}>Reset Your Password</h1>
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          padding: "0.75rem",
          width: "100%",
          maxWidth: "300px",
          marginBottom: "1rem",
          borderRadius: "0.5rem",
        }}
      />
      <br />
      <input
        type="password"
        placeholder="New password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        style={{
          padding: "0.75rem",
          width: "100%",
          maxWidth: "300px",
          marginBottom: "1rem",
          borderRadius: "0.5rem",
        }}
      />
      <br />
      <button
        onClick={handleReset}
        disabled={loading || done}
        style={{
          padding: "1rem 2rem",
          background: "lime",
          color: "black",
          border: "none",
          borderRadius: "9999px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {loading ? "Resetting..." : done ? "Password Reset ✅" : "Reset Password"}
      </button>
      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
      {done && (
        <p style={{ color: "lime", marginTop: "2rem", fontSize: "1.1rem" }}>
          Password reset! You can now log in.
        </p>
      )}
    </div>
  );
}
