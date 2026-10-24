// Must be required before any app module so config/env.js validates test values.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-at-least-32-characters-long";
process.env.CORS_ORIGINS = "";
delete process.env.YOUTUBE_API_KEY;
delete process.env.GITHUB_TOKEN;
delete process.env.QUIZ_API_KEY;
