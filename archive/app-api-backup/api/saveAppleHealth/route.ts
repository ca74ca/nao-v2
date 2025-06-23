import { MongoClient } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

// MongoDB client singleton
const client = new MongoClient(process.env.MONGODB_URI!);
const clientPromise = client.connect();

export async function POST(req: NextRequest) {
  const data = await req.json();
  const db = (await clientPromise).db(); // optional: you can specify db("nao") if needed
  await db.collection("appleHealthData").insertOne({
    ...data,
    syncedAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}