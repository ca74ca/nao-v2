import React, { useEffect, useState } from "react";

// Helper for safe number formatting with fallback
function safeNumber(value: any): string {
  return typeof value === "number" && !isNaN(value)
    ? (value ?? 0).toLocaleString()
    : "0";
}

// Helper function to calculate EVE IQ
function calculateEVEIQ(data: any): number {
  const {
    aiReviewsFlagged = 0,
    fakeViewsBlocked = 0,
    realCreatorBlocks = 0,
    aiPostsFlagged = 0,
    cheatsDetected = 0,
    referralsBlocked = 0,
    fakeContribsFlagged = 0,
    lowEffortPostsBlocked = 0,
    verifiedEffortEvents = 0,
    effortScoreRequests = 0,
  } = data;

  const effortComponent = verifiedEffortEvents * 1.0 + effortScoreRequests * 0.25;
  const fraudComponent =
    aiReviewsFlagged * 3.5 +
    fakeViewsBlocked * 0.01 +
    realCreatorBlocks * 7.5 +
    aiPostsFlagged * 0.012 +
    cheatsDetected * 15.0 +
    referralsBlocked * 5.0 +
    fakeContribsFlagged * 2.5 +
    lowEffortPostsBlocked * 0.75;

  const rawScore = effortComponent + fraudComponent;
  return Math.min(100, Math.floor((rawScore / 1000) * 100)); // Adjusted divisor for IQ range
}

// StatBlock component now accepts a 'colorType' prop for dynamic styling
const StatBlock = ({ label, value, colorType }: { label: string; value: number | string; colorType: 'green' | 'red' | 'yellow' }) => {
  let textColor = '#eaf5e8'; // Default text color
  let boxShadowColor = 'rgba(57, 255, 20, 0.3)'; // Default green glow

  if (colorType === 'red') {
    textColor = '#FF4500'; // Orange-red for fraud
    boxShadowColor = 'rgba(255, 69, 0, 0.4)';
  } else if (colorType === 'yellow') {
    textColor = '#FFD700'; // Gold for neutral/activity
    boxShadowColor = 'rgba(255, 215, 0, 0.4)';
  } else { // green
    textColor = '#39FF14'; // Lime green for positive
    boxShadowColor = 'rgba(57, 255, 20, 0.4)';
  }

  return (
    <div
      style={{
        background: "#0b0b0b",
        border: `1px solid ${textColor}`, // Border matches text color
        borderRadius: "12px",
        padding: "1.25rem",
        textAlign: "center",
        boxShadow: `0 0 10px ${boxShadowColor}`,
        transition: "all 0.3s ease-in-out",
      }}
    >
      <h2
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          marginBottom: "0.4rem",
          color: textColor, // Apply dynamic text color
          textShadow: `0 0 10px ${boxShadowColor}`, // Glow matches box shadow
        }}
      >
        {typeof value === "number" && !isNaN(value) ? (value ?? 0).toLocaleString() : value}
      </h2>
      <p style={{ fontSize: "0.9rem", opacity: 0.85, color: '#cceeff' }}>{label}</p>
    </div>
  );
};


