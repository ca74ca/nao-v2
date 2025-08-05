import connectToDatabase from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import { logUsage } from "@/lib/logUsage";

function generateApiKey() {
  return "sk_live_" + crypto.randomBytes(32).toString("hex");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  try {
    const { projectId, newName, newKey } = req.body;
    if (!projectId) return res.status(400).json({ error: "Missing projectId" });

    const client = await connectToDatabase;
    const db = client.db();

    const update: Record<string, any> = {};
    if (newName) update.projectName = newName;
    if (newKey) update.apiKey = generateApiKey();

    const result = await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
      { $set: update }
    );

    await logUsage({ email: "system", projectId, action: newKey ? "regenerateKey" : "renameProject" });

    res.status(200).json({ updated: result.modifiedCount });
  } catch (err) {
    console.error("updateProject error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
