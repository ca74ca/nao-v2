import React, { useState, useEffect } from 'react';

// Helper for safe number formatting with fallback
function safeNumber(value: any): string {
  return typeof value === "number" && !isNaN(value)
    ? value.toLocaleString()
    : "0";
}

// Helper function to format currency for millions/thousands
const formatCurrency = (num: number): string => {
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(1)}k`;
  }
  return `$${num.toLocaleString('en-US')}`;
};

// Helper function to format large numbers for thousands/millions
const formatLargeNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}k`;
  }
  return num.toLocaleString('en-US');
};

// StatBlock component (reused from GlobalStats for consistency)
const StatBlock = ({ label, value }: { label: string; value: number | string }) => (
  <div
    style={{
      background: "#0b0b0b",
      border: "1px solid #1f1f1f",
      borderRadius: "12px",
      padding: "1.25rem",
      textAlign: "center",
      boxShadow: "0 0 10px rgba(57, 255, 20, 0.3)",
      transition: "all 0.3s ease-in-out",
    }}
  >
    <h2
      style={{
        fontSize: "2rem",
        fontWeight: 700,
        marginBottom: "0.4rem",
        color: "#eaf5e8",
        textShadow: "0 0 10px rgba(248, 251, 248, 0.6)",
      }}
    >
      {typeof value === "number" && !isNaN(value) ? value.toLocaleString() : value}
    </h2>
    <p style={{ fontSize: "0.9rem", opacity: 0.85 }}>{label}</p>
  </div>
);

const RedditFraudTracker: React.FC = () => {
  // Initial state for Reddit-specific fraud stats, starting at 0
  // The backend API will provide the initial (and updating) high values.
  const [redditStats, setRedditStats] = useState({
    karmaFarmingBotsFlagged: 0,
    aiWrittenRepliesBlocked: 0,
    spamPostAttempts: 0,
    fraudulentEngagementsPrevented: 0,
    redditDollarsSaved: 0,
    postsAnalyzed: 0,
  });

  useEffect(() => {
    // Function to fetch processed Reddit fraud stats from your backend API
    const fetchLiveRedditFraudStats = async () => {
      try {
        // Call your new backend API route
        const res = await fetch('/api/reddit-data-processor');
        const apiResponse = await res.json();

        if (apiResponse.success && apiResponse.data) {
          // Update the state with the data received from the backend
          setRedditStats(apiResponse.data);
        } else {
          console.error("Failed to fetch processed Reddit fraud stats:", apiResponse.error);
          // Optionally, fall back to client-side simulation if backend fails
          // For a pitch, you might want to ensure some numbers are always visible.
        }
      } catch (error) {
        console.error("Error fetching Reddit fraud stats from backend:", error);
        // Handle network errors or other issues
      }
    };

    // Fetch stats initially when the component mounts
    fetchLiveRedditFraudStats();
    // Set up an interval to fetch stats every 10 seconds
    const interval = setInterval(fetchLiveRedditFraudStats, 10000); // Fetch every 10 seconds

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(interval);
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <div
      style={{
        backgroundColor: '#0a0a0a', // Dark background
        borderRadius: '16px',
        padding: '2rem',
        border: '2px solid #FF4500', // Orange-red border to signify fraud focus
        boxShadow: '0 0 30px rgba(255, 69, 0, 0.6)', // Intense orange-red glow
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '700px', // Max width for the display box
        boxSizing: 'border-box',
        textAlign: 'center',
        marginTop: '3rem', // Add some margin from elements above
      }}
    >
      <h2
        style={{
          color: '#f6fafaff',
          fontSize: 'clamp(1.3rem, 3.5vw, 2rem)',
          fontWeight: 700,
          marginBottom: '1.5rem',
          textShadow: '0 0 15px #f6fafaff',
        }}
      >
        EVE on Reddit: Live Fraud Interceptions
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", // Responsive grid
          gap: "1.5rem",
          width: '100%',
        }}
      >
        {/* Metrics showing EVE's measures and fraud savings */}
        <StatBlock label="Posts Analyzed" value={formatLargeNumber(redditStats.postsAnalyzed)} />
        <StatBlock label="Karma Farming Bots Flagged" value={formatLargeNumber(redditStats.karmaFarmingBotsFlagged)} />
        <StatBlock label="AI-Written Replies Blocked" value={formatLargeNumber(redditStats.aiWrittenRepliesBlocked)} />
        <StatBlock label="Spam Post Attempts" value={formatLargeNumber(redditStats.spamPostAttempts)} />
        <StatBlock label="Fraudulent Engagements Prevented" value={formatLargeNumber(redditStats.fraudulentEngagementsPrevented)} />
        <StatBlock label="Dollars Saved on Reddit" value={formatCurrency(redditStats.redditDollarsSaved)} />
      </div>

      <p style={{ color: '#888', fontSize: '0.75rem', marginTop: '1.5rem' }}>
        *Live Reddit data is fetched from EVE's backend and processed for demonstration.
      </p>
    </div>
  );
};

export default RedditFraudTracker;
