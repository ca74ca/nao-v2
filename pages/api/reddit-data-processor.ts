import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '@/lib/mongodb';
import { MongoClient, Db } from 'mongodb';

// Define types for the data we expect to return
interface RedditFraudStats {
  karmaFarmingBotsFlagged: number;
  aiWrittenRepliesBlocked: number;
  spamPostAttempts: number;
  fraudulentEngagementsPrevented: number;
  redditDollarsSaved: number;
  postsAnalyzed: number;
  humanEveIQ: number; // NEW: Human EVE IQ
  aiEveIQ: number;     // NEW: AI EVE IQ
  timestamp: Date; // When this data was processed
}

type ApiResponse = {
  success: boolean;
  data?: RedditFraudStats;
  error?: string;
  message?: string;
};

// Helper function to calculate EVE IQ based on effort scores
function calculateSpecificEveIQ(totalEffort: number, isHuman: boolean): number {
  // Adjust these coefficients and divisor based on how you want the IQ to scale
  // For demo, we'll scale based on a hypothetical 'max effort' to get 0-100.
  const scalingFactor = 5000; // Adjust this to control the range of the IQ score
  let rawScore = totalEffort / scalingFactor;

  if (isHuman) {
    // Human IQ increases with more verified human effort
    return Math.min(100, Math.floor(rawScore * 100));
  } else {
    // AI IQ increases with more detected AI effort/fraud
    return Math.min(100, Math.floor(rawScore * 100));
  }
}

