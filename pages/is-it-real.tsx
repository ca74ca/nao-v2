import React, { useMemo, useState } from "react";
import { CheckCircle, XCircle, Loader2, Search, Wallet, MessageSquare, Link as LinkIcon, Zap } from "lucide-react";

// Define the available modes for checking
type Mode = "review" | "wallet" | "discord" | "link";

export default function IsItReal() {
  // State variables to manage the component's behavior and data
  const [mode, setMode] = useState<Mode>("review"); // Current input mode
  const [input, setInput] = useState(""); // User's input in the textarea
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const [result, setResult] = useState<{ verdict: string; score: number; reasons: string[]; platform?: string } | null>(null); // API response result
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null); // Make sure you set user info somewhere

  // Memoized value to detect platform from a link input
  const detectedPlatform = useMemo(() => {
    if (mode !== "link") return undefined; // Only detect if mode is 'link'
    try {
      const url = new URL(input.trim()); // Attempt to parse the URL
      const hostname = url.hostname.replace(/^www\./, ""); // Remove 'www.' for cleaner matching
      if (hostname.endsWith("instagram.com")) return "instagram";
      if (hostname === "amzn.to" || hostname.endsWith("amazon.com")) return "amazon";
      if (hostname.endsWith("tiktok.com") || hostname.endsWith("tiktok-shop.com") || hostname.endsWith("shop.tiktok.com"))
        return "tiktok_shop";
    } catch {
      // Ignore invalid URL parsing errors, return undefined
    }
    return undefined;
  }, [input, mode]); // Recalculate if input or mode changes

  // Function to execute the check by calling the backend API
  const runCheck = async () => {
    setError(null);
    setResult(null);
    if (!input.trim()) {
      setError("Please paste some content to check.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/scoreEffort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          value: input,
          platformHint: detectedPlatform,
          apiKey: process.env.NEXT_PUBLIC_EVE_DEMO_KEY, // <-- Added here
        }),
      });

      if (!res.ok) {
        throw new Error(`Check failed (HTTP ${res.status})`);
      }

      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false); // Always reset loading state
    }
  };

  const handleUpgrade = async () => {
    if (!user || !user.email || !user.id) {
      setError("Please log in first to upgrade.");
      return;
    }

    try {
      const res = await fetch("/api/createCheckoutSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          userId: user.id,
          projectId: "is-it-real", // track where upgrade started
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to start checkout");

      window.location.href = data.url; // Send user to Stripe checkout
    } catch (err: any) {
      console.error("Upgrade error:", err);
      setError(err.message);
    }
  };

  // Helper function to render a tab button
  const tabBtn = (m: Mode, label: string, Icon: React.ElementType) => (
    <button
      key={m}
      onClick={() => {
        setMode(m); // Change mode
        setInput(""); // Clear input
        setResult(null); // Clear result
        setError(null); // Clear error
      }}
      className={`tab-button ${mode === m ? "tab-button--active" : ""}`} // Apply active class if selected
    >
      <Icon className="tab-button-icon" /> {/* Lucide Icon */}
      <span>{label}</span>
    </button>
  );

  // Dynamic placeholder text for the textarea based on the current mode
  const placeholder = useMemo(() => {
    switch (mode) {
      case "review":
        return "Paste a review text (e.g., 'This product changed my life!')...";
      case "wallet":
        return "Paste a wallet address (e.g., '0xAbC123...')...";
      case "discord":
        return "Paste a Discord message (e.g., 'Join our giveaway now!')...";
      case "link":
        return "Paste an Instagram / Amazon / TikTok Shop link (e.g., 'https://www.instagram.com/p/B_cDEgF_...')...";
      default:
        return "Paste content here...";
    }
  }, [mode]);

  return (
    <>
      {/* --- Global CSS Styles --- */}
      <style>{`
        /* Global & Base Styling */
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
          overscroll-behavior-y: contain;
        }

        /* Page Container */
        .page-container {
          min-height: 100vh;
          background-color: #0a0a0a; /* Deep dark background */
          color: #e0e0e0; /* Light text for contrast */
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start; /* Align content to the top */
        }

        /* Content Wrapper Card */
        .content-wrapper {
          max-width: 680px;
          width: 100%;
          margin: 40px auto;
          background-color: #1a1a1a;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6), 0 5px 15px rgba(0, 0, 0, 0.4);
          border: 1px solid #333;
          box-sizing: border-box;
        }

        /* Header Styling */
        .is-it-real-heading {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          margin-bottom: 10px;
          text-align: center;
          background: linear-gradient(to right, #60a5fa, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
        }
        .subtitle {
          color: #bbb;
          margin-bottom: 30px;
          text-align: center;
          font-size: 1.05rem;
          line-height: 1.5;
        }
        .subtitle strong {
          color: #39FF14;
          font-weight: 700;
        }

        /* Tab Buttons Container */
        .tab-buttons-container {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .tab-button {
          padding: 12px 20px;
          border-radius: 12px;
          border: 1px solid #444;
          background: #2a2a2a;
          color: #e0e0e0;
          cursor: pointer;
          transition: background 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
          font-size: 1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tab-button:hover {
          background: #3a3a3a;
          border-color: #666;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        .tab-button--active {
          background: #4f46e5;
          border-color: #4f46e5;
          color: #fff;
          box-shadow: 0 6px 15px rgba(79, 70, 229, 0.5);
        }
        .tab-button--active:hover {
          background: #4338ca;
          border-color: #4338ca;
          box-shadow: 0 8px 20px rgba(79, 70, 229, 0.6);
        }
        .tab-button-icon {
          width: 20px;
          height: 20px;
        }

        /* Textarea Styling */
        textarea {
          width: 100%;
          min-height: 160px;
          padding: 18px;
          border-radius: 12px;
          border: 1px solid #555;
          background-color: #222;
          color: #f3f4f6;
          font-size: 1.05rem;
          line-height: 1.6;
          margin-bottom: 20px;
          outline: none;
          resize: vertical;
          box-sizing: border-box;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        textarea::placeholder {
          color: #999;
          opacity: 0.7;
        }
        textarea:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.4);
        }

        /* Check Button Styling */
        .check-button {
          width: 100%;
          padding: 16px 20px;
          border-radius: 12px;
          border: none;
          font-weight: 700;
          font-size: 1.2rem;
          cursor: pointer;
          background: #39FF14;
          color: #000;
          box-shadow: 0 0 20px rgba(57, 255, 20, 0.7);
          transition: background 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .check-button:disabled {
          cursor: not-allowed;
          opacity: 0.5;
          box-shadow: none;
        }
        .check-button:hover:not(:disabled) {
          background: #50ff30;
          box-shadow: 0 0 25px rgba(57, 255, 20, 0.9);
        }
        .check-button-icon {
          width: 22px;
          height: 22px;
        }
        .check-button-icon--spin {
          animation: spin 1s linear infinite; /* Spinner animation only when loading */
        }

        /* Error Message Styling */
        .error-message {
          margin-top: 25px;
          color: #ef4444;
          font-weight: 600;
          background-color: rgba(239, 68, 68, 0.2);
          padding: 15px;
          border-radius: 10px;
          border: 1px solid #ef4444;
          text-align: center;
          font-size: 0.95rem;
        }

        /* Result Display Styling */
        .result-box {
          margin-top: 30px;
          padding: 25px;
          border: 1px solid #444;
          border-radius: 15px;
          background: #2a2a2a;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
          color: #f3f4f6;
        }
        .verdict-tag {
          display: inline-flex;
          align-items: center;
          padding: 10px 18px;
          border-radius: 10px;
          font-weight: 800;
          font-size: 1.2rem;
          margin-bottom: 15px;
          text-transform: uppercase;
        }
        .verdict-tag.real {
          background: rgba(57, 255, 20, 0.25);
          color: #39FF14;
        }
        .verdict-tag.fake {
          background: rgba(255, 193, 7, 0.3);
          color: #ffc107;
        }
        .verdict-tag-icon {
          width: 24px;
          height: 24px;
          margin-right: 10px;
        }

        .result-score {
          font-size: 1.05rem;
          font-weight: 600;
          margin-left: 12px;
          color: #bbb;
        }

        .result-platform {
          margin-top: 10px;
          color: #999;
          font-size: 0.9rem;
          font-style: italic;
        }

        .reasons-list {
          margin-top: 18px;
          padding-left: 30px;
          list-style: disc;
        }
        .reasons-list li {
          color: #ccc;
          margin-bottom: 8px;
          font-size: 0.98rem;
          line-height: 1.5;
        }

        .upgrade-notice {
          margin-top: 20px;
          font-size: 0.95rem;
          text-align: center;
          color: #999;
          border-top: 1px solid #444;
          padding-top: 15px;
        }
        .upgrade-notice a {
          color: #60a5fa;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.3s ease;
        }
        .upgrade-notice a:hover {
          color: #93c5fd;
          text-decoration: underline;
        }

        /* Platform hint for link mode */
        .platform-hint {
          margin-bottom: 15px;
          color: #999;
          font-size: 0.9rem;
          text-align: center;
          background-color: #1f2937;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #444;
          display: block;
        }
        .platform-hint strong {
          color: #f3f4f6;
        }

        /* Animations */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* --- JSX Structure --- */}
      <div className="page-container">
        <div className="content-wrapper">
          <h1 className="is-it-real-heading">Is It Real?</h1>

          <p className="subtitle">
            Paste a <strong>review</strong>, <strong>wallet</strong>, <strong>Discord message</strong>, or a <strong>link</strong> (Instagram, Amazon, TikTok Shop). We’ll check authenticity.
          </p>
          <p style={{ color: "#ccc", fontSize: "0.95rem", marginBottom: "1rem" }}>
            Paste any link from TikTok, Instagram, Reddit, YouTube, or other supported content sources.
          </p>

          {/* Tab Buttons for Mode Selection */}
          <div className="tab-buttons-container">
            {tabBtn("review", "Review", MessageSquare)}
            {tabBtn("wallet", "Wallet", Wallet)}
            {tabBtn("discord", "Discord", Zap)}
            {tabBtn("link", "Link", LinkIcon)}
          </div>

          {/* Platform detection hint for 'link' mode */}
          {mode === "link" && <div className="platform-hint">Detected platform: <strong>{detectedPlatform ?? "—"}</strong></div>}

          {/* Main Input Textarea */}
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} />

          {/* Check Button */}
          <button onClick={runCheck} disabled={loading} className="check-button">
            {loading ? <Loader2 className="check-button-icon check-button-icon--spin" /> : <Search className="check-button-icon" />}
            {loading ? " Checking…" : " Check"}
          </button>

          {/* Error Message Display */}
          {error && <div className="error-message">{error}</div>}

          {/* Result Display */}
          {result && (
            <div className="result-box">
              <div className={`verdict-tag ${result.verdict === "REAL" ? "real" : "fake"}`}>
                {result.verdict === "REAL" ? <CheckCircle className="verdict-tag-icon" /> : <XCircle className="verdict-tag-icon" />}
                <span>{result.verdict}</span>
                <span className="result-score">Score: {Math.round(result.score)}</span>
              </div>
              {result.platform && <div className="result-platform">Platform: {result.platform}</div>}
              {result.reasons?.length > 0 && (
                <ul className="reasons-list">
                  {result.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
              <div className="upgrade-notice">
                Need more checks? <a href="YOUR_STRIPE_LINK_50_CHECKS">Get 50 for $5</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
