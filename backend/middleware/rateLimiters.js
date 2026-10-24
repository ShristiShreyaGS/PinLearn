const rateLimit = require("express-rate-limit");

const handler = (message) => (req, res) =>
  res.status(429).json({ message, code: "RATE_LIMITED", requestId: req.id });

const base = { standardHeaders: true, legacyHeaders: false };

const globalLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 300,
  handler: handler("Too many requests. Please slow down.")
});

const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  handler: handler("Too many attempts. Please try again later.")
});

// Runs after authMiddleware, so quota is per user rather than per shared IP.
const providerLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 30,
  keyGenerator: (req) => req.userId,
  handler: handler("Too many search requests. Please slow down.")
});

module.exports = { globalLimiter, authLimiter, providerLimiter };
