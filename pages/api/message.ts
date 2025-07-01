import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

// node-fetch for server-side requests
const fetch = (...args: any[]) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { threadId, message, page, onboardingComplete, userId } = req.body;
  if (!threadId || !message)
    return res.status(400).json({ error: "Missing threadId or message" });

  try {
    // 1 ▸ block double-send if a run is still live
    const last = await openai.beta.threads.runs.list(threadId, { limit: 1 });
    const active = last.data[0];
    if (active && ["queued", "in_progress", "cancelling"].includes(active.status))
      return res
        .status(400)
        .json({ error: "Assistant still responding", runStatus: active.status });

    // 2 ▸ append user message
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    // 3 ▸ build run instructions
    let instructions = `You are NAO, a futuristic AI health assistant.`;
    if (page) instructions += ` User is on "${page}".`;
    if (typeof onboardingComplete === "boolean")
      instructions += onboardingComplete
        ? ` Onboarding complete.`
        : ` Onboarding NOT complete.`;
    instructions += ` Respond intelligently; avoid repeating onboarding prompts.`;

    // 4 ▸ start the run
    let run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID!,
      instructions,
    });

    // 5 ▸ main polling / tool-handling loop
    while (["queued", "in_progress", "cancelling", "requires_action"].includes(run.status)) {
      if (
        run.status === "requires_action" &&
        run.required_action?.submit_tool_outputs
      ) {
        const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs: { tool_call_id: string; output: string }[] = [];

        /* -----------------------------------------------------------
           TOOL-CALL HANDLER  ➜ onboardUser • logWorkout • getRecentWorkouts
        ----------------------------------------------------------- */
        for (const call of toolCalls) {
          /* ─────────── onboardUser ─────────── */
          if (call.function.name === "onboardUser") {
            let args: any = {};
            try { args = JSON.parse(call.function.arguments); } catch {}
            const newUser = {
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
              let users = fs.existsSync(usersFile)
                ? JSON.parse(fs.readFileSync(usersFile, "utf8"))
                : {};
              users[newUser.email] = newUser;
              fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
            } catch (e) {
              console.error("❌ write users.json", e);
            }
            toolOutputs.push({
              tool_call_id: call.id,
              output: JSON.stringify({ success: true, ...newUser }),
            });
            continue;               // ⬅ keep going to next call
          }

         /* ─────────── logWorkout ─────────── */
if (call.function.name === "logWorkout") {
  let args: any = {};
  try {
    args = JSON.parse(call.function.arguments);
  } catch {}

  const backend = process.env.NAO_BACKEND_URL || "http://localhost:3001";

  try {
    // call the updated verify route that returns reward data
    const verifyRes = await fetch(`${backend}/api/verifyWorkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: args.userId || userId || `user-${threadId}`,
        workoutText: args.workoutText,
      }),
    });

    const verifyData = await verifyRes.json();

    /* pull reward fields */
    const {
      success,
      aiResult,
      xpGained,
      newLevel,
      updatedStreak,
      rewardPoints,
    } = verifyData;

    toolOutputs.push({
      /* return everything to OpenAI so NAO can speak it */
      tool_call_id: call.id,
      output: JSON.stringify({
        success,
        aiResult,
        xpGained,
        newLevel,
        updatedStreak,
        rewardPoints,
        message: `Workout logged! +${xpGained} XP · Level ${newLevel} · ${updatedStreak}-day streak · ${rewardPoints} points.`,
      }),
    });
  } catch (err) {
    console.error("❌ verifyWorkout error:", err);
    toolOutputs.push({
      tool_call_id: call.id,
      output: JSON.stringify({ error: "Failed to log workout" }),
    });
  }

  continue; // go to next tool call
}


          /* ──────── NEW: getRecentWorkouts ──────── */
          if (call.function.name === "getRecentWorkouts") {
            let args: any = {};
            try { args = JSON.parse(call.function.arguments); } catch {}
            const { userId: uid, limit = 5 } = args;

            try {
              const backend = process.env.NAO_BACKEND_URL || "http://localhost:3001";
              const resp = await fetch(`${backend}/api/history/${uid}?limit=${limit}`);
              const data = await resp.json();
              toolOutputs.push({
                tool_call_id: call.id,
                output: JSON.stringify(data.logs),
              });
            } catch (err) {
              console.error("Failed getRecentWorkouts:", err);
              toolOutputs.push({
                tool_call_id: call.id,
                output: JSON.stringify({ error: "Failed to fetch workouts" }),
              });
            }
            continue;
          }

          /* ─────────── unknown tool fallback ─────────── */
          toolOutputs.push({
            tool_call_id: call.id,
            output: JSON.stringify({ error: "Unknown tool/function" }),
          });
        }
        /* ----------------------------------------------------------- */

        // submit all outputs back to OpenAI
        await openai.beta.threads.runs.submitToolOutputs(
          threadId,
          run.id,
          { tool_outputs: toolOutputs }
        );
      }

      // wait & poll again
      await new Promise((r) => setTimeout(r, 1000));
      run = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }

    if (run.status !== "completed")
      return res
        .status(500)
        .json({ error: "Assistant run failed", runStatus: run.status });

    /* ───────────── return final assistant text ─────────── */
    const msgs = await openai.beta.threads.messages.list(threadId, { limit: 10 });
    const lastMsg = msgs.data.find((m) => m.role === "assistant");
    const textBlock = lastMsg?.content?.find((b: any) => b.type === "text") as
      | { type: "text"; text: { value: string } }
      | undefined;

    res.status(200).json({
      reply: textBlock?.text?.value || "NAO is thinking...",
      threadId,
    });
  } catch (error: any) {
    console.error("❌ /api/message error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error?.message,
    });
  }
}