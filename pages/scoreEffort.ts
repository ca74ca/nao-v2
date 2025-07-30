// /pages/api/scoreEffort.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe'; // Assuming this path is correct for your Stripe initialization
import { runEffortScore } from '@/utils/runEffortScore'; // Utility to fetch data from Decodos
import { calculateEffortScore } from '@/utils/effortRecipe'; // Utility for your Proof of Human logic

// Firebase imports for Firestore logging
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';

// Initialize Firebase if it hasn't been already
let firebaseApp;
let db;
let auth;

// Global variables provided by the Canvas environment
declare const __app_id: string | undefined;
declare const __firebase_config: string | undefined;
declare const __initial_auth_token: string | undefined;

if (!getApps().length) {
  try {
    const firebaseConfig = typeof __firebase_config !== 'undefined'
      ? JSON.parse(__firebase_config)
      : {}; // Fallback if config is not provided
    firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    // You might want to throw an error or handle this more gracefully depending on your app's needs
  }
} else {
  firebaseApp = getApp();
  db = getFirestore(firebaseApp);
  auth = getAuth(firebaseApp);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, sourceType, wallet, subscriptionItemId } = req.body;

  if (!url || !sourceType) {
    return res.status(400).json({ error: 'Missing url or sourceType' });
  }

  // Ensure Firebase is initialized and authenticated before proceeding with Firestore operations
  if (!db || !auth) {
    console.error("Firebase services not initialized.");
    return res.status(500).json({ error: 'Server configuration error: Firebase not ready.' });
  }

  try {
    // Authenticate with Firebase (anonymously or with provided token)
    if (typeof __initial_auth_token !== 'undefined') {
      await signInWithCustomToken(auth, __initial_auth_token);
      console.log('✅ Signed in with custom token.');
    } else {
      await signInAnonymously(auth);
      console.log('✅ Signed in anonymously.');
    }

    const userId = auth.currentUser?.uid || 'anonymous_user'; // Get user ID for Firestore path

    // Step 1: Pull public data from TikTok, Reddit, YouTube, etc., using Decodos
    const metadata = await runEffortScore(sourceType, url);
    console.log('Collected Metadata:', metadata);

    // Step 2: Score the content based on the collected metadata and your 'Proof of Human' recipe
    // MODIFIED: Destructure 'tags' from the result as calculateEffortScore now returns it.
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
      // Define the collection path for public data logs
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const logsCollectionRef = collection(db, `artifacts/${appId}/public/data/effort_logs`);

      await addDoc(logsCollectionRef, {
        timestamp: serverTimestamp(), // Use Firestore's server timestamp
        url,
        sourceType,
        wallet: wallet || null, // Store wallet if provided
        score,
        fraudSignal,
        message: fraudSignal ? '⚠️ Possible AI or low-effort content' : '✅ Human effort detected',
        reasons,
        tags, // ADDED: Include tags in the Firestore log
        metadata, // Store the full metadata for detailed logs
        userId, // Log the user who initiated the request
      });
      console.log('✅ Logged effort score to Firestore.');
    } catch (firestoreError: any) {
      console.error('❌ Failed to log effort score to Firestore:', firestoreError.message);
      // Decide how to handle this: fail the request or just log the error and continue.
      // For now, we'll log and still return the score to the client.
    }

    // Step 5: Return full response to the client
    return res.status(200).json({
      score,
      fraudSignal,
      message: fraudSignal ? '⚠️ Possible AI or low-effort content' : '✅ Human effort detected',
      reasons,
      tags, // ADDED: Include tags in the API response
      metadata, // Include the raw metadata for debugging/transparency if needed
    });
  } catch (err: any) {
    console.error('❌ Scoring or authentication error:', err.message);
    // Return a 500 status for internal server errors during the scoring process
    return res.status(500).json({ error: `Failed to score effort: ${err.message}` });
  }
}
