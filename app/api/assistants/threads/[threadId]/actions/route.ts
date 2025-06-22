import { openai } from "@/app/openai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// Do not use a separate context type, destructure params in the handler argument
export async function POST(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const { threadId } = params;

  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: process.env.OPENAI_ASSISTANT_ID!,
  });

  return Response.json({ runId: run.id });
}