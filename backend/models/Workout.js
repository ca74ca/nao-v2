const mongoose = require("mongoose");

const WorkoutSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  /* provenance */
  source:      { type: String, enum: ["manual", "whoop", "apple"], default: "manual" },
  workoutText: { type: String, required: true },        // raw text or payload
  parsedType:  { type: String },                        // e.g. "strength", "cardio"
  durationMin: { type: Number },                        // derived from text/device
  intensity:   { type: String },                        // “low / medium / high”
  calories:    { type: Number },

  /* rewards */
  xpGained:    { type: Number, default: 0 },

  timestamp:   { type: Date, default: Date.now }
});

module.exports = mongoose.model("Workout", WorkoutSchema);
