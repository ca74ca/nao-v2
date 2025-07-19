import type { NextApiRequest, NextApiResponse } from 'next';
import { RewardEngine, RewardEvent } from '../../src/rewards/RewardEngine';
import { RewardState } from '../../src/types/RewardState';
import { findNaoUserByWhoopId, updateUser } from '../../lib/userMap';
import { getUserRewardState, saveRewardState } from '../../lib/rewardStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const event = req.body;
    console.log('📡 WHOOP Webhook Event Received:', event);

    const {
      user_id,
      strain_score,
      calories,
      completed_workout,
      vo2max,
      resting_heart_rate
    } = event;

    // 1. Lookup NAO user from WHOOP user_id
    const user = await findNaoUserByWhoopId(user_id);
    if (!user) {
      return res.status(404).json({ error: 'NAO user not found for this WHOOP user_id' });
    }

    const userKey = user.wallet;

    let state: RewardState = getUserRewardState(userKey);
    let rewardEvents: RewardEvent[] = [];
    if (typeof calories === 'number') rewardEvents.push({ type: "calories", value: calories, goal: RewardEngine.CALORIE_GOAL });
    if (typeof completed_workout === 'boolean') rewardEvents.push({ type: "workout", complete: completed_workout });
    if (typeof strain_score === 'number') rewardEvents.push({ type: "strain", value: strain_score });

    let result;
    for (const rewardEvent of rewardEvents) {
      result = RewardEngine.applyEvent(state, rewardEvent);
      state = result.state;
    }
    saveRewardState(userKey, state);

    // Save vo2max/resting_heart_rate to user profile, if present
    const profileUpdates: Record<string, any> = {};
    if (typeof vo2max === "number") profileUpdates.vo2max = vo2max;
    if (typeof resting_heart_rate === "number") profileUpdates.restingHeartRate = resting_heart_rate;
    if (Object.keys(profileUpdates).length) {
      await updateUser(user.wallet, profileUpdates);
    }

    res.status(200).json({ received: true, result, updated: profileUpdates });
  } catch (error) {
    console.error('❌ Webhook Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}