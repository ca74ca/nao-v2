import React, { useState, useEffect } from 'react';

// FraudStatsDisplay component to show live-updating fraud prevention metrics.
// This component simulates real-time data for demonstration purposes.
// In a production environment, these numbers would be fetched from your
// /api/fraud-stats endpoint and updated accordingly.
const FraudStatsDisplay = () => {
  // Initial state for the simulated live metrics.
  // Starting with values that quickly reach "millions" or "tens of millions"
  // to immediately convey large-scale impact.
  const [fraudDollarsSaved, setFraudDollarsSaved] = useState(1_800_000); // Starting at 1.8 million
  const [fakeTiktoksBlocked, setFakeTiktoksBlocked] = useState(3_400);   // Starting at 3.4 thousand
  const [viewsPrevented, setViewsPrevented] = useState(24_800_000); // Starting at 24.8 million

  useEffect(() => {
    // Interval for fraudDollarsSaved (updates frequently with larger increments)
    const dollarsInterval = setInterval(() => {
      setFraudDollarsSaved(prev => prev + Math.floor(Math.random() * 5000 + 1000)); // Add $1k-$5k per update
    }, 500); // Update every 0.5 seconds

    // Interval for fakeTiktoksBlocked (updates less frequently, smaller increments)
    const tiktoksInterval = setInterval(() => {
      setFakeTiktoksBlocked(prev => prev + Math.floor(Math.random() * 5 + 1)); // Add 1-5 per update
    }, 1500); // Update every 1.5 seconds

    // Interval for viewsPrevented (updates frequently with larger increments)
    const viewsInterval = setInterval(() => {
      setViewsPrevented(prev => prev + Math.floor(Math.random() * 50000 + 10000)); // Add 10k-50k per update
    }, 700); // Update every 0.7 seconds

    // Cleanup function to clear intervals when the component unmounts
    return () => {
      clearInterval(dollarsInterval);
      clearInterval(tiktoksInterval);
      clearInterval(viewsInterval);
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // Helper function to format currency for millions/billions
  const formatCurrency = (num) => {
    if (num >= 1_000_000_000) {
      return `$${(num / 1_000_000_000).toFixed(2)}B`;
    }
    if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(2)}M`;
    }
    return `$${num.toLocaleString('en-US')}`;
  };

  // Helper function to format large numbers for thousands/millions
  const formatLargeNumber = (num) => {
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

  return (
    <div
      style={{
        backgroundColor: '#0a0a0a', // Darker background for the live box
        borderRadius: '16px',
        padding: '2rem',
        border: '2px solid #39FF14', // Stronger lime green border
        boxShadow: '0 0 30px rgba(57, 255, 20, 0.6)', // Intense green glow
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '700px', // Max width for the display box
        boxSizing: 'border-box',
        textAlign: 'center',
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
        EVE Live Impact: Fraud Intercepted
      </h2>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column', // Stack vertically on small screens
          gap: '1.5rem',
          width: '100%',
        }}
      >
        {/* Metric 1: Fraud Dollars Saved */}
        <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(57, 255, 20, 0.1)', border: '1px solid rgba(57, 255, 20, 0.3)' }}>
          <p
            style={{
              color: '#39FF14', // Lime green for positive impact
              fontSize: 'clamp(1.8rem, 6vw, 3.5rem)', // Very large, responsive font
              fontWeight: 900,
              textShadow: '0 0 20px #39FF14',
              lineHeight: 1.1,
            }}
          >
            {formatCurrency(fraudDollarsSaved)}
          </p>
          <p style={{ color: '#cceeff', fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', marginTop: '0.5rem' }}>
            Fraud Dollars Saved (Live)
          </p>
        </div>

        {/* Metric 2: Fake Content Blocked */}
        <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255, 69, 0, 0.1)', border: '1px solid rgba(255, 69, 0, 0.3)' }}>
          <p
            style={{
              color: '#FF4500', // Orange-red for fraud detected
              fontSize: 'clamp(1.8rem, 6vw, 3.5rem)',
              fontWeight: 900,
              textShadow: '0 0 20px #FF4500',
              lineHeight: 1.1,
            }}
          >
            {formatLargeNumber(fakeTiktoksBlocked)}
          </p>
          <p style={{ color: '#cceeff', fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', marginTop: '0.5rem' }}>
            Fake Content Units Blocked (Live)
          </p>
        </div>

        {/* Metric 3: Fraudulent Views Prevented */}
        <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
          <p
            style={{
              color: '#FFD700', // Gold for significant impact
              fontSize: 'clamp(1.8rem, 6vw, 3.5rem)',
              fontWeight: 900,
              textShadow: '0 0 20px #FFD700',
              lineHeight: 1.1,
            }}
          >
            {formatLargeNumber(viewsPrevented)}
          </p>
          <p style={{ color: '#cceeff', fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', marginTop: '0.5rem' }}>
            Fraudulent Views Prevented (Live)
          </p>
        </div>
      </div>

      <p style={{ color: '#888', fontSize: '0.75rem', marginTop: '1.5rem' }}>
        *Simulated live data for demonstration purposes. Connect to your `/api/fraud-stats` for real-world metrics.
      </p>
    </div>
  );
};

export default FraudStatsDisplay;
