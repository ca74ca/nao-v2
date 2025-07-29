// /pages/get-started.tsx

import { signIn } from "next-auth/react";
import Head from "next/head";

export default function GetStartedPage() {
  return (
    <>
      <Head>
        <title>Get Started - EffortNet</title>
      </Head>

      <div style={{ padding: "4rem", textAlign: "center", color: "#fff", fontFamily: "Inter, sans-serif" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Access the EffortNet API</h1>
        <p style={{ fontSize: "1.125rem", marginBottom: "2.5rem", color: "#aaa" }}>
          Sign in to get your API Key & start verifying human effort.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem" }}>
          <button
            onClick={() => signIn("google")}
            style={buttonStyle}
          >
            Sign in with Google
          </button>

          <button
            onClick={() => signIn("github")}
            style={buttonStyle}
          >
            Sign in with GitHub
          </button>
        </div>
      </div>
    </>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: "0.75rem 1.5rem",
  fontSize: "1rem",
  fontWeight: 600,
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  backgroundColor: "#39FF14",
  color: "#000",
  transition: "background-color 0.2s ease",
};
