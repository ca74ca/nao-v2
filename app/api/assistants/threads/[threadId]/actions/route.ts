import { openai } from "@/app/openai";
import { NextRequest } from "next/server";

// Send a new message to a thread
export async function POST(
  request: NextRequest,
  context: { params: { threadId: string } }
) {
  const { threadId } = context.params;
  const { toolCallOutputs, runId } = await request.json();

  const stream = openai.beta.threads.runs.submitToolOutputsStream(
    threadId,
    runId,
    { tool_outputs: toolCallOutputs }
  );

  return new Response(stream.toReadableStream());
}