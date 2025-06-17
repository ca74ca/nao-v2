import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { threadId, message } = req.body;

  if (!threadId || !message) {
    return res.status(400).json({ error: "Missing threadId or message" });
  }

  try {
    // 1. Check if there is an active run for this thread
    const runs = await openai.beta.threads.runs.list(threadId, { limit: 1 });
    const latestRun = runs.data[0];
    if (
      latestRun &&
      ["queued", "in_progress", "cancelling"].includes(latestRun.status)
    ) {
      return res.status(400).json({
        error:
          "Assistant is still responding. Please wait for the previous response to finish.",
        runStatus: latestRun.status,
      });
    }

    // 2. Add user's message to the thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    // 3. Start a run with the assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID!,
    });

    // 4. Poll for run completion, handling tool calls if needed
    let runStatus = run.status;
    let lastRun = run;
    while (["queued", "in_progress", "cancelling", "requires_action"].includes(runStatus)) {
      if (runStatus === "requires_action" && lastRun.required_action?.submit_tool_outputs) {
        const toolCalls = lastRun.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs = [];
        for (const call of toolCalls) {
          if (call.type === "function" && call.function.name === "onboardUser") {
            // Parse arguments
            let args: any = {};
            try {
              args = JSON.parse(call.function.arguments);
            } catch (e) {
              console.error("Failed to parse function arguments:", call.function.arguments, e);
            }
            // --- STORE USER TO FILE (object keyed by email) ---
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
              // Save/overwrite user by email
              users[userWithWallet.email] = userWithWallet;
              fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
            } catch (e) {
              console.error("Failed to write user to file:", e);
            }
            // --- END STORE USER ---

            // Return tool output to OpenAI
            toolOutputs.push({
              tool_call_id: call.id,
              output: JSON.stringify({ success: true, ...userWithWallet }),
            });
          } else {
            // Unknown tool/function
            toolOutputs.push({
              tool_call_id: call.id,
              output: JSON.stringify({ error: "Unknown tool/function" }),
            });
          }
        }
        // Submit the tool outputs to OpenAI
        await openai.beta.threads.runs.submitToolOutputs(
          threadId,
          lastRun.id,
          { tool_outputs: toolOutputs }
        );
      }

      // Wait and poll again
      await new Promise((resolve) => setTimeout(resolve, 1000));
      lastRun = await openai.beta.threads.runs.retrieve(threadId, run.id);
      runStatus = lastRun.status;
    }

    if (runStatus !== "completed") {
      console.error("Assistant run did not complete:", lastRun);
      return res.status(500).json({
        error: "Assistant run failed or was cancelled.",
        runStatus,
        lastRun,
      });
    }

    // 5. Get the most recent assistant message in the thread
    const messages = await openai.beta.threads.messages.list(threadId, { limit: 10 });
    const lastAssistantMessage = messages.data.find(
      (msg) => msg.role === "assistant"
    );

    // 6. Find the first text block in the assistant's message content
    const textBlock = lastAssistantMessage?.content?.find(
      (block: any) => block.type === "text"
    );

    res.status(200).json({
      reply: textBlock?.text?.value || "No reply.",
      threadId,
    });
  } catch (error: any) {
    console.error("Error in /api/message:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error?.message || JSON.stringify(error),
      stack: error?.stack || undefined,
    });
  }
}