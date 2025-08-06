import React from "react";
import {
  BookOpenText,
  Plug,
  Code,
  CreditCard,
  Rocket,
  Calendar,
  Sparkles,
  Zap,
  ChevronLeft
} from 'lucide-react';

export default function DocsPage() {
  return (
    <>
      <title>EVE API Documentation</title>
      <meta name="description" content="Official API documentation for the EVE Effort Verification Engine. Learn how to integrate and detect human effort." />

      <div className="min-h-screen bg-gray-950 text-gray-100 font-sans antialiased">
        <main className="max-w-5xl mx-auto py-10 px-6 sm:px-8 lg:px-12">
          <div className="mb-8">
            <a href="/get-started" className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors">
              <ChevronLeft className="h-5 w-5 mr-2" />
              <span className="font-medium">Back to Dashboard</span>
            </a>
          </div>

          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 tracking-tight leading-none mb-1">
                EVE Engine API Docs
              </h1>
              <p className="text-gray-400">Version: v1 (last updated August 2025)</p>
            </div>
            <div className="p-3 rounded-full bg-gray-800 border border-gray-700 shadow-lg">
              <Sparkles className="h-6 w-6 text-yellow-400" />
            </div>
          </div>

          <section className="bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-800 shadow-xl mb-8">
            <h2 className="text-2xl font-semibold text-gray-200 flex items-center mb-4">
              <Zap className="mr-3 h-6 w-6 text-yellow-400" />
              What is EVE?
            </h2>
            <p className="text-gray-300 leading-relaxed">
              The Effort Verification Engine (EVE) is a powerful API designed to verify whether content was generated with real human effort. It's an essential tool for detecting AI-generated content, spam, or fraud across various platforms like TikTok, Reddit, user-generated content, and more.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-8">
            <section className="bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-800 shadow-xl">
              <h2 className="text-2xl font-semibold text-gray-200 flex items-center mb-4">
                <Plug className="mr-3 h-6 w-6 text-purple-400" />
                Authentication
              </h2>
              <p className="text-gray-300 mb-4">
                All requests to the EVE API must include your unique API key in the `Authorization` header.
              </p>
              <pre className="bg-gray-800 text-green-300 text-sm p-4 rounded-xl overflow-x-auto font-mono border border-gray-700">
{`POST /api/scoreEffort
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json`}
              </pre>
            </section>

            <section className="bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-800 shadow-xl">
              <h2 className="text-2xl font-semibold text-gray-200 flex items-center mb-4">
                <Code className="mr-3 h-6 w-6 text-blue-400" />
                POST /api/scoreEffort
              </h2>
              <p className="text-gray-300 mb-4">
                This endpoint analyzes content and returns a fraud signal with an associated effort score.
              </p>
              <h3 className="font-medium text-lg text-gray-200 mt-4">Request Body:</h3>
              <pre className="bg-gray-800 text-white text-sm p-4 rounded-xl mt-2 overflow-x-auto font-mono border border-gray-700">
{`{
  "url": "https://www.tiktok.com/@user/video/123",
  "sourceType": "tiktok",
  "wallet": "0xabc123...",      // Optional
  "subscriptionItemId": "si_123"  // Optional for metered billing
}`}
              </pre>
            </section>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <section className="bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-800 shadow-xl">
              <h2 className="text-2xl font-semibold text-gray-200 flex items-center mb-4">
                <CreditCard className="mr-3 h-6 w-6 text-pink-400" />
                Pricing
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                The Free tier provides 20 verifications per month. Upgrade to Pro for unlimited usage and advanced fraud analytics.
              </p>
              <a href="#" className="inline-flex items-center space-x-2 px-4 py-2 rounded-full font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg">
                <Rocket className="h-5 w-5" />
                <span>Upgrade to Pro</span>
              </a>
            </section>

            <section className="bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-800 shadow-xl">
              <h2 className="text-2xl font-semibold text-gray-200 flex items-center mb-4">
                <BookOpenText className="mr-3 h-6 w-6 text-green-400" />
                Response Body
              </h2>
              <p className="text-gray-300 mb-4">
                A successful request will return a JSON object containing the effort score and a fraud signal.
              </p>
              <pre className="bg-gray-800 text-white text-sm p-4 rounded-xl overflow-x-auto font-mono border border-gray-700">
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
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <section className="bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-800 shadow-xl">
              <h2 className="2xl font-semibold text-gray-200 flex items-center mb-4">
                <Rocket className="mr-3 h-6 w-6 text-orange-400" />
                Quickstart
              </h2>
              <p className="text-gray-300 mb-4">
                Get up and running quickly with this example using the JavaScript `fetch` API.
              </p>
              <pre className="bg-black text-white text-sm p-4 rounded-xl mt-2 overflow-x-auto font-mono border border-gray-700">
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
            </section>

            <section className="bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-800 shadow-xl">
              <h2 className="2xl font-semibold text-gray-200 flex items-center mb-4">
                <Calendar className="mr-3 h-6 w-6 text-cyan-400" />
                Changelog
              </h2>
              <ul className="text-gray-300 list-disc pl-6 space-y-2">
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
        </main>
      </div>
    </>
  );
}
