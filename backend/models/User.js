const mongoose = require("mongoose");

const MAX_INTERESTS = 30;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true, maxlength: 80 },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254
    },

    // Excluded from queries by default; login opts in with .select("+password").
    password: { type: String, required: true, select: false },

    bio: { type: String, default: "", trim: true, maxlength: 500 },

    selectedInterests: {
      type: [{ type: String, trim: true, maxlength: 40 }],
      default: [],
      validate: {
        validator: (items) => items.length <= MAX_INTERESTS,
        message: `At most ${MAX_INTERESTS} interests are allowed`
      }
    },

    // Shape is validated at the API boundary (validators/kanban.js).
    kanbanColumns: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
