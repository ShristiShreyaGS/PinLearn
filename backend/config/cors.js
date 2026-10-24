const cors = require("cors");
const config = require("./env");
const AppError = require("../utils/AppError");

// Fails closed in production: with no CORS_ORIGINS configured, cross-origin browsers are rejected.
function buildCors() {
  const allowed = config.corsOrigins;

  return cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowed.includes(origin)) return callback(null, true);
      if (!allowed.length && !config.isProd) return callback(null, true);
      return callback(new AppError(403, "Origin not allowed", "CORS_FORBIDDEN"));
    }
  });
}

module.exports = buildCors;
