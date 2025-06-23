import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  context: { params: { threadId: string } }
) {
  const threadId = context.params.threadId;
  return new Response(JSON.stringify({ runId: `mock-run-for-${threadId}` }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
