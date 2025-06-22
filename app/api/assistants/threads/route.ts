import { openai } from "@/app/openai";

export const runtime = "nodejs";

// Create a new assistant run
export async function POST(req: Request, { params }: { params: { threadId: string } }) {
  const { threadId } = params;

  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: process.env.OPENAI_ASSISTANT_ID!,
  });

  return Response.json({ runId: run.id });
}
