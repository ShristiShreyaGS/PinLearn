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
    channel: String
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