// pages/api/message.ts  ◆ FULL WORKING VERSION ◆
import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { threadId, message, page, onboardingComplete, userId } = req.body;
  if (!threadId || !message)
    return res.status(400).json({ error: "Missing threadId or message" });

  try {
    /* 1 ▸ block double-send if a run is still live */
    const last = await openai.beta.threads.runs.list(threadId, { limit: 1 });
    const active = last.data[0];
    if (active && ["queued", "in_progress", "cancelling"].includes(active.status))
      return res
        .status(400)
        .json({ error: "Assistant still responding", runStatus: active.status });

    /* 2 ▸ append user message */
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    /* 3 ▸ build run instructions */
    let instructions = `You are NAO, a futuristic AI health assistant.`;
    if (page) instructions += ` User is on "${page}".`;
    if (typeof onboardingComplete === "boolean")
      instructions += onboardingComplete ? ` Onboarding complete.` : ` Onboarding NOT complete.`;
    instructions += ` Respond intelligently; avoid repeating onboarding prompts.`;

    /* 4 ▸ start the run  (TOOLS ARRAY ADDED) */
    let run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID!,
      instructions,
      tools: [
        { type: "function", function: { name: "onboardUser" } },
        { type: "function", function: { name: "logWorkout" } },
        { type: "function", function: { name: "getRewardStatus" } },   // new
        { type: "function", function: { name: "getRecentWorkouts" } },
        { type: "function", function: { name: "trigger_nft_evolution" } }
      ],
    });

    /* 5 ▸ main polling / tool-handling loop */
    while (["queued", "in_progress", "cancelling", "requires_action"].includes(run.status)) {
      if (run.status === "requires_action" && run.required_action?.submit_tool_outputs) {
        const toolCalls  = run.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs: { tool_call_id: string; output: string }[] = [];

        /* -----------------------------------------------------------
           TOOL-CALL HANDLER  ➜ onboardUser • logWorkout • getRewardStatus • getRecentWorkouts
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
            continue;
          }

  /* ─────────── logWorkout ─────────── */
if (call.function.name === "logWorkout") {
  let args: any = {};
  try {
    args = JSON.parse(call.function.arguments);
  } catch {}

  const backend =
    process.env.NEXT_PUBLIC_NAO_BACKEND_URL ||
    process.env.NAO_BACKEND_URL ||
    "http://localhost:3001";

  // 🧠 Try to extract wallet from (a) tool args (b) context (c) cookie
  let cookieWallet: string | undefined = undefined;
  if (typeof req !== "undefined" && req.headers?.cookie) {
    const match = req.headers.cookie.match(/wallet=([^;]+)/);
    if (match && match[1]?.startsWith("0x")) {
      cookieWallet = match[1];
    }
  }

  const walletAddress =
    (typeof args.userId === "string" && args.userId.startsWith("0x")) ? args.userId
    : (typeof userId === "string" && userId.startsWith("0x")) ? userId
    : cookieWallet || null;

  if (!walletAddress) {
    console.error("❌ No wallet found for logWorkout");
    toolOutputs.push({
      tool_call_id: call.id,
      output: JSON.stringify({ error: "No wallet address found. Please connect your wallet." }),
    });
    continue;
  }

  try {
    const verifyRes = await fetch(`${backend}/api/verifyWorkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: walletAddress, // ✅ Always a real wallet ID now
        workoutText: args.workoutText || args.message || message || "",
      }),
    });

    const verifyData = await verifyRes.json();
    const { success, aiResult, xpGained, newLevel, updatedStreak, rewardPoints } = verifyData;

    toolOutputs.push({
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
  continue;
}


          /* ─────────── NEW: getRewardStatus ─────────── */
          if (call.function.name === "getRewardStatus") {
            let args: any = {};
            try { args = JSON.parse(call.function.arguments); } catch {}
            
            // 🧠 Try to extract wallet from (a) tool args (b) context (c) cookie
            let cookieWallet: string | undefined = undefined;
            if (typeof req !== "undefined" && req.headers?.cookie) {
              const match = req.headers.cookie.match(/wallet=([^;]+)/);
              if (match && match[1]?.startsWith("0x")) {
                cookieWallet = match[1];
              }
            }

            const walletAddress =
              (typeof args.userId === "string" && args.userId.startsWith("0x")) ? args.userId
              : (typeof userId === "string" && userId.startsWith("0x")) ? userId
              : cookieWallet || null;

            if (!walletAddress) {
              console.error("❌ No wallet found for getRewardStatus");
              toolOutputs.push({
                tool_call_id: call.id,
                output: JSON.stringify({ error: "No wallet address found. Please connect your wallet." }),
              });
              continue;
            }

            const backend =
              process.env.NEXT_PUBLIC_NAO_BACKEND_URL ||
              process.env.NAO_BACKEND_URL ||
              "http://localhost:3001";
            try {
              const resp = await fetch(`${backend}/api/getRewardStatus`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: walletAddress }),
              });
              const data = await resp.json();           // { xp, level, rewardPoints, streak, nftBadges }
              toolOutputs.push({ tool_call_id: call.id, output: JSON.stringify(data) });
            } catch (err) {
              console.error("getRewardStatus error:", err);
              toolOutputs.push({
                tool_call_id: call.id,
                output: JSON.stringify({ error: "Failed to fetch rewards" }),
              });
            }
            continue;
          }

          /* ──────── getRecentWorkouts ──────── */
          if (call.function.name === "getRecentWorkouts") {
            let args: any = {};
            try { args = JSON.parse(call.function.arguments); } catch {}
            const { limit = 5 } = args;

            // 🧠 Try to extract wallet from (a) tool args (b) context (c) cookie
            let cookieWallet: string | undefined = undefined;
            if (typeof req !== "undefined" && req.headers?.cookie) {
              const match = req.headers.cookie.match(/wallet=([^;]+)/);
              if (match && match[1]?.startsWith("0x")) {
                cookieWallet = match[1];
              }
            }

            const walletAddress =
              (typeof args.userId === "string" && args.userId.startsWith("0x")) ? args.userId
              : (typeof userId === "string" && userId.startsWith("0x")) ? userId
              : cookieWallet || null;

            if (!walletAddress) {
              console.error("❌ No wallet found for getRecentWorkouts");
              toolOutputs.push({
                tool_call_id: call.id,
                output: JSON.stringify({ error: "No wallet address found. Please connect your wallet." }),
              });
              continue;
            }

            try {
              const backend =
                process.env.NEXT_PUBLIC_NAO_BACKEND_URL ||
                process.env.NAO_BACKEND_URL ||
                "http://localhost:3001";
              const resp = await fetch(`${backend}/api/history/${walletAddress}?limit=${limit}`);
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
        } /* end for-loop */

        /* submit all outputs back to OpenAI */
        await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, { tool_outputs: toolOutputs });
      } /* end requires_action */

      await new Promise(r => setTimeout(r, 1000));
      run = await openai.beta.threads.runs.retrieve(threadId, run.id);
    } /* end while */

    if (run.status !== "completed")
      return res.status(500).json({ error: "Assistant run failed", runStatus: run.status });

    /* ───────────── return final assistant text ─────────── */
    const msgs = await openai.beta.threads.messages.list(threadId, { limit: 10 });
    const lastMsg = msgs.data.find(m => m.role === "assistant");
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
