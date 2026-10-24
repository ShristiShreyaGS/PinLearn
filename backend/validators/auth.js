const { z } = require("zod");

const interests = z
  .array(z.string().trim().min(1).max(40))
  .max(30, "At most 30 interests are allowed");

const signup = z.object({
  name: z.string().trim().max(80).default(""),
  email: z
    .string("A valid email address is required")
    .trim()
    .toLowerCase()
    .max(254)
    .pipe(z.email("A valid email address is required")),
  // bcrypt only uses the first 72 bytes, so longer inputs add cost without security.
  password: z
    .string("Password is required")
    .min(8, "Password must be at least 8 characters long")
    .max(72, "Password must be at most 72 characters long"),
  selectedInterests: interests.default([])
});

// Login deliberately gives no hints about which field was wrong.
const login = z.object({
  email: z.string().trim().toLowerCase().max(254),
  password: z.string().max(72)
});

const updateProfile = z.object({
  name: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(500).optional(),
  selectedInterests: interests.optional()
});

const updateInterests = z.object({ selectedInterests: interests });

module.exports = { signup, login, updateProfile, updateInterests };
