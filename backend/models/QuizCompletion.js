const mongoose = require("mongoose");

const quizCompletionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    quizId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: "Daily Quiz"
    },
    topic: {
      type: String,
      default: ""
    },
    score: {
      type: Number,
      min: 0,
      default: 0
    },
    totalQuestions: {
      type: Number,
      min: 0,
      default: 0
    },
    activityDate: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

quizCompletionSchema.index({ userId: 1, activityDate: 1 }, { unique: true });

module.exports = mongoose.model("QuizCompletion", quizCompletionSchema);
