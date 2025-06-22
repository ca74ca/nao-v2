import { openai } from "@/app/openai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// ✅ Use Record<string, string> for params for Next.js 15+ compatibility!
export async function POST(
  req: NextRequest,
  { params }: { params: Record<string, string> }
) {
  const { threadId } = params;

  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: process.env.OPENAI_ASSISTANT_ID!,
  });

  return Response.json({ runId: run.id });
}