import axios from "axios";

interface ScoreEffortInput {
  content: string;
  timestamp: string;
  likes: number;
  views: number;
  accountInfo: {
    bio: string;
    username: string;
  };
}

interface ScoreEffortResult {
  engagementRatio: string;
  temporalAnomaly: boolean;
  repeatedBio: boolean;
  aiVerdict: string;
  isLowEffort: boolean;
}

export async function scoreEffort(data: ScoreEffortInput): Promise<ScoreEffortResult> {
  try {
    const response = await axios.post("https://naoverse.io/api/scoreEffort", data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || "Failed to score effort");
  }
}
