const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },

  walletId: {
    type: String,
    unique: true,
    sparse: true, // allows null values without triggering uniqueness constraint
    index: true
  },

  email: { type: String, required: true, unique: true, index: true },

  passwordHash: { type: String }, // Encrypted password
  authProvider: {
    type: String,
    enum: ["local", "google", "apple", "wallet"],
    default: "local"
  },

  // 🕹️ Gamification
  xp: { type: Number, default: 0 },
  rewardPoints: { type: Number, default: 0 },
  evolutionLevel: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  lastWorkout: { type: Date, default: null },

  // 👤 Profile
  avatarUrl: {
    type: String,
    default: "https://cdn.nao.fit/default-avatar.png"
  },
  bio: { type: String, maxlength: 500 },

  // ⚙️ Preferences & future features
  preferences: {
    darkMode: { type: Boolean, default: false }
  },

  achievements: {
    type: [String],
    default: []
  }

}, { timestamps: true });

// No need to repeat indexes if already on fields above

const User = mongoose.models.User || mongoose.model("User", userSchema);
module.exports = User;