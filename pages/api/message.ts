import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  /* ─────────── guard HTTP verb ─────────── */
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  /* ─────────── pull body fields ─────────── */
  const { threadId, message, page, onboardingComplete, userId } = req.body as {
    threadId: string;
    message: string;
    page?: string;
    onboardingComplete?: boolean;
    userId?: string;
  };

  if (!threadId || !message) {
    return res.status(400).json({ error: "Missing threadId or message" });
  }

  try {
    /* ──────────────────────────────────────────────────────────────
       1 ▸ prevent double-send if a previous run is still active
    ────────────────────────────────────────────────────────────── */
    const last = await openai.beta.threads.runs.list(threadId, { limit: 1 });
    const active = last.data[0];
    if (active && ["queued", "in_progress", "cancelling"].includes(active.status)) {
      return res
        .status(400)
        .json({ error: "Assistant still responding", runStatus: active.status });
    }

    /* ──────────────────────────────────────────────────────────────
       2 ▸ append the new user message to the thread
    ────────────────────────────────────────────────────────────── */
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    /* ──────────────────────────────────────────────────────────────
       3 ▸ build NAO’s system-level instructions
    ────────────────────────────────────────────────────────────── */
    let instructions = `
You are **NAO**, the user's intelligent on-chain Health Passport.

Core capabilities you MUST highlight and use:
• Log workouts via AI verification (tool: logWorkout) — grants XP, energy credits, USDC rewards, and evolves a dynamic NFT.
• Recall past activity (tool: getRecentWorkouts).
• Show current XP, streak, level, credits, and USDC balance (tool: getUserRewards).
• All user data lives in MongoDB and on-chain NFTs — you can access it through the tools.
• NEVER suggest external apps like Strava/Fitbit; NAO itself is the reward engine.

Always answer with an encouraging, futuristic tone. If the user asks about history or rewards, call the tools and include real numbers.
`;

    if (page) instructions += ` The user is currently on the "${page}" page.`;
    if (typeof onboardingComplete === "boolean") {
      instructions += onboardingComplete
        ? ` Onboarding is complete — normal assistant mode.`
        : ` Onboarding is NOT yet complete — keep guiding them.`;
    }

    /* ──────────────────────────────────────────────────────────────
       4 ▸ start the assistant run
    ────────────────────────────────────────────────────────────── */
    let run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID!,
      instructions,
      /* optional but explicit: tell the model which function names exist */
      tools: [
        { type: "function", function: { name: "onboardUser" } },
        { type: "function", function: { name: "logWorkout" } },
        { type: "function", function: { name: "getRecentWorkouts" } },
        { type: "function", function: { name: "getUserRewards" } },
      ],
    });

    /* ──────────────────────────────────────────────────────────────
       5 ▸ main polling / tool-handling loop
    ────────────────────────────────────────────────────────────── */
    while (["queued", "in_progress", "cancelling", "requires_action"].includes(run.status)) {
      if (
        run.status === "requires_action" &&
        run.required_action?.submit_tool_outputs
      ) {
        const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs: { tool_call_id: string; output: string }[] = [];

        /* ───────────────────────────────────────────────────────
           TOOL CALL DISPATCH
           ─ onboardUser  •  logWorkout  •  getRecentWorkouts  •  getUserRewards
        ─────────────────────────────────────────────────────── */
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
              const users = fs.existsSync(usersFile)
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
            continue;
          }

          /* ─────────── logWorkout ─────────── */
          if (call.function.name === "logWorkout") {
            let args: any = {};
            try { args = JSON.parse(call.function.arguments); } catch {}

            const backend = process.env.NAO_BACKEND_URL || "http://localhost:3001";

            try {
              const verifyRes = await fetch(`${backend}/api/verifyWorkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: args.userId || userId || `user-${threadId}`,
                  workoutText: args.workoutText,
                }),
              });

              const verifyData = await verifyRes.json();
              const {
                success,
                aiResult,
                xpGained,
                newLevel,
                updatedStreak,
                rewardPoints,
              } = verifyData;

              toolOutputs.push({
                tool_call_id: call.id,
                output: JSON.stringify({
                  success,
                  aiResult,
                  xpGained,
                  newLevel,
                  updatedStreak,
                  rewardPoints,
                  message: `Workout logged! +${xpGained} XP · Level ${newLevel} · ${updatedStreak}-day streak · ${rewardPoints} pts.`,
                }),
              });
            } catch (err) {
              console.error("❌ verifyWorkout error:", err);
              toolOutputs.push({
                tool_call_id: call.id,
                output: JSON.stringify({ error: "Failed to log workout" }),
              });
            }
            continue;
          }

          /* ─────────── getRecentWorkouts ─────────── */
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

          /* ─────────── getUserRewards ─────────── */
          if (call.function.name === "getUserRewards") {
            let args: any = {};
            try { args = JSON.parse(call.function.arguments); } catch {}
            const { userId: uid } = args;

            try {
              const backend = process.env.NAO_BACKEND_URL || "http://localhost:3001";
              const resp = await fetch(`${backend}/api/rewards/${uid}`);
              const data = await resp.json(); // { xp, level, streak, credits, usdc }
              toolOutputs.push({
                tool_call_id: call.id,
                output: JSON.stringify(data),
              });
            } catch (err) {
              console.error("Failed getUserRewards:", err);
              toolOutputs.push({
                tool_call_id: call.id,
                output: JSON.stringify({ error: "Failed to fetch user rewards" }),
              });
            }
            continue;
          }

          /* ─────────── unknown tool fallback ─────────── */
          toolOutputs.push({
            tool_call_id: call.id,
            output: JSON.stringify({ error: "Unknown tool/function" }),
          });
        } // end for-loop

        /* ──────────────────────────────────────────────────────────
           submit outputs back to OpenAI
        ────────────────────────────────────────────────────────── */
        await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
          tool_outputs: toolOutputs,
        });
      }

      /* wait 1 s then poll again */
      await new Promise((r) => setTimeout(r, 1000));
      run = await openai.beta.threads.runs.retrieve(threadId, run.id);
    } // end while

    /* ───────────────────────────────
       run finished but not completed
    ─────────────────────────────── */
    if (run.status !== "completed") {
      return res
        .status(500)
        .json({ error: "Assistant run failed", runStatus: run.status });
    }

    /* ───────────────────────────────
       pull final assistant reply
    ─────────────────────────────── */
    const msgs = await openai.beta.threads.messages.list(threadId, { limit: 10 });
    const lastMsg = msgs.data.find((m) => m.role === "assistant");
    const textBlock = lastMsg?.content?.find((b: any) => b.type === "text") as
      | { type: "text"; text: { value: string } }
      | undefined;

    return res.status(200).json({
      reply: textBlock?.text?.value || "NAO is thinking...",
      threadId,
    });
  } catch (error: any) {
    console.error("❌ /api/message error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error?.message,
    });
  }
}
