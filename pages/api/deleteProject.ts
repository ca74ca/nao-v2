import connectToDatabase from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { logUsage } from "@/lib/logUsage";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  try {
    const { projectId, email } = req.body;
    if (!projectId || !email) return res.status(400).json({ error: "Missing projectId or email" });

    const client = await connectToDatabase;
    const db = client.db();

    const result = await db.collection("projects").deleteOne({
      _id: new ObjectId(projectId),
    });

    await logUsage({ email, projectId, action: "deleteProject" });

    res.status(200).json({ deleted: result.deletedCount });
  } catch (err) {
    console.error("deleteProject error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
