import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { threadId, message, page, onboardingComplete } = req.body;

  if (!threadId || !message) {
    return res.status(400).json({ error: "Missing threadId or message" });
  }

  try {
    // 1. Prevent overlapping runs
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

    // 2. Add user's message to thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    // 3. Build context-aware instructions
    let instructions = `You are NAO, a futuristic AI health assistant.`;
    if (page) instructions += ` The user is currently on the "${page}" page.`;
    if (typeof onboardingComplete === "boolean") {
      instructions += onboardingComplete
        ? ` The user has completed onboarding.`
        : ` The user has NOT completed onboarding.`;
    }
    instructions += ` Respond intelligently and avoid repeating onboarding prompts.`;

    // 4. Start assistant run with context
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID!,
      instructions,
    });

    // 5. Handle tool calls and poll for completion
    let runStatus = run.status;
    let lastRun = run;
    while (["queued", "in_progress", "cancelling", "requires_action"].includes(runStatus)) {
      if (runStatus === "requires_action" && lastRun.required_action?.submit_tool_outputs) {
        const toolCalls = lastRun.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs = [];

        for (const call of toolCalls) {
          if (call.type === "function" && call.function.name === "onboardUser") {
            let args: any = {};
            try {
              args = JSON.parse(call.function.arguments);
            } catch (e) {
              console.error("Failed to parse tool call arguments:", call.function.arguments, e);
            }

            // Simulated user+wallet storage
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

        // Submit all tool outputs
        await openai.beta.threads.runs.submitToolOutputs(threadId, lastRun.id, {
          tool_outputs: toolOutputs,
        });
      }

      // Wait and poll again
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

    // 6. Get latest assistant message
    const messages = await openai.beta.threads.messages.list(threadId, { limit: 10 });
    const lastAssistantMessage = messages.data.find((msg) => msg.role === "assistant");
    const textBlock = lastAssistantMessage?.content?.find((block: any) => block.type === "text");

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