const GlobalStats: React.FC = () => {
  // Initial state for simulated live data, starting with impactful numbers
  const [stats, setStats] = useState({
    aiReviewsFlagged: 154320,
    fakeViewsBlocked: 8765432,
    realCreatorBlocks: 12345,
    aiPostsFlagged: 234567,
    cheatsDetected: 5678,
    referralsBlocked: 9876,
    fakeContribsFlagged: 76543,
    lowEffortPostsBlocked: 456789,
    verifiedEffortEvents: 1234567,
    effortScoreRequests: 9876543,
    fraudDollarsSaved: 123456789, // Starting in millions
    viewsPrevented: 987654321, // Starting in hundreds of millions
  });

  const [eveIQ, setEveIQ] = useState(0);
  const [clock, setClock] = useState<string>("");

  useEffect(() => {
    // Function to simulate updates for all stats
    const simulateStatsUpdate = () => {
      setStats(prevStats => ({
        aiReviewsFlagged: prevStats.aiReviewsFlagged + Math.floor(Math.random() * 100 + 10),
        fakeViewsBlocked: prevStats.fakeViewsBlocked + Math.floor(Math.random() * 50000 + 10000),
        realCreatorBlocks: prevStats.realCreatorBlocks + Math.floor(Math.random() * 5 + 1),
        aiPostsFlagged: prevStats.aiPostsFlagged + Math.floor(Math.random() * 200 + 20),
        cheatsDetected: prevStats.cheatsDetected + Math.floor(Math.random() * 2 + 1),
        referralsBlocked: prevStats.referralsBlocked + Math.floor(Math.random() * 3 + 1),
        fakeContribsFlagged: prevStats.fakeContribsFlagged + Math.floor(Math.random() * 50 + 5),
        lowEffortPostsBlocked: prevStats.lowEffortPostsBlocked + Math.floor(Math.random() * 1000 + 100),
        verifiedEffortEvents: prevStats.verifiedEffortEvents + Math.floor(Math.random() * 500 + 50),
        effortScoreRequests: prevStats.effortScoreRequests + Math.floor(Math.random() * 10000 + 1000),
        fraudDollarsSaved: prevStats.fraudDollarsSaved + Math.floor(Math.random() * 10000 + 2000), // Larger dollar increments
        viewsPrevented: prevStats.viewsPrevented + Math.floor(Math.random() * 200000 + 50000), // Larger views increments
      }));
    };

    // Set interval for simulated stats updates (every 10 seconds)
    const statsInterval = setInterval(simulateStatsUpdate, 10000);

    // Initial calculation of EVE IQ and recalculation whenever stats change
    setEveIQ(calculateEVEIQ(stats));

    // Cleanup interval on component unmount
    return () => clearInterval(statsInterval);
  }, [stats]); // Dependency array includes 'stats' to re-run EVE IQ calculation

  useEffect(() => {
    // Clock update logic (runs every second)
    const updateClock = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setClock(timeString);
    };

    updateClock(); // Initial clock update
    const timer = setInterval(updateClock, 1000); // Update every second
    return () => clearInterval(timer); // Cleanup
  }, []);

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "1.5rem",
          padding: "2rem",
          marginTop: "4rem",
          width: "100%",
          color: "#39FF14", // This applies to the overall container, individual StatBlocks override
          fontFamily: "Inter, sans-serif",
          fontWeight: 500,
        }}
      >
        {/* StatBlocks with colorType prop */}
        <StatBlock label="EVE Effort IQ Score" value={eveIQ} colorType="green" />
        <StatBlock label="Fraud Dollars Saved" value={`$${safeNumber(stats.fraudDollarsSaved)}`} colorType="green" />
        <StatBlock label="AI Reviews Flagged" value={safeNumber(stats.aiReviewsFlagged)} colorType="red" />
        <StatBlock label="Fake Views Blocked" value={safeNumber(stats.fakeViewsBlocked)} colorType="red" />
        <StatBlock label="Fake Creators Blocked" value={safeNumber(stats.realCreatorBlocks)} colorType="red" />
        <StatBlock label="AI Posts Flagged" value={safeNumber(stats.aiPostsFlagged)} colorType="red" />
        <StatBlock label="AI Cheating Caught" value={safeNumber(stats.cheatsDetected)} colorType="red" />
        <StatBlock label="Fake Referrals Stopped" value={safeNumber(stats.referralsBlocked)} colorType="red" />
        <StatBlock label="DAO Farming Flagged" value={safeNumber(stats.fakeContribsFlagged)} colorType="red" />
        <StatBlock label="Low-Effort Content Blocked" value={safeNumber(stats.lowEffortPostsBlocked)} colorType="red" />
        <StatBlock label="Verified Effort Events" value={safeNumber(stats.verifiedEffortEvents)} colorType="green" />
        <StatBlock label="Effort Score Requests" value={safeNumber(stats.effortScoreRequests)} colorType="yellow" />
        <StatBlock label="Views Prevented" value={safeNumber(stats.viewsPrevented)} colorType="green" />
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: "-1rem",
          fontSize: "1rem",
          color: "#00FF00",
          fontFamily: "monospace",
          letterSpacing: "1.5px",
        }}
      >
        {clock}
      </div>

      {/* Recipes Section */}
      <div
        style={{
          marginTop: "3rem",
          padding: "2rem",
          borderTop: "1px solid #333",
          fontFamily: "Inter, sans-serif",
          color: "#CCCCCC",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", color: "#39FF14" }}>
          Effort Verification Recipes
        </h2>

        {/* EVE's Core Verification Methods */}
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "#f6fafaff" }}>
            EVE's Core Verification Methods:
          </h3>
          <ul style={{ marginLeft: "1rem", fontSize: "0.9rem", lineHeight: "1.5" }}>
            <li>
              **1. Pattern Recognition:** Detects unusual patterns in engagement, posting, or behavior using AI-trained baselines.
            </li>
            <li>
              **2. Metadata Analysis:** Flags suspicious usernames, keywords, timestamps, and traffic sources.
            </li>
            <li>
              **3. Behavioral Heuristics:** Tracks bot-like actions (e.g., low watch time + high repost rate, mass commenting).
            </li>
            <li>
              **4. Public Signal Correlation:** Cross-checks with Reddit, GitHub, App Store, and blockchain to verify public traction or reveal spam.
            </li>
            <li>
              **5. View-to-Effort Ratio:** Calculates if content views are disproportionately high vs. creation effort or originality.
            </li>
            <li>
              **6. Real-Time Fingerprinting:** Uses browser fingerprinting, Puppeteer stealth checks, and cookie patterns to detect automation.
            </li>
            <li>
              **7. Repetition Penalty:** Penalizes cloned content, reused scripts, or spammy variations across accounts.
            </li>
            <li>
              **8. AI/LLM Watermarking:** Detects text or speech likely generated by LLMs, flagged by known token patterns and entropy tests.
            </li>
            <li>
              **9. Velocity & Timing Analysis:** Flags spikes in engagement or views that exceed human limits (e.g., 10k views in 2 minutes).
            </li>
            <li>
              **10. API Cross-Validation:** Connects to platform APIs (e.g., TikTok, Twitter, Shopify) to verify real-time authenticity and account age.
            </li>
          </ul>
        </div>

        {/* Existing Recipes */}
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
            Reddit:
            <span style={{ marginLeft: "0.5rem", color: "#FF5555" }}>
              Block karma farming bots & AI-written advice
            </span>
          </h3>
          <ul style={{ marginLeft: "1rem", fontSize: "0.9rem", lineHeight: "1.5" }}>
            <li>❌ Flags GPT-written replies used for karma farming</li>
            <li>❌ Detects repeat posting patterns across subreddits</li>
            <li>❌ Blocks fake reviews or “sockpuppet” brand mentions</li>
            <li>✅ Protects genuine community contributions</li>
            <li>✅ Saves brands and moderators from AI-fueled manipulation</li>
          </ul>
        </div>

        <div>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}> {/* Corrected font size here */}
            YouTube Shorts:
            <span style={{ marginLeft: "0.5rem", color: "#FF5555" }}>
              Spot cloned videos & stolen content
            </span>
          </h3>
          <ul style={{ marginLeft: "1rem", fontSize: "0.9rem", lineHeight: "1.5" }}>
            <li>❌ Detects re-uploaded footage across channels</li>
            <li>❌ Flags AI voiceovers reading stolen scripts</li>
            <li>❌ Identifies engagement boosts from click farms</li>
            <li>✅ Prevents monetization of non-original content</li>
            <li>✅ Supports creator IP protection</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default GlobalStats;
