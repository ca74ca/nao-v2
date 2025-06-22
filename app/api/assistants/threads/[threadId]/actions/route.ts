import { openai } from "@/app/openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  context: { params: { threadId: string } }
) {
  const threadId = context.params.threadId;

  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: process.env.OPENAI_ASSISTANT_ID!,
  });

  return NextResponse.json({ runId: run.id });
}