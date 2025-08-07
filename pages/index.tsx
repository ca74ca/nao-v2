import React, { useState } from "react";
import Head from "next/head";
import GlobalStats from "../components/GlobalStats";
import AuthModal from "../components/AuthModal";
import LeftColumnLiveFeed from "../components/LeftColumnLiveFeed";
import FraudStatsDisplay from "../components/FraudStatsDisplay";
import EffortNetStatsBox from "../components/EffortNetStatsBox";
import RedditFraudTracker from "../components/RedditFraudTracker";
import { useRouter } from "next/router";
import { useSession, signIn } from "next-auth/react";

export default function Home() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const { data: session } = useSession();

  // Define your highest impact metrics here for the headline and subheading.
  const projectedEcommerceFraud2029 = "$107 Billion";
  const projectedAdFraud2028 = "$172 Billion";
  const costPer100Fraud = "$207";
  const projectedAIFraud2027 = "$40 Billion";

  // Button logic:  
  // If user is authenticated, go to /get-started; else open sign-in (Google/GitHub popup)
  const handleSecureClick = () => {
    if (session) {
      router.push("/get-started");
    } else {
      signIn(undefined, { callbackUrl: "/get-started" });
    }
  };

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>EffortNet</title>
        <meta name="description" content="EffortNet: Stop the AI Fraud Epidemic. Protect your revenue with our unique Human Effort Score." />
      </Head>

      {/* Full Screen Background */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundImage: "url('/index_background_4.png')",
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <header style={{ padding: "2rem 1.5rem 0", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <h1
            style={{
              color: "#f6fafaff",
              fontWeight: 800,
              fontSize: "clamp(1.5rem, 5vw, 2.75rem)",
              letterSpacing: "0.05em",
              lineHeight: 1.2,
              maxWidth: "900px",
            }}
          >
            EVE: EffortIQ.
            <br />
            Stop the <strong>{projectedEcommerceFraud2029}</strong> AI Fraud Epidemic.
          </h1>
        </header>

        <div
          style={{
            padding: "0 1.5rem 2rem",
            color: "#cceeff",
            fontWeight: 600,
            fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
            textAlign: "center",
            maxWidth: "700px",
            margin: "1rem auto 0",
            lineHeight: 1.5,
          }}
        >
          AI-driven fraud is projected to cost industries <strong>{projectedAdFraud2028}</strong> in ad spend and <strong>{projectedAIFraud2027}</strong> in financial losses. For every $100 of fraud, it costs businesses <strong>{costPer100Fraud}</strong>.
          <br />
          EVE's unique <strong>Human Effort Score</strong> identifies genuine interactions, blocks sophisticated fakes, and recovers your wasted spending.
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "2rem",
            width: "100%",
            padding: "0 1.5rem",
            boxSizing: "border-box",
          }}
        >
          <FraudStatsDisplay />
        </div>

        {/* CTA Button and supporting text */}
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <p
            style={{
              fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
              color: "#fff",
              marginBottom: "1rem",
              lineHeight: 1.5,
              maxWidth: 480,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Fraud defense as infrastructure — for apps, feeds, and reward engines.
            <br />
            <strong>Start protecting your revenue today.</strong>
          </p>

          <button
            onClick={handleSecureClick}
            style={{
              display: "inline-block",
              background: "linear-gradient(90deg, #f0f4f6ff, #39FF14)",
              color: "#000",
              fontWeight: "700",
              fontSize: "clamp(0.9rem, 3vw, 1.1rem)",
              padding: "1rem 2rem",
              borderRadius: "999px",
              textDecoration: "none",
              boxShadow: "0 0 18px #39FF14",
              transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
              cursor: "pointer",
              border: "none",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 0 28px #00ff87";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 0 18px #39FF14";
            }}
          >
            SECURE YOUR PLATFORM NOW
          </button>
        </div>

        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 1280,
            margin: "4rem auto 0",
            padding: "2rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <GlobalStats />
          <RedditFraudTracker />
          <div style={{ marginTop: "3rem", width: "100%" }}>
            <EffortNetStatsBox />
          </div>
          <div style={{ width: "100%", maxWidth: "400px", margin: "2rem auto" }}>
            <LeftColumnLiveFeed />
          </div>
        </div>

        {showModal && <AuthModal onClose={() => setShowModal(false)} />}
      </div>
    </>
  );
}