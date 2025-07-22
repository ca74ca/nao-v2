export const startupTips = [
  'NAO remembers your progress — your body will too. Stay consistent.',
  'The future of fitness pays you. Keep moving, keep earning USDC.',
  'Small wins stack fast. Streaks unlock rewards. Health is wealth.',
  'Your health passport is evolving. Sync daily to grow stronger.',
  "If you don't understand money, you'll never understand crypto. If you don't understand health, you'll never understand life. — CZ, Binance",
  'Your brain rewards forward progress. Small wins, daily, rewire your mind for success and longevity. — Andrew Huberman',
  'Discipline is doing what you hate to do but doing it like you love it. — Mike Tyson',
  'Without discipline, no matter how good you are, you are nothing. — Mike Tyson',
  'The most powerful medicine is at the end of your fork. — Mark Hyman',
  "Food isn't just calories; it's information. It talks to your DNA and tells it what to do. — Mark Hyman",
  'Knowing is not enough, we must apply. Willing is not enough, we must do. — Bruce Lee',
  'Be water, my friend. — Bruce Lee'
];

export function getDailyTip() {
  const today = new Date().toISOString().slice(0, 10);
  const daySeed = today.split('-').join('');
  const seededIndex = parseInt(daySeed) % startupTips.length;
  return startupTips[seededIndex];
}
export function getRandomTip() {
  return startupTips[Math.floor(Math.random() * startupTips.length)];
}