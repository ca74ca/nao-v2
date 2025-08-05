import connectToDatabase from "./mongodb";

interface FraudEvent {
  platform: string;
  verdict: "FRAUD" | "SAFE";
  valueUSD: number;
  viewsPrevented: number;
  videoId: string;
  meta?: any;
}

export async function logFraudEvent(event: FraudEvent) {
  const { db } = await connectToDatabase();

  await db.collection("fraudEvents").insertOne({
    timestamp: new Date(),
    ...event,
  });
}
