const mongoose = require("mongoose");

const RewardEventSchema = new mongoose.Schema({
  // Store the wallet address directly as a string for web3 compatibility
  userId:     { type: String, required: true },

  eventType:  {
    type: String,
    enum: ["workout", "streakBonus", "evolution", "milestone", "manualAdjust"],
    required: true
  },

  // If you want to store structured data, use Mixed; otherwise, leave as String
  details:        { type: mongoose.Schema.Types.Mixed },

  xpDelta:        { type: Number, default: 0 },
  rewardPoints:   { type: Number, default: 0 },
  levelAfter:     { type: Number, default: 1 },
  streakAfter:    { type: Number, default: 0 },
  evolutionAfter: { type: Number },  // null if no evolution

  timestamp:      { type: Date, default: Date.now }
});

module.exports = mongoose.model("RewardEvent", RewardEventSchema);