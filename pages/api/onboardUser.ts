import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  message: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { username, email, password, healthGoals, connectWearables } = req.body;

  // Validate all fields are present
  if (
    typeof username !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof healthGoals !== 'string' ||
    typeof connectWearables !== 'boolean'
  ) {
    return res
      .status(400)
      .json({ message: 'Missing or invalid required fields' });
  }

  // Log values to the console
  console.log('Onboarding user:', {
    username,
    email,
    password,
    healthGoals,
    connectWearables,
  });

  return res.status(200).json({ message: 'User onboarded successfully' });
}