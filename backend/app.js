const crypto = require("crypto");
const express = require("express");
const helmet = require("helmet");
const pinoHttp = require("pino-http");
const config = require("./config/env");
const logger = require("./utils/logger");
const buildCors = require("./config/cors");
const { isDbConnected } = require("./config/db");
const { globalLimiter } = require("./middleware/rateLimiters");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const routes = require("./routes");

function createApp() {
  const app = express();

  // Render terminates TLS at a proxy; without this every client shares one IP for rate limiting.
  if (config.isProd) app.set("trust proxy", 1);

  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const id = req.headers["x-request-id"] || crypto.randomUUID();
        res.setHeader("X-Request-Id", id);
        return id;
      }
    })
  );
  app.use(helmet());
  app.use(buildCors());

  // Registered before the rate limiter so platform probes are never throttled.
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.get("/api/ready", (req, res) => {
    const db = isDbConnected();
    res.status(db ? 200 : 503).json({ status: db ? "ok" : "unavailable", db: db ? "up" : "down" });
  });

  app.use(express.json({ limit: "100kb" }));
  app.use(globalLimiter);
  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
