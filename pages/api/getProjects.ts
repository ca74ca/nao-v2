import connectToDatabase from "@/lib/mongodb";
import { logUsage } from "@/lib/logUsage";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Missing email" });
    const session = await getServerSession(req, res, authOptions);
if (!session) return res.status(401).json({ error: "Not authenticated" });

    const client = await connectToDatabase;
    const db = client.db();

    const projects = await db.collection("projects").find({ email }).toArray();

    await logUsage({ email, action: "getProjects" });

    res.status(200).json({ projects });
  } catch (err) {
    console.error("getProjects error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
