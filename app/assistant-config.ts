let assistantId: string;

if (!process.env.OPENAI_ASSISTANT_ID) {
  throw new Error("❌ Missing OPENAI_ASSISTANT_ID in environment");
}

assistantId = process.env.OPENAI_ASSISTANT_ID;

export { assistantId };
