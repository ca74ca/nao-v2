import { openai } from "@/app/openai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// Create a new thread
export async function POST(req: NextRequest) {
  const thread = await openai.beta.threads.create();
  return new Response(JSON.stringify({ threadId: thread.id }), {
    headers: { "Content-Type": "application/json" },
  });
}
