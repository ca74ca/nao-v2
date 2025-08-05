import connectToDatabase from "@/lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Missing email" });

    const client = await connectToDatabase;
    const db = client.db();

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Aggregate counts by day
    const usage = await db.collection("usageLogs").aggregate([
      { $match: { email, timestamp: { $gte: oneWeekAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%a", date: "$timestamp" }, // 'Mon', 'Tue', etc.
          },
          calls: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]).toArray();

    // Ensure full week structure
    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const result = daysOfWeek.map(day => {
      const match = usage.find(u => u._id === day);
      return { name: day, calls: match?.calls || 0 };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("usageStats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