/**
 * Reddit Data Processor API Route.
 * This endpoint fetches recent Reddit posts, applies EVE's fraud detection logic,
 * and (optionally) stores detected fraud events in MongoDB.
 * It then returns the aggregated fraud statistics, including Human and AI EVE IQs.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow GET requests for fetching data
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed', error: 'Only GET requests are supported.' });
  }

  let db: Db;
  try {
    // 1. Connect to MongoDB using your dbConnect utility
    db = await dbConnect();
    const fraudEventsCollection = db.collection('redditFraudEvents'); // A new collection for Reddit-specific fraud

    // 2. Fetch data from Reddit's public API
    const redditResponse = await fetch('https://www.reddit.com/r/all/new.json?limit=50'); // Fetch more posts for better analysis
    if (!redditResponse.ok) {
      throw new Error(`Failed to fetch Reddit data: ${redditResponse.statusText}`);
    }
    const redditData = await redditResponse.json();
    const posts = redditData.data.children;

    // Initialize counters for this processing cycle
    let karmaFarmingBotsFlagged = 0;
    let aiWrittenRepliesBlocked = 0;
    let spamPostAttempts = 0;
    let fraudulentEngagementsPrevented = 0;
    let redditDollarsSaved = 0;
    const postsAnalyzed = posts.length;

    // NEW: Initialize effort scores for this cycle
    let simulatedHumanEffortThisCycle = 0;
    let simulatedAIEffortThisCycle = 0;

    // Array to store new fraud events to be inserted into MongoDB
    const newFraudEvents: any[] = [];

    // 3. Apply EVE's "Secret Recipe" Logic (Server-Side Simulation)
    posts.forEach((post: any) => {
      const title = post.data.title?.toLowerCase() || '';
      const selftext = post.data.selftext?.toLowerCase() || '';
      const author = post.data.author;
      const numComments = post.data.num_comments;
      const score = post.data.score;
      const created_utc = post.data.created_utc; // Unix timestamp

      let isFraudDetected = false; // Flag for this specific post
      let isAIContent = false;    // Flag for AI content
      let isHumanContent = false; // Flag for human content

      // --- EVE's Detection Methods (Simplified for Demo) ---
      // 1. Pattern Recognition & 3. Behavioral Heuristics
      if (
        title.includes("free karma") ||
        title.includes("upvote for upvote") ||
        selftext.includes("follow me") ||
        selftext.includes("check out my channel") ||
        (selftext.length > 0 && selftext.length < 30 && score < 5 && numComments < 2 && Math.random() < 0.7) // 70% chance to flag low effort
      ) {
        karmaFarmingBotsFlagged++;
        spamPostAttempts++;
        redditDollarsSaved += Math.floor(Math.random() * 5 + 1);
        isFraudDetected = true;
      }

      // 8. AI/LLM Watermarking (simplified: keyword detection)
      if (
        selftext.includes("as an ai language model") ||
        selftext.includes("i cannot fulfill that request") ||
        selftext.includes("in conclusion") ||
        selftext.includes("here are some thoughts") ||
        (selftext.length > 100 && Math.random() < 0.3) // 30% chance to flag longer text as AI
      ) {
        aiWrittenRepliesBlocked++;
        spamPostAttempts++;
        redditDollarsSaved += Math.floor(Math.random() * 10 + 2);
        isFraudDetected = true;
        isAIContent = true;
      }

      // 9. Velocity & Timing Analysis (simplified)
      const postAgeMinutes = (Date.now() / 1000 - created_utc) / 60;
      if (score > 100 && postAgeMinutes < 5 && Math.random() < 0.1) {
        fraudulentEngagementsPrevented++;
        redditDollarsSaved += Math.floor(Math.random() * 20 + 5);
        isFraudDetected = true;
      }

      // Simulate some general fraudulent engagements prevented for every post processed
      fraudulentEngagementsPrevented += Math.floor(Math.random() * 5 + 1);

      // NEW: Determine simulated effort type and value
      let simulatedEffortValue = Math.floor(Math.random() * 100 + 10); // Base effort value

      if (isAIContent) {
        simulatedAIEffortThisCycle += simulatedEffortValue;
      } else if (!isFraudDetected) { // If not AI and not other fraud, consider it human-like
        simulatedHumanEffortThisCycle += simulatedEffortValue;
        isHumanContent = true;
      }

      // If fraud was detected for this post, add it to the events to be stored
      if (isFraudDetected || isAIContent || isHumanContent) { // Store all analyzed posts for effort tracking
        newFraudEvents.push({
          type: 'reddit_post_analysis', // More general type
          detectionMethod: 'simulated_eve_logic',
          platform: 'Reddit',
          postId: post.data.id,
          author: post.data.author,
          title: post.data.title,
          url: post.data.url,
          detectedAt: new Date(),
          isKarmaFarming: title.includes("free karma") || selftext.includes("upvote for upvote"),
          isAIWritten: isAIContent,
          isHumanLike: isHumanContent,
          simulatedDollarImpact: isFraudDetected ? Math.floor(Math.random() * 50 + 10) : 0,
          simulatedHumanEffort: isHumanContent ? simulatedEffortValue : 0,
          simulatedAIEffort: isAIContent ? simulatedEffortValue : 0,
        });
      }
    });

    // 4. Store Detected Fraud Events in MongoDB
    if (newFraudEvents.length > 0) {
      await fraudEventsCollection.insertMany(newFraudEvents);
      console.log(`Inserted ${newFraudEvents.length} new Reddit analysis events into MongoDB.`);
    }

    // 5. Aggregate Current Stats from MongoDB for a more "live" total
    const pipeline = [
      {
        $group: {
          _id: null,
          totalKarmaFarmingBotsFlagged: { $sum: { $cond: [{ $eq: ["$isKarmaFarming", true] }, 1, 0] } },
          totalAiWrittenRepliesBlocked: { $sum: { $cond: [{ $eq: ["$isAIWritten", true] }, 1, 0] } },
          totalSpamPostAttempts: { $sum: 1 }, // Count all inserted events as spam attempts
          totalFraudulentEngagementsPrevented: { $sum: { $add: [1, { $floor: { $multiply: [ { $rand: {} }, 5 ] } }] } }, // Simulate for now
          totalRedditDollarsSaved: { $sum: "$simulatedDollarImpact" },
          totalPostsAnalyzed: { $sum: 1 }, // Count all analyzed posts
          totalHumanEffort: { $sum: "$simulatedHumanEffort" }, // NEW: Sum human effort
          totalAIEffort: { $sum: "$simulatedAIEffort" },       // NEW: Sum AI effort
        }
      }
    ];

    const aggregatedStats = await fraudEventsCollection.aggregate(pipeline).toArray();
    const currentAggregated = aggregatedStats[0] || {};

    let currentRedditStats: RedditFraudStats = {
      karmaFarmingBotsFlagged: currentAggregated.totalKarmaFarmingBotsFlagged || 0,
      aiWrittenRepliesBlocked: currentAggregated.totalAiWrittenRepliesBlocked || 0,
      spamPostAttempts: currentAggregated.totalSpamPostAttempts || 0,
      fraudulentEngagementsPrevented: currentAggregated.totalFraudulentEngagementsPrevented || 0,
      redditDollarsSaved: currentAggregated.totalRedditDollarsSaved || 0,
      postsAnalyzed: currentAggregated.totalPostsAnalyzed || 0,
      humanEveIQ: calculateSpecificEveIQ(currentAggregated.totalHumanEffort || 0, true), // Calculate Human IQ
      aiEveIQ: calculateSpecificEveIQ(currentAggregated.totalAIEffort || 0, false),     // Calculate AI IQ
      timestamp: new Date(),
    };

    // If no events are in DB yet, start with some high initial values for demo impact
    if (currentRedditStats.postsAnalyzed === 0) {
      currentRedditStats = {
        karmaFarmingBotsFlagged: 7500,
        aiWrittenRepliesBlocked: 12000,
        spamPostAttempts: 34000,
        fraudulentEngagementsPrevented: 560000,
        redditDollarsSaved: 850000,
        postsAnalyzed: 1000000,
        humanEveIQ: 85, // Default high human IQ for demo
        aiEveIQ: 60,    // Default moderate AI IQ for demo
        timestamp: new Date(),
      };
    }

    // 6. Respond with the aggregated stats
    return res.status(200).json({ success: true, data: currentRedditStats });

  } catch (error) {
    console.error('API Error in Reddit Data Processor:', error);
    if (error instanceof Error) {
      return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: 'An unknown error occurred.' });
  }
}
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function dbConnect(): Promise<Db> {
    if (cachedDb) {
        return cachedDb;
    }

    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;

    if (!uri || !dbName) {
        throw new Error('Please define the MONGODB_URI and MONGODB_DB environment variables');
    }

    if (!cachedClient) {
        cachedClient = new MongoClient(uri);
        await cachedClient.connect();
    }

    cachedDb = cachedClient.db(dbName);
    return cachedDb;
}

