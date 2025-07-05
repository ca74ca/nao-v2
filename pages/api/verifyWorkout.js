// pages/api/verifyWorkout.js   (Next-frontend proxy → Render backend)

export default async function handler(req, res) {
  // ⛔ Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const backendURL =
    process.env.BACKEND_URL || "https://nao-sdk-api.onrender.com";

  try {
    // Forward the request to your Render backend
    const backendRes = await fetch(`${backendURL}/api/verifyWorkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body), // contains { userId: walletId, workoutText }
    });

    const data = await backendRes.json();
    res.status(backendRes.status).json(data); // proxy status & body back to the browser
  } catch (err) {
    console.error("[verifyWorkout proxy]", err);
    res.status(500).json({ error: "Proxy failed to reach backend" });
  }
}
