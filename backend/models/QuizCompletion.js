const mongoose = require("mongoose");

const quizCompletionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    quizId: { type: String, required: true, maxlength: 100 },
    title: { type: String, default: "Daily Quiz", maxlength: 200 },
    topic: { type: String, default: "", maxlength: 100 },
    score: { type: Number, min: 0, default: 0 },
    totalQuestions: { type: Number, min: 0, default: 0 },
    activityDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }
  },
  { timestamps: true }
);

quizCompletionSchema.index({ userId: 1, activityDate: 1 }, { unique: true });

module.exports = mongoose.model("QuizCompletion", quizCompletionSchema);
