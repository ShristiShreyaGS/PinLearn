const mongoose = require("mongoose");

// One row per user per day on which a server-verified action happened; drives the streak.
const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    type: { type: String, enum: ["save", "complete"], required: true }
  },
  { timestamps: true }
);

activitySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Activity", activitySchema);
