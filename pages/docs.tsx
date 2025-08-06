import Head from "next/head";
import Link from "next/link";

export default function DocsPage() {
  return (
    <>
      <Head>
        <title>EVE API Documentation</title>
        <meta name="description" content="Official API documentation for the EVE Effort Verification Engine. Learn how to integrate and detect human effort." />
      </Head>

      <main className="max-w-3xl mx-auto py-10 px-6">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/get-started" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <h1 className="text-3xl font-bold mb-2">EVE Engine API Docs</h1>
        <p className="text-gray-600 mb-6">Version: v1 (last updated August 2025)</p>

        {/* Overview */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">What is EVE?</h2>
          <p>
            EVE (Effort Verification Engine) is an API that verifies whether content was generated with real human effort. Use it to detect AI-generated content, spam, or fraud across TikTok, Reddit, reviews, UGC, Web3, and more.
          </p>
        </section>

        {/* Authentication */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">🔐 Authentication</h2>
          <p>All requests must include your API key in the header:</p>
          <pre className="bg-gray-900 text-green-200 text-sm p-4 rounded mt-2">
{`POST /api/scoreEffort
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json`}
          </pre>
        </section>

        {/* Endpoint */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">⚙️ POST /api/scoreEffort</h2>
          <p>Analyzes content and returns a fraud signal.</p>

          <h3 className="font-medium mt-3">Request Body:</h3>
          <pre className="bg-gray-800 text-white text-sm p-4 rounded mt-2">
{`{
  "url": "https://www.tiktok.com/@user/video/123",
  "sourceType": "tiktok",
  "wallet": "0xabc123...",          // Optional
  "subscriptionItemId": "si_123"   // Optional for metered billing
}`}
          </pre>

          <h3 className="font-medium mt-3">Response:</h3>
          <pre className="bg-gray-800 text-white text-sm p-4 rounded mt-2 overflow-x-auto">
{`{
  "score": 82,
  "fraudSignal": false,
  "message": "✅ Human effort detected",
  "reasons": ["No AI patterns detected", "Engagement looks authentic"],
  "tags": ["authentic", "verified"],
  "metadata": { ... }
}`}
          </pre>
        </section>

        {/* Pricing */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">💸 Pricing</h2>
          <p>
            Free tier includes 20 verifications/month. Upgrade to Pro for unlimited usage and advanced fraud analytics.
          </p>
        </section>

        {/* Quickstart */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">🚀 Quickstart</h2>
          <pre className="bg-black text-white text-sm p-4 rounded mt-2 overflow-x-auto">
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
console.log(data);
`}
          </pre>
        </section>

        {/* Changelog */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">📅 Changelog</h2>
          <ul className="text-gray-700 list-disc pl-6">
            <li><strong>[2025-08-01]</strong> Initial public release with effort scoring + Stripe integration</li>
            <li><strong>[2025-08-06]</strong> Added fraud metadata + plan gating for /scoreEffort</li>
          </ul>
        </section>

        {/* FAQ */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">❓ FAQ</h2>
          <ul className="text-gray-700 list-disc pl-6">
            <li><strong>402 Error?</strong> — Upgrade to Pro to unlock this feature</li>
            <li><strong>Missing API key?</strong> — Log in and check the Developer Dashboard</li>
            <li><strong>Latency issues?</strong> — Large videos or scraping failures can add delay</li>
          </ul>
        </section>
      </main>
    </>
  );
}
