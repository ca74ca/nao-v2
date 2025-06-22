import { openai } from "@/app/openai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  context: { params: Record<string, string> }
) {
  const threadId = context.params.threadId;
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: process.env.OPENAI_ASSISTANT_ID!,
  });
  return Response.json({ runId: run.id });
}
