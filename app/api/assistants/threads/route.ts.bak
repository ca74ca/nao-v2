import { openai } from "@/app/openai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// Correct dynamic route handler for App Router
export async function POST(
  req: NextRequest,
  context: { params: { threadId: string } }
) {
  const { threadId } = context.params;

  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: process.env.OPENAI_ASSISTANT_ID!,
  });

  return Response.json({ runId: run.id });
}