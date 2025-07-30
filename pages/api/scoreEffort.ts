// /pages/api/scoreEffort.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe'; // Assuming this path is correct for your Stripe initialization
import { runEffortScore } from '@/utils/runEffortScore'; // Utility to fetch data from Decodos
import { calculateEffortScore } from '@/utils/effortRecipe'; // Utility for your Proof of Human logic

// Firebase imports for Firestore logging
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';

// Your web app's Firebase configuration - Use environment variables for build-time consistency
// IMPORTANT: You MUST define these as NEXT_PUBLIC_FIREBASE_... in your .env.local file
// and in your deployment environment (e.g., Vercel, Render).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase if it hasn't been already
// Moved inside the handler to ensure it runs only at runtime, not build time.
// Variables are now declared at the top level, but assigned within the handler.
let firebaseAppInstance: any;
let dbInstance: any;
let authInstance: any;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, sourceType, wallet, subscriptionItemId } = req.body;

  if (!url || !sourceType) {
    return res.status(400).json({ error: 'Missing url or sourceType' });
  }

  // Initialize Firebase within the handler to ensure environment variables are available
  // and it's not run during static analysis/prerendering.
  if (!getApps().length) {
    try {
      if (firebaseConfig.projectId) { // Ensure projectId is available from env vars
        firebaseAppInstance = initializeApp(firebaseConfig);
        dbInstance = getFirestore(firebaseAppInstance);
        authInstance = getAuth(firebaseAppInstance);
        console.log('✅ Firebase initialized successfully at runtime.');
      } else {
        console.error("Firebase projectId not found at runtime. Cannot initialize Firebase.");
        return res.status(500).json({ error: 'Server configuration error: Firebase Project ID missing.' });
      }
    } catch (error) {
      console.error("Firebase initialization failed at runtime:", error);
      return res.status(500).json({ error: `Server configuration error: Firebase initialization failed: ${error}` });
    }
  } else {
    firebaseAppInstance = getApp();
    dbInstance = getFirestore(firebaseAppInstance);
    authInstance = getAuth(firebaseAppInstance);
  }

  // Ensure Firebase is initialized and authenticated before proceeding with Firestore operations
  if (!dbInstance || !authInstance) {
    console.error("Firebase services not initialized or authenticated. Cannot proceed with database operations.");
    return res.status(500).json({ error: 'Server configuration error: Firebase not ready or authenticated.' });
  }

  try {
    // Authenticate with Firebase (anonymously or with provided token)
    const initialAuthToken = req.body.initialAuthToken || process.env.FIREBASE_CUSTOM_AUTH_TOKEN;
    if (initialAuthToken) {
      await signInWithCustomToken(authInstance, initialAuthToken);
      console.log('✅ Signed in with custom token.');
    } else {
      await signInAnonymously(authInstance);
      console.log('✅ Signed in anonymously.');
    }

    const userId = authInstance.currentUser?.uid || 'anonymous_user'; // Get user ID for Firestore path

    // Step 1: Pull public data from TikTok, Reddit, YouTube, etc., using Decodos
    const metadata = await runEffortScore(sourceType, url);
    console.log('Collected Metadata:', metadata);

    // Step 2: Score the content based on the collected metadata and your 'Proof of Human' recipe
    const { score, reasons, tags } = await calculateEffortScore(metadata);
    const fraudSignal = score < 70; // Example threshold for fraud detection

    // Step 3: Log usage to Stripe (optional)
    if (subscriptionItemId) {
      try {
        await (stripe.subscriptionItems as any).createUsageRecord(subscriptionItemId, {
          quantity: 1,
          timestamp: Math.floor(Date.now() / 1000),
          action: 'increment',
        });
        console.log('✅ Logged $0.01 usage to Stripe');
      } catch (err: any) {
        console.error('❌ Failed to log Stripe usage:', err.message);
      }
    }

    // Step 4: Log the result to Firestore for analytics and fraud logs
    try {
      const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'default-app-id';
      const logsCollectionRef = collection(dbInstance, `artifacts/${appId}/public/data/effort_logs`);

      await addDoc(logsCollectionRef, {
        timestamp: serverTimestamp(), // Use Firestore's server timestamp
        url,
        sourceType,
        wallet: wallet || null, // Store wallet if provided
        score,
        fraudSignal,
        message: fraudSignal ? '⚠️ Possible AI or low-effort content' : '✅ Human effort detected',
        reasons,
        tags, // Include tags in the log
        metadata, // Store the full metadata for detailed logs
        userId, // Log the user who initiated the request
      });
      console.log('✅ Logged effort score to Firestore.');
    } catch (firestoreError: any) {
      console.error('❌ Failed to log effort score to Firestore:', firestoreError.message);
    }

    // Step 5: Return full response to the client
    return res.status(200).json({
      score,
      fraudSignal,
      message: fraudSignal ? '⚠️ Possible AI or low-effort content' : '✅ Human effort detected',
      reasons,
      tags, // Include tags in the API response
      metadata, // Include the raw metadata for debugging/transparency if needed
    });
  } catch (err: any) {
    console.error('❌ Scoring or authentication error:', err.message);
    return res.status(500).json({ error: `Failed to score effort: ${err.message}` });
  }
}
