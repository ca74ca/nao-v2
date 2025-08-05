import connectToDatabase from "@/lib/mongodb";

// ✅ Usage Log
export async function logUsage({ email, projectId, action }: {
  email: string;
  projectId?: string;
  action: string;
}) {
  try {
    const { db } = await connectToDatabase(); // ✅ FIXED
    await db.collection("usageLogs").insertOne({
      email,
      projectId: projectId || null,
      action,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("❌ logUsage failed:", err);
    // Don't throw — logging failure shouldn't break main flow
  }
}

// ✅ Error Log
export async function logError({ email, projectId, error }: {
  email: string;
  projectId?: string;
  error: string;
}) {
  try {
    const { db } = await connectToDatabase(); // ✅ FIXED
    await db.collection("errorLogs").insertOne({
      email,
      projectId: projectId || null,
      error,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("❌ logError failed:", err);
    // Don't throw — logging failure shouldn't break main flow
  }
}
