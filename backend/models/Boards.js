const mongoose = require("mongoose");

const MAX_RESOURCES_PER_BOARD = 500;
const MAX_NOTES_PER_RESOURCE = 100;

const noteSchema = new mongoose.Schema({
  content: { type: String, required: true, trim: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now }
});

const resourceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, maxlength: 500 },
    title: { type: String, required: true, maxlength: 300 },
    description: { type: String, default: "", maxlength: 2000 },
    thumbnail: { type: String, default: "", maxlength: 2000 },
    url: { type: String, default: "", maxlength: 2000 },
    type: { type: String, default: "", maxlength: 40 },
    source: { type: String, default: "", maxlength: 40 },
    channel: { type: String, default: "", maxlength: 200 },

    status: {
      type: String,
      enum: ["saved", "visited", "in_progress", "completed"],
      default: "saved"
    },

    savedAt: { type: Date, default: Date.now },
    visitedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    lastTimestamp: { type: String, default: "" },

    notes: {
      type: [noteSchema],
      default: [],
      validate: {
        validator: (items) => items.length <= MAX_NOTES_PER_RESOURCE,
        message: `At most ${MAX_NOTES_PER_RESOURCE} notes per resource`
      }
    }
  },
  { _id: false }
);

const boardSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    name: { type: String, required: true, trim: true, maxlength: 80 },

    // Case-folded name backing the per-user uniqueness index.
    nameKey: { type: String, select: false },

    resources: {
      type: [resourceSchema],
      default: [],
      validate: {
        validator: (items) => items.length <= MAX_RESOURCES_PER_BOARD,
        message: `At most ${MAX_RESOURCES_PER_BOARD} resources per board`
      }
    }
  },
  { timestamps: true }
);

boardSchema.pre("validate", function setNameKey() {
  if (this.name) this.nameKey = this.name.trim().toLowerCase();
});

boardSchema.index({ userId: 1, createdAt: 1 });
// Partial so legacy boards without nameKey cannot collide with each other.
boardSchema.index(
  { userId: 1, nameKey: 1 },
  { unique: true, partialFilterExpression: { nameKey: { $type: "string" } } }
);

module.exports = mongoose.model("Board", boardSchema);
module.exports.MAX_RESOURCES_PER_BOARD = MAX_RESOURCES_PER_BOARD;
