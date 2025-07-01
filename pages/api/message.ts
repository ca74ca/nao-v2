import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

// Use node-fetch for server-side fetch
const fetch = (...args: any[]) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { threadId, message, page, onboardingComplete, userId } = req.body;

  if (!threadId || !message) {
    return res.status(400).json({ error: "Missing threadId or message" });
  }

  try {
    const runs = await openai.beta.threads.runs.list(threadId, { limit: 1 });
    const latestRun = runs.data[0];
    if (
      latestRun &&
      ["queued", "in_progress", "cancelling"].includes(latestRun.status)
    ) {
      return res.status(400).json({
        error: "Assistant is still responding. Please wait for the previous response to finish.",
        runStatus: latestRun.status,
      });
    }

    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    let instructions = `You are NAO, a futuristic AI health assistant.`;
    if (page) instructions += ` The user is currently on the "${page}" page.`;
    if (typeof onboardingComplete === "boolean") {
      instructions += onboardingComplete
        ? ` The user has completed onboarding.`
        : ` The user has NOT completed onboarding.`;
    }
    instructions += ` Respond intelligently and avoid repeating onboarding prompts.`;

    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID!,
      instructions,
    });

    let runStatus = run.status;
    let lastRun = run;
    while (["queued", "in_progress", "cancelling", "requires_action"].includes(runStatus)) {
      if (runStatus === "requires_action" && lastRun.required_action?.submit_tool_outputs) {
        const toolCalls = lastRun.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs: { tool_call_id: string; output: string }[] = [];

        for (const call of toolCalls) {
          if (call.type === "function" && call.function.name === "onboardUser") {
            let args: any = {};
            try {
              args = JSON.parse(call.function.arguments);
            } catch (e) {
              console.error("Failed to parse tool call arguments:", call.function.arguments, e);
            }

            const userWithWallet = {
              ...args,
              walletId: `0x${Math.floor(Math.random() * 1e16).toString(16)}`,
              passportId: `NFT-${Math.random().toString(36).substring(2, 10)}`,
              xp: 0,
              evolutionLevel: 1,
              nftImage: "/nft-preview.png",
              nftTitle: "NAO Health NFT",
              nftMeta: "Dynamic, evolving health record",
            };

            try {
              const usersFile = path.join(process.cwd(), "users.json");
              let users: { [key: string]: any } = {};
              if (fs.existsSync(usersFile)) {
                users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
              }
              users[userWithWallet.email] = userWithWallet;
              fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
            } catch (e) {
              console.error("❌ Failed to write user file:", e);
            }

            toolOutputs.push({
              tool_call_id: call.id,
              output: JSON.stringify({ success: true, ...userWithWallet }),
            });
          } else {
            toolOutputs.push({
              tool_call_id: call.id,
              output: JSON.stringify({ error: "Unknown tool/function" }),
            });
          }
        }

        await openai.beta.threads.runs.submitToolOutputs(threadId, lastRun.id, {
          tool_outputs: toolOutputs,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      lastRun = await openai.beta.threads.runs.retrieve(threadId, run.id);
      runStatus = lastRun.status;
    }

    if (runStatus !== "completed") {
      console.error("❌ Assistant run failed:", lastRun);
      return res.status(500).json({
        error: "Assistant run failed or cancelled.",
        runStatus,
        lastRun,
      });
    }

    const messages = await openai.beta.threads.messages.list(threadId, { limit: 10 });
    const lastAssistantMessage = messages.data.find((msg) => msg.role === "assistant");

    const textBlock = lastAssistantMessage?.content?.find(
      (block: any) => block.type === "text"
    ) as { type: "text"; text: { value: string } } | undefined;

    // --- WORKOUT LOGIC INTEGRATION ---

    // Helper: does the assistant message look like a workout summary?
    const isWorkoutSummary = (text: string) =>
      /your workout log|workout summary|workout recorded|logged for you|here is your log|health passport/i.test(text);

    // Helper: does the user confirm to log?
    const isUserConfirmation = (text: string) =>
      /^(yes|log it|that's correct|done|no, that's all|looks good|confirm)$/i.test(text.trim());

    // Only proceed if both are true
    if (
      textBlock?.text?.value &&
      lastAssistantMessage?.role === "assistant" &&
      isWorkoutSummary(textBlock.text.value) &&
      isUserConfirmation(message)
    ) {
      // Get userId from the request, session, or thread (customize as needed)
      // For production, replace with real session-based user ID
      const realUserId = userId || req.body.userId || req.query.userId || "user-" + threadId;

      // The actual summary text
      const workoutText = textBlock.text.value;

      // Call backend to log and verify
      const backendUrl = process.env.NAO_BACKEND_URL || "http://localhost:3001";
      const verifyRes = await fetch(`${backendUrl}/api/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: realUserId, workoutText }),
      });

      if (!verifyRes.ok) {
        const errDetail = await verifyRes.text();
        return res.status(500).json({
          error: "Failed to log workout",
          details: errDetail,
        });
      }

      const verifyData = await verifyRes.json();

      // Build the reply with AI verification
      let reply = textBlock.text.value;
      if (verifyData?.aiResult) {
        reply += `

---
**AI Verified:** ${verifyData.aiResult.plausible ? "✅ Plausible" : "⚠️ Unusual"}
- *Reasoning*: ${verifyData.aiResult.reasoning}
- *Suggestion*: ${verifyData.aiResult.suggestion}
`;
      }

      return res.status(200).json({
        reply,
        threadId,
        aiVerification: verifyData,
      });
    }

    // --- END WORKOUT LOGIC ---

    res.status(200).json({
      reply: textBlock?.text?.value || "NAO is thinking...",
      threadId,
    });
  } catch (error: any) {
    console.error("❌ Error in /api/message:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error?.message || JSON.stringify(error),
      stack: error?.stack,
    });
  }
}