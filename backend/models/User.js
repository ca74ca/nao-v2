const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  walletId:      { type: String, required: true, unique: true, lowercase: true },
  username:      String,
  xp:            { type: Number, default: 0 },
  rewardPoints:  { type: Number, default: 0 },
  evolutionLevel:{ type: Number, default: 1 },
  streak:        { type: Number, default: 0 },
  achievements:  [String],
  avatarUrl:     String,
  bio:           String,
  needsEvolve:   { type: Boolean, default: false }
}, { collection: "users" });          // same Mongo collection as before

module.exports = mongoose.model("User", UserSchema);
