const mongoose = require("mongoose");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

function notFound(req, res, next) {
  next(new AppError(404, `Route not found: ${req.method} ${req.path}`, "NOT_FOUND"));
}

function normalizeError(err) {
  if (err instanceof AppError) return err;
  if (err?.type === "entity.parse.failed") return new AppError(400, "Malformed JSON body", "BAD_JSON");
  if (err?.type === "entity.too.large") return new AppError(413, "Request body too large", "PAYLOAD_TOO_LARGE");
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return new AppError(400, details[0]?.message || "Validation failed", "VALIDATION_ERROR", details);
  }
  if (err instanceof mongoose.Error.CastError) return new AppError(400, "Invalid identifier", "BAD_ID");
  if (err?.code === 11000) return new AppError(409, "Resource already exists", "DUPLICATE");
  return null;
}

// Single place that turns any thrown error into the standard { message, code, requestId } body.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const known = normalizeError(err);
  const status = known?.status || 500;
  const log = req.log || logger;

  if (status >= 500) log.error({ err }, "Unhandled error");
  else log.warn({ code: known.code, status }, known.message);

  res.status(status).json({
    message: known ? known.message : "Internal server error",
    code: known ? known.code : "INTERNAL_ERROR",
    ...(known?.details && { details: known.details }),
    requestId: req.id
  });
}

module.exports = { notFound, errorHandler };
