const mongoose = require("mongoose");
const config = require("./config/env");
const logger = require("./utils/logger");
const { connectDb } = require("./config/db");
const createApp = require("./app");

async function main() {
  if (config.JWT_SECRET.length < 32) {
    logger.warn("JWT_SECRET is shorter than 32 characters; use a longer random value");
  }

  await connectDb();

  const server = createApp().listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, "Server listening");
  });

  const shutdown = (signal) => {
    logger.info({ signal }, "Shutting down");
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "Unhandled promise rejection");
  process.exit(1);
});

main().catch((error) => {
  logger.fatal({ err: error }, "Failed to start server");
  process.exit(1);
});
