import React, { useState } from "react";
import {
  BookOpenText,
  Plug,
  Code,
  CreditCard,
  Rocket,
  Calendar,
  Sparkles,
  Zap,
  ChevronLeft,
  Copy // Added for copy button
} from 'lucide-react';

// Helper component for Copy to Clipboard button
const CopyButton = ({ textToCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const tempInput = document.createElement('textarea');
    tempInput.value = textToCopy;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text:', err);
      // Fallback for environments where execCommand might not work
      alert('Failed to copy. Please copy manually.');
    } finally {
      document.body.removeChild(tempInput);
    }
  };

  return (
    <button onClick={handleCopy} className="copy-button">
      {copied ? 'Copied!' : <Copy className="lucide-icon" />}
    </button>
  );
};

export default function DocsPage() {
  return (
    <>
      {/* Head content for SEO/metadata */}
      <title>EVE API Documentation</title>
      <meta name="description" content="Official API documentation for the EVE Effort Verification Engine. Learn how to integrate and detect human effort." />

      {/* Internal CSS for styling */}
      <style jsx>{`
        /* Global Reset & Base Styling */
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          font-family: 'Inter', sans-serif; /* Assuming Inter font is available or linked globally */
          -webkit-font-smoothing: antialiased;
          overscroll-behavior-y: contain;
        }

        /* Main container and background */
        .docs-container {
          min-height: 100vh;
          background-color: #0a0a0a; /* bg-gray-950 */
          color: #f3f4f6; /* text-gray-100 */
          font-family: sans-serif; /* Fallback font */
        }

        /* Main content area */
        .main-content {
          max-width: 80rem; /* max-w-5xl, approximately 80rem or 1280px */
          margin-left: auto;
          margin-right: auto;
          padding: 2.5rem 1.5rem; /* py-10 px-6 */
        }

        /* Responsive padding for main content */
        @media (min-width: 640px) { /* sm breakpoint */
          .main-content {
            padding-left: 2rem; /* sm:px-8 */
            padding-right: 2rem; /* sm:px-8 */
          }
        }
        @media (min-width: 1024px) { /* lg breakpoint */
          .main-content {
            padding-left: 3rem; /* lg:px-12 */
            padding-right: 3rem; /* lg:px-12 */
          }
        }

        /* Back to Dashboard Link */
        .back-link {
          display: inline-flex;
          align-items: center;
          color: #60a5fa; /* text-blue-400 */
          transition-property: color;
          transition-duration: 300ms;
          margin-bottom: 2rem; /* mb-8 */
        }
        .back-link:hover {
          color: #93c5fd; /* hover:text-blue-300 */
        }
        .back-link .lucide-icon { /* Styling for Lucide icon within the link */
          height: 1.25rem; /* h-5 */
          width: 1.25rem; /* w-5 */
          margin-right: 0.5rem; /* mr-2 */
        }
        .back-link .font-medium {
          font-weight: 500;
        }

        /* Header section */
        .header-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem; /* mb-8 */
          padding-bottom: 1rem; /* pb-4 */
          border-bottom: 1px solid #1f2937; /* border-b border-gray-800 */
        }
        .header-section h1 {
          font-size: 2.25rem; /* text-4xl */
          font-weight: 700; /* font-bold */
          background: linear-gradient(to right, #60a5fa, #4f46e5); /* from-blue-400 to-indigo-600 */
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent; /* Fallback for browsers not supporting text-fill-color */
          letter-spacing: -0.025em; /* tracking-tight */
          line-height: 1; /* leading-none */
          margin-bottom: 0.25rem; /* mb-1 */
        }
        .header-section p {
          color: #9ca3af; /* text-gray-400 */
        }
        .header-icon-wrapper {
          padding: 0.75rem; /* p-3 */
          border-radius: 9999px; /* rounded-full */
          background-color: #1f2937; /* bg-gray-800 */
          border: 1px solid #374151; /* border border-gray-700 */
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-lg */
        }
        .header-icon-wrapper .lucide-icon {
          height: 1.5rem; /* h-6 */
          width: 1.5rem; /* w-6 */
          color: #facc15; /* text-yellow-400 */
        }

        /* Section styling */
        .docs-section {
          background-color: #111827; /* bg-gray-900 */
          border-radius: 1rem; /* rounded-2xl */
          padding: 1.5rem; /* p-6 */
          border: 1px solid #1f2937; /* border border-gray-800 */
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04); /* shadow-xl */
          margin-bottom: 2rem; /* mb-8 */
        }
        @media (min-width: 768px) { /* md breakpoint */
          .docs-section {
            padding: 2rem; /* md:p-8 */
          }
        }
        .docs-section h2 {
          font-size: 1.5rem; /* text-2xl */
          font-weight: 600; /* font-semibold */
          color: #e5e7eb; /* text-gray-200 */
          display: flex;
          align-items: center;
          margin-bottom: 1rem; /* mb-4 */
        }
        .docs-section h2 .lucide-icon {
          margin-right: 0.75rem; /* mr-3 */
          height: 1.5rem; /* h-6 */
          width: 1.5rem; /* w-6 */
        }
        .docs-section p {
          color: #d1d5db; /* text-gray-300 */
          line-height: 1.625; /* leading-relaxed */
        }
        .docs-section h3 {
          font-weight: 500; /* font-medium */
          font-size: 1.125rem; /* text-lg */
          color: #e5e7eb; /* text-gray-200 */
          margin-top: 1rem; /* mt-4 */
        }

        /* Code blocks */
        .code-block-wrapper {
          position: relative; /* For positioning the copy button */
        }
        pre {
          background-color: #1f2937; /* bg-gray-800 */
          color: #ffffff; /* text-white */
          font-size: 0.875rem; /* text-sm */
          padding: 1rem; /* p-4 */
          border-radius: 0.75rem; /* rounded-xl */
          overflow-x: auto;
          font-family: monospace;
          border: 1px solid #374151; /* border border-gray-700 */
          margin-top: 0.5rem; /* mt-2 */
        }
        pre.auth-code {
          color: #86efac; /* text-green-300 */
          background-color: #1f2937; /* bg-gray-800 */
        }
        pre.quickstart-code {
          background-color: #000000; /* bg-black */
        }

        /* Copy Button Styling */
        .copy-button {
          position: absolute;
          top: 0.75rem; /* Adjust as needed */
          right: 0.75rem; /* Adjust as needed */
          background-color: rgba(55, 65, 81, 0.7); /* bg-gray-700 with transparency */
          color: #d1d5db; /* text-gray-300 */
          border: none;
          border-radius: 0.375rem; /* rounded-md */
          padding: 0.5rem; /* p-2 */
          cursor: pointer;
          transition: background-color 0.2s, color 0.2s;
          font-size: 0.75rem; /* text-xs */
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
        }
        .copy-button:hover {
          background-color: #4b5563; /* hover:bg-gray-600 */
          color: #e5e7eb; /* hover:text-gray-200 */
        }
        .copy-button .lucide-icon {
          height: 1rem; /* h-4 */
          width: 1rem; /* w-4 */
        }

        /* Grid layout for sections */
        .sections-grid {
          display: grid;
          gap: 2rem; /* gap-8 */
        }
        @media (min-width: 768px) { /* md breakpoint */
          .sections-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)); /* md:grid-cols-2 */
          }
        }
        .sections-grid.mt-8 {
          margin-top: 2rem;
        }

        /* Specific icon colors */
        .text-yellow-400 { color: #facc15; }
        .text-purple-400 { color: #c084fc; }
        .text-blue-400 { color: #60a5fa; }
        .text-pink-400 { color: #f472b6; }
        .text-green-400 { color: #4ade80; }
        .text-orange-400 { color: #fb923c; }
        .text-cyan-400 { color: #22d3ee; }
        .text-white { color: #ffffff; }
        .text-indigo-600 { color: #4f46e5; }
        .hover\:bg-indigo-700:hover { background-color: #4338ca; }

        /* Buttons */
        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem 1rem; /* px-4 py-2 */
          border-radius: 9999px; /* rounded-full */
          font-weight: 700; /* font-bold */
          color: #ffffff; /* text-white */
          background-color: #4f46e5; /* bg-indigo-600 */
          transition-property: background-color;
          transition-duration: 300ms;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-lg */
          text-decoration: none; /* Remove underline for links */
          white-space: nowrap; /* Prevent text wrapping */
        }
        .button:hover {
          background-color: #4338ca; /* hover:bg-indigo-700 */
        }
        .button .lucide-icon {
          height: 1.25rem; /* h-5 */
          width: 1.25rem; /* w-5 */
          margin-right: 0.5rem; /* mr-2 */
        }

        /* List styling for Changelog and FAQ */
        .changelog-list, .faq-list {
          list-style: disc;
          padding-left: 1.5rem; /* pl-6 */
          color: #d1d5db; /* text-gray-300 */
          line-height: 1.625; /* leading-relaxed */
        }
        .changelog-list li strong, .faq-list li strong {
          color: #ffffff; /* text-white */
        }
        .changelog-list li p {
          display: inline;
          margin-left: 0.5rem; /* ml-2 */
          font-size: 0.875rem; /* text-sm */
          color: #9ca3af; /* text-gray-400 */
        }
        .changelog-list li, .faq-list li {
          margin-bottom: 0.5rem; /* space-y-2 */
        }
      `}</style>

      <div className="docs-container">
        <main className="main-content">
          {/* Back to Dashboard Link */}
          <div className="mb-8">
            <a href="/get-started" className="back-link">
              <ChevronLeft className="lucide-icon" />
              <span className="font-medium">Back to Dashboard</span>
            </a>
          </div>

          {/* Header */}
          <div className="header-section">
            <div>
              <h1>EVE Engine API Docs 🔥</h1>
              <p>Version: v1 (last updated August 2025)</p>
            </div>
            <div className="header-icon-wrapper">
              <Sparkles className="lucide-icon" />
            </div>
          </div>

          {/* Overview */}
          <section className="docs-section">
            <h2>
              <Zap className="lucide-icon" />
              What is EVE?
            </h2>
            <p>
              The Effort Verification Engine (EVE) is a powerful API designed to verify whether content was generated with real human effort. It's an essential tool for detecting AI-generated content, spam, or fraud across various platforms like TikTok, Reddit, user-generated content, and more. Integrate EVE to ensure the authenticity and integrity of your platform's content.
            </p>
          </section>

          {/* Core Sections */}
          <div className="sections-grid">
            {/* Authentication */}
            <section className="docs-section">
              <h2>
                <Plug className="lucide-icon" />
                Authentication
              </h2>
              <p>
                All requests to the EVE API must include your unique API key in the `Authorization` header.
              </p>
              <div className="code-block-wrapper">
                <pre className="auth-code">
                  {`POST /api/scoreEffort
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json`}
                </pre>
                <CopyButton textToCopy={`POST /api/scoreEffort\nAuthorization: Bearer YOUR_API_KEY\nContent-Type: application/json`} />
              </div>
            </section>

            {/* Endpoint */}
            <section className="docs-section">
              <h2>
                <Code className="lucide-icon" />
                POST /api/scoreEffort
              </h2>
              <p>
                This endpoint analyzes content and returns a fraud signal with an associated effort score.
              </p>
              <h3>Request Body:</h3>
              <div className="code-block-wrapper">
                <pre>
                  {`{
  "url": "https://www.tiktok.com/@user/video/123",
  "sourceType": "tiktok",
  "wallet": "0xabc123...",      // Optional
  "subscriptionItemId": "si_123"  // Optional for metered billing
}`}
                </pre>
                <CopyButton textToCopy={`{\n  "url": "https://www.tiktok.com/@user/video/123",\n  "sourceType": "tiktok",\n  "wallet": "0xabc123...",      // Optional\n  "subscriptionItemId": "si_123"  // Optional for metered billing\n}`} />
              </div>
            </section>
          </div>

          {/* Pricing & Response */}
          <div className="sections-grid mt-8">
            {/* Pricing */}
            <section className="docs-section">
              <h2>
                <CreditCard className="lucide-icon" />
                Pricing
              </h2>
              <p>
                The **Free** tier provides **20 verifications per month**. To unlock unlimited usage and gain access to advanced fraud analytics, you can upgrade to our **Pro** plan.
              </p>
              <a href="#" className="button">
                <Rocket className="lucide-icon" />
                <span>Upgrade to Pro</span>
              </a>
            </section>

            {/* Response Example JSON Block */}
            <section className="docs-section">
              <h2>
                <BookOpenText className="lucide-icon" />
                Response Body
              </h2>
              <p>
                A successful request will return a JSON object containing the effort score and a fraud signal.
              </p>
              <h3>Example JSON Response:</h3> {/* Clarified heading */}
              <div className="code-block-wrapper">
                <pre>
                  {`{
  "score": 82,
  "fraudSignal": false,
  "message": "✅ Human effort detected",
  "reasons": ["No AI patterns detected", "Engagement looks authentic"],
  "tags": ["authentic", "verified"],
  "metadata": { ... }
}`}
                </pre>
                <CopyButton textToCopy={`{\n  "score": 82,\n  "fraudSignal": false,\n  "message": "✅ Human effort detected",\n  "reasons": ["No AI patterns detected", "Engagement looks authentic"],\n  "tags": ["authentic", "verified"],\n  "metadata": { ... }\n}`} />
              </div>
            </section>
          </div>

          {/* New Section: Usage & Limits */}
          <section className="docs-section mt-8">
            <h2>
              <Zap className="lucide-icon" />
              Usage & Rate Limits
            </h2>
            <p>
              EVE offers a generous **Free tier** with a limit of **20 API calls per month**. This is perfect for initial testing and small-scale projects.
            </p>
            <p className="mt-4">
              For higher volume usage, advanced features, and dedicated support, we recommend upgrading to our **Pro plan**. Pro users benefit from significantly increased rate limits and a more robust verification capacity.
            </p>
            <p className="mt-4">
              If you encounter a `429 Too Many Requests` error, it indicates you've hit your current rate limit. Consider optimizing your API call frequency or upgrading your plan.
            </p>
            <a href="#" className="button mt-6"> {/* Link to upgrade */}
                <CreditCard className="lucide-icon" />
                <span>View Plans & Upgrade</span>
            </a>
          </section>

          {/* Quickstart & Changelog */}
          <div className="sections-grid mt-8">
            {/* Quickstart */}
            <section className="docs-section">
              <h2>
                <Rocket className="lucide-icon" />
                Quickstart
              </h2>
              <p>
                Get up and running quickly with this example using the JavaScript `fetch` API.
              </p>
              <div className="code-block-wrapper">
                <pre className="quickstart-code">
                  {`// JavaScript fetch example
const res = await fetch('/api/scoreEffort', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://...',
    sourceType: 'tiktok',
    wallet: '0x...',
    subscriptionItemId: 'si_123'
  })
});
const data = await res.json();
console.log(data);`}
                </pre>
                <CopyButton textToCopy={`// JavaScript fetch example\nconst res = await fetch('/api/scoreEffort', {\n  method: 'POST',\n  headers: {\n    'Authorization': 'Bearer YOUR_API_KEY',\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    url: 'https://...',\n    sourceType: 'tiktok',\n    wallet: '0x...', \n    subscriptionItemId: 'si_123'\n  })\n});\nconst data = await res.json();\nconsole.log(data);`} />
              </div>
            </section>

            {/* Changelog */}
            <section className="docs-section">
              <h2>
                <Calendar className="lucide-icon" />
                Changelog
              </h2>
              <ul className="changelog-list">
                <li>
                  <strong className="text-white">[2025-08-06]</strong>
                  <p className="inline ml-2 text-sm text-gray-400">Added fraud metadata + plan gating for `/scoreEffort`.</p>
                </li>
                <li>
                  <strong className="text-white">[2025-08-01]</strong>
                  <p className="inline ml-2 text-sm text-gray-400">Initial public release with effort scoring + Stripe integration.</p>
                </li>
              </ul>
            </section>
          </div>

          {/* FAQ */}
          <section className="docs-section mt-8">
            <h2>
              <BookOpenText className="lucide-icon" />
              FAQ
            </h2>
            <ul className="faq-list">
              <li>
                <strong className="text-white">402 Error?</strong>
                <p className="inline ml-2 text-sm text-gray-400">— Upgrade to Pro to unlock this feature.</p>
              </li>
              <li>
                <strong className="text-white">Missing API key?</strong>
                <p className="inline ml-2 text-sm text-gray-400">— Log in and check the Developer Dashboard.</p>
              </li>
              <li>
                <strong className="text-white">Latency issues?</strong>
                <p className="inline ml-2 text-sm text-gray-400">— Large videos or scraping failures can add delay.</p>
              </li>
            </ul>
          </section>
        </main>
      </div>
    </>
  );
}

