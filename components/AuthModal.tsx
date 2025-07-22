import React, { useState } from "react";
import { useRouter } from "next/router";

const AuthModal = ({ onClose }: { onClose: () => void }) => {
  const router = useRouter();
  const [tab, setTab] = useState<"signup" | "login">("signup");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");

    if (tab === "signup" && (!form.username || !form.email || !form.password)) {
      setError("All fields required for signup.");
      return;
    }

    if (tab === "login" && (!form.email || !form.password)) {
      setError("Email and password required.");
      return;
    }

    setLoading(true);

    const endpoint = tab === "signup" ? "/api/onboardUser" : "/api/loginUser";
    const body = tab === "signup"
      ? { username: form.username, email: form.email, password: form.password }
      : { email: form.email, password: form.password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("nao_user", JSON.stringify(data.user));
        router.push("/mint");
      } else {
        setError(data?.message || "Login / Signup failed.");
      }
    } catch (err) {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.9)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 50,
    }}>
      <div style={{
        background: "#0e192a",
        padding: "3rem",
        borderRadius: "1rem",
        boxShadow: "0 0 30px rgba(200, 200, 200, 0.7)", // soft grey glow
        width: "90%",
        maxWidth: 420,
        color: "#cceeff",
        textAlign: "center",
      }}>
        {/* Big NAO Logo */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <span
            style={{
              display: "inline-block",
              transform: "rotate(45deg)",
              width: "50px",
              height: "50px",
              borderRight: "5px solid white",
              borderTop: "5px solid white",
              boxShadow: "0 0 20px lime",
            }}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginBottom: "2rem" }}>
          <button onClick={() => { setTab("signup"); setError(""); }} style={{ ...tabButtonStyle, color: tab === "signup" ? "lime" : "#666" }}>
            Sign Up
          </button>
          <button onClick={() => { setTab("login"); setError(""); }} style={{ ...tabButtonStyle, color: tab === "login" ? "lime" : "#666" }}>
            Login
          </button>
        </div>

        {/* Sign Up */}
        {tab === "signup" && (
          <>
            <input name="username" placeholder="Username" onChange={handleChange} style={inputStyle} />
            <input name="email" placeholder="Email" onChange={handleChange} style={inputStyle} />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} style={inputStyle} />
            <button onClick={handleSubmit} style={submitButtonStyle} disabled={loading}>
              {loading ? "Creating..." : "Create My Account"}
            </button>
          </>
        )}

        {/* Login */}
        {tab === "login" && (
          <>
            <input name="email" placeholder="Email" onChange={handleChange} style={inputStyle} />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} style={inputStyle} />
            <button onClick={handleSubmit} style={submitButtonStyle} disabled={loading}>
              {loading ? "Logging In..." : "Log In and Start Earning"}
            </button>
          </>
        )}

        {error && <p style={{ color: "red", marginTop: "1rem", fontSize: "0.9rem" }}>{error}</p>}

        <button
          onClick={onClose}
          style={{
            marginTop: "2rem",
            padding: "0.75rem 2rem",
            background: "rgba(255, 255, 255, 0.1)",
            color: "#cceeff",
            border: "1px solid #cceeff",
            borderRadius: "9999px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.9rem",
            transition: "all 0.3s",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

const inputStyle = {
  width: "100%",
  padding: "0.85rem",
  marginBottom: "1rem",
  background: "#0e192a",
  border: "1px solid lime",
  borderRadius: "0.5rem",
  color: "#cceeff",
  fontSize: "0.95rem",
};

const submitButtonStyle = {
  width: "100%",
  padding: "1rem",
  background: "linear-gradient(90deg, lime 0%, #39FF14 100%)",
  color: "#000",
  border: "none",
  borderRadius: "9999px",
  fontWeight: 700,
  cursor: "pointer",
  marginTop: "0.5rem",
  boxShadow: "0 0 20px lime",
  fontSize: "1rem",
};

const tabButtonStyle = {
  background: "none",
  border: "none",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "1.1rem",
};

export default AuthModal;