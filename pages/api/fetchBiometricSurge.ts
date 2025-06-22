import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// -- Set up your MongoDB connection URI (from Atlas) --
const MONGODB_URI = process.env.MONGODB_URI!;
const client = new MongoClient(MONGODB_URI);

// -- Helper: Get User from JWT in headers/cookies --
async function getUserFromRequest(req: NextRequest) {
  // Example: JWT is in "Authorization: Bearer <token>"
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.replace("Bearer ", "").trim();
  // Decode token, verify, extract userId/email, etc.
  // You may use a JWT library like 'jsonwebtoken'
  // Example with dummy decode:
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  return { userId: payload.userId, email: payload.email };
}

// -- Main Route Handler --
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json(); // OpenAI might send { email } or {}
    const userFromSession = await getUserFromRequest(req);

    // Prefer session-based user, fallback to email param if provided
    const userEmail = userFromSession?.email || email;
    if (!userEmail) {
      return NextResponse.json(
        { error: "No user email found in session or request." },
        { status: 401 }
      );
    }

    // Connect to MongoDB and get WHOOP data
    await client.connect();
    const db = client.db("nao"); // Change to your DB name
    const whoopData = await db
      .collection("whoopData") // Change to your collection name
      .findOne({ email: userEmail }, { sort: { date: -1 } }); // Get latest record

    if (!whoopData) {
      return NextResponse.json(
        { error: "No WHOOP data found. Please sync your wearable.", user: userEmail },
        { status: 404 }
      );
    }

    // Shape the data for your assistant
    const { calories_burned, workouts, date } = whoopData;
    // Example: recommend based on data
    let recommendation = "";
    if (calories_burned < 2200 && Array.isArray(workouts)) {
      if (workouts.some((w: any) => w.type === "HIIT")) {
        recommendation = "Try adding a 1 mile run for higher calorie burn.";
      } else {
        recommendation = "Consider a HIIT session or a longer workout for more calories burned.";
      }
    }

    return NextResponse.json({
      calories_burned,
      workouts,
      date,
      recommendation,
      user: userEmail,
      status: "ok"
    });
  } catch (err: any) {
    console.error("[fetchBiometricSurge]", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  } finally {
    // Optionally: await client.close(); // For serverless, you may not want to close
  }
}