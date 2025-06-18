import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Extract user data
  let { username, email, healthGoals, connectWearables } = req.body;

  // Fallbacks for common onboarding flows (for backward compatibility)
  // If username/email missing, try to use name/email fields
  if (!username && typeof req.body.name === 'string') username = req.body.name;
  if (!email && typeof req.body.email === 'string') email = req.body.email;

  // Provide defaults if healthGoals/connectWearables are missing
  if (!healthGoals) healthGoals = "General wellness";
  if (typeof connectWearables !== 'boolean') connectWearables = false;

  // Validate all fields are present
  if (
    typeof username !== 'string' ||
    typeof email !== 'string' ||
    typeof healthGoals !== 'string' ||
    typeof connectWearables !== 'boolean'
  ) {
    return res
      .status(400)
      .json({ message: 'Missing or invalid required fields' });
  }

  try {
    // Log the outgoing request for debugging
    console.log("Onboarding: Sending to NAO backend:", {
      username, email, healthGoals, connectWearables
    });

    // Forward user data to NAO backend /onboard endpoint
    const backendRes = await fetch('https://nao-sdk-api.onrender.com/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email,
        healthGoals,
        connectWearables,
      }),
    });

    let backendData: any = {};
    try {
      backendData = await backendRes.json();
    } catch (e) {
      // If backend didn't return JSON, log and handle gracefully
      console.error("Onboarding: Could not parse backend JSON:", e);
      backendData = { message: "Invalid JSON from backend" };
    }

    if (!backendRes.ok) {
      console.error("Onboarding: NAO backend error:", backendRes.status, backendData);
      return res
        .status(backendRes.status)
        .json({ message: backendData.message || 'Backend error', details: backendData });
    }

    // Log successful onboarding for visibility
    console.log("Onboarding: Success response from NAO backend:", backendData);

    return res.status(200).json({ message: 'User onboarded successfully', ...backendData });
  } catch (error: any) {
    console.error("Onboarding: Internal Server Error:", error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
}