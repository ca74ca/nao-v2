export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const backendURL = "https://nao-sdk-api.onrender.com";
  const backendRes = await fetch(`${backendURL}/api/verifyWorkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req.body),
  });
  const data = await backendRes.json();
  res.status(backendRes.status).json(data);
}