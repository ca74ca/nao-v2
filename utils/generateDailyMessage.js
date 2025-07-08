function generateDailyMessage(user) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning ☀️" :
    hour < 18 ? "Good afternoon 💪" :
    "Good evening 🌙";

  const nextLevelXP = user.level * 100 - user.xp;
  const xpNeeded    = nextLevelXP > 0 ? nextLevelXP : 0;

  return `
${greeting}, ${user.username}!
You’re **Level ${user.level}** with a **${user.streak}-day streak**.

${xpNeeded === 0
  ? "🔥 You just leveled up — let’s secure that streak with today’s workout!"
  : `You need **${xpNeeded} XP** to reach Level ${user.level + 1} and unlock your next reward.`}

Tell me what you plan to do (or ask for a quick suggestion) and I’ll log it & boost your NFT.
`.trim();
}

module.exports = { generateDailyMessage };