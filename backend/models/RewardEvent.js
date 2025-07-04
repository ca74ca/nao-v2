const mongoose = require("mongoose");

const RewardEventSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  eventType:  {
    type: String,
    enum: ["workout", "streakBonus", "evolution", "milestone", "manualAdjust"],
    required: true
  },

  details:        { type: String },
  xpDelta:        { type: Number, default: 0 },
  rewardPoints:   { type: Number, default: 0 },
  levelAfter:     { type: Number, default: 1 },
  streakAfter:    { type: Number, default: 0 },
  evolutionAfter: { type: Number },  // null if no evolution

  timestamp:      { type: Date, default: Date.now }
});

module.exports = mongoose.model("RewardEvent", RewardEventSchema);
