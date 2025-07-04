const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  walletId: String,
  email: String,
  xp: { type: Number, default: 0 },
  rewardPoints: { type: Number, default: 0 },
  evolutionLevel: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  lastWorkout: { type: Date, default: null },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);
module.exports = User;