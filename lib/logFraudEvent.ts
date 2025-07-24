import { connectToDatabase } from "./db";

export async function logFraudEvent({
  type,
  amount = 0,
  views = 0,
}: {
  type: "fake" | "real";
  amount?: number;
  views?: number;
}) {
  const { db } = await connectToDatabase();
  const collection = db.collection("fraudEvents");

  await collection.insertOne({
    type,
    amount,
    views,
    timestamp: new Date(),
  });
}
