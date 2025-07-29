// pages/dev.tsx
import Head from "next/head";
import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

const DevPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>NAOs Eve Engine API - Developer Docs</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <main style={styles.container}>
        {/* Hero */}
        <section style={styles.section}>
          <h1 style={styles.heading}>NAOs Eve Engine API</h1>
          <h2 style={styles.subHeading}>Quantify Human Effort. Unmask AI Content.</h2>
          <p style={styles.description}>
            Integrate the NAOs Eve Engine to precisely detect and grade the authenticity of digital content and user
            interactions, empowering your platform to combat AI-generated fraud and build undeniable trust.
          </p>
          <div style={styles.buttonContainer}>
            <a href="/get-started" style={styles.button}>
              Get Started with the API
            </a>
            <a href="/api-docs" style={styles.buttonSecondary}>
              View API Reference
            </a>
          </div>
        </section>

        {/* Problem & Solution */}
        <section style={styles.section}>
          <h2>The Growing Authenticity Crisis</h2>
          <p>
            Generative AI has flooded digital platforms with synthetic content — from deepfakes and fake reviews to bot
            accounts and AI-written spam. This costs industries billions and undermines user trust.
          </p>
          <h3>Introducing the NAOs Eve Engine API</h3>
          <p>
            Our API delivers a real-time "Human Effort Score" from 0–100 using proprietary signal detection on text,
            images, accounts, and interactions.
          </p>
          <ul>
            <li>⚬ Detect AI-generated content across platforms</li>
            <li>⚬ Quantify human vs machine effort at scale</li>
            <li>⚬ Automate fraud defense across your product ecosystem</li>
          </ul>
        </section>

        {/* Use Cases */}
        <section style={styles.section}>
          <h2>Use Cases Across Industries</h2>
          <h3>E-commerce Platforms</h3>
          <p>
            Detect fake reviews, AI-generated product images, and fraudulent accounts. Save millions in returns and
            restore user confidence.
          </p>
          <h3>Social Media / Streaming</h3>
          <p>
            Identify bots, spam, and deepfakes in real-time. Protect ad revenue and authenticity.
          </p>
          <h3>AdTech</h3>
          <p>
            Score impressions/clicks for real-user confidence. Optimize campaign spend.
          </p>
          <h3>Publishing & Education</h3>
          <p>
            Flag AI-written essays or deepfaked news articles. Preserve originality and protect IP.
          </p>
        </section>

        {/* API Example */}
        <section style={styles.section}>
          <h2>Core Endpoint</h2>
          <p>POST /v1/analyze</p>

          <h3>Request</h3>
          <SyntaxHighlighter language="json" style={atomDark}>
            {`{
  "content_type": "text",
  "data": "This is an example text. Can you tell if a human wrote it?",
  "context": {
    "user_id": "user123",
    "platform": "tiktok",
    "timestamp": "2025-07-29T14:30:00Z"
  }
}`}
          </SyntaxHighlighter>

          <h3>Response</h3>
          <SyntaxHighlighter language="json" style={atomDark}>
            {`{
  "analysis_id": "NAOS-EVE-123456789",
  "human_effort_score": 92.5,
  "is_likely_human": true,
  "ai_detection_confidence": 0.075,
  "detected_elements": [
    {"type": "textual_pattern", "score_impact": -5, "description": "Minor repetitive phrasing"},
    {"type": "semantic_cohesion", "score_impact": +10, "description": "Strong human-like narrative flow"}
  ],
  "recommendation": "Allow (High Confidence)",
  "timestamp": "2025-07-29T14:30:05Z"
}`}
          </SyntaxHighlighter>
          <p style={{ marginTop: "1rem" }}>
            Ready to integrate?{" "}
            <a href="/quickstart" style={{ textDecoration: "underline", color: "#39FF14" }}>
              View the Quickstart Guide →
            </a>
          </p>
        </section>

        {/* Pricing */}
        <section style={styles.section}>
          <h2>Pricing</h2>
          <p>
            Start free. Scale as you grow. Usage-based pricing by API call. Enterprise support available for high
            volume integrations.
          </p>
        </section>

        {/* Footer Resources */}
        <footer style={styles.footer}>
          <h3>Resources & Support</h3>
          <ul>
            <li>
              <a href="/quickstart">Quickstart Guide</a>
            </li>
            <li>
              <a href="/api-docs">API Reference</a>
            </li>
            <li>
              <a href="/faq">FAQ</a>
            </li>
            <li>
              <a href="/support">Contact Support</a>
            </li>
            <li>
              <a href="/changelog">Changelog</a>
            </li>
            <li>
              <a href="/privacy">Privacy Policy</a>
            </li>
          </ul>
        </footer>
      </main>
    </>
  );
};

const styles = {
  container: {
    fontFamily: "Inter, sans-serif",
    color: "#fff",
    backgroundColor: "#000",
    padding: "2rem",
    maxWidth: "960px",
    margin: "0 auto",
  },
  section: {
    marginBottom: "3rem",
  },
  heading: {
    fontSize: "2.25rem",
    fontWeight: 700,
    marginBottom: "0.5rem",
  },
  subHeading: {
    fontSize: "1.25rem",
    fontWeight: 500,
    marginBottom: "1.5rem",
    color: "#ccc",
  },
  description: {
    fontSize: "1.1rem",
    marginBottom: "1.5rem",
  },
  buttonContainer: {
    display: "flex",
    flexWrap: "wrap" as "wrap",
    gap: "1rem",
  },
  button: {
    backgroundColor: "#39FF14",
    color: "#000",
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    fontWeight: 600,
    textDecoration: "none",
  },
  buttonSecondary: {
    backgroundColor: "#222",
    color: "#fff",
    padding: "0.75rem 1.5rem",
    border: "1px solid #39FF14",
    borderRadius: "6px",
    textDecoration: "none",
  },
  footer: {
    borderTop: "1px solid #333",
    paddingTop: "2rem",
  },
};

export default DevPage;
