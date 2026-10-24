const pino = require("pino");
const config = require("../config/env");

const logger = pino({
  level: config.isTest ? "silent" : config.LOG_LEVEL,
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.token"],
    censor: "[redacted]"
  },
  ...(config.NODE_ENV === "development" && {
    transport: { target: "pino-pretty", options: { colorize: true } }
  })
});

module.exports = logger;
