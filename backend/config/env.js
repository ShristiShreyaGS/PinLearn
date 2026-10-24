// Tests must be hermetic, so the developer's local .env is never read there.
if (process.env.NODE_ENV !== "test") require("dotenv").config({ quiet: true });
const { z } = require("zod");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().optional(),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGINS: z.string().default(""),
  APP_TIMEZONE: z.string().default("Asia/Kolkata"),
  LOG_LEVEL: z.string().default("info"),
  GITHUB_TOKEN: z.string().optional(),
  YOUTUBE_API_KEY: z.string().optional(),
  YOUTUBE_CACHE_TTL_MS: z.coerce.number().int().positive().default(6 * 60 * 60 * 1000),
  QUIZ_API_KEY: z.string().optional(),
  QUIZ_API_BASE_URL: z.string().default("https://quizapi.io/api/v1"),
  ALLOW_SELF_SIGNED: z.string().optional()
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  throw new Error(`Invalid environment configuration: ${issues.join("; ")}`);
}

const env = parsed.data;

const config = {
  ...env,
  isProd: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
  corsOrigins: env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean),
  // The TLS-verification bypass is never honoured in production.
  allowSelfSigned: env.ALLOW_SELF_SIGNED === "true" && env.NODE_ENV !== "production"
};

module.exports = config;
