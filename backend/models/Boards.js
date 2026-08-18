const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    id: String,
    title: String,
    description: String,
    thumbnail: String,
    url: String,
    type: String,
    source: String,
    channel: String,

    status: {
      type: String,
      enum: ["saved", "visited", "in_progress", "completed"],
      default: "saved"
    },

    savedAt: {
      type: Date,
      default: Date.now
    },

    visitedAt: {
      type: Date,
      default: null
    },

    completedAt: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const boardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    name: {
      type: String,
      required: true
    },

    resources: {
      type: [resourceSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Board", boardSchema);