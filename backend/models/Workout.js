const mongoose = require("mongoose");

const WorkoutSchema = new mongoose.Schema({
  // 🔑  Store the wallet address (or any user string) directly.
  //     No ObjectId casting = no CastError.
  userId:      { type: String, required: true },

  /* provenance */
  source:      { type: String, enum: ["manual", "whoop", "apple"], default: "manual" },
  workoutText: { type: String, required: true },
  parsedType:  { type: String },
  durationMin: { type: Number },
  intensity:   { type: String },
  calories:    { type: Number },

  /* rewards */
  xpGained:    { type: Number, default: 0 },

  timestamp:   { type: Date, default: Date.now }
});

// Optional: make lookups fast and unique
// WorkoutSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model("Workout", WorkoutSchema);