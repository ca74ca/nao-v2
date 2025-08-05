import connectToDatabase from "@/lib/mongodb";
import crypto from "crypto";
import { logUsage } from "@/lib/logUsage";

function generateApiKey() {
  return "sk_live_" + crypto.randomBytes(32).toString("hex");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Missing email" });

    const client = await connectToDatabase;
    const db = client.db();

    const result = await db.collection("projects").insertOne({
      email,
      projectName: "Untitled Project",
      apiKey: generateApiKey(),
      createdAt: new Date(),
    });

    await logUsage({ email, projectId: result.insertedId.toString(), action: "createProject" });

    res.status(200).json({ projectId: result.insertedId });
  } catch (err) {
    console.error("createProject error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
