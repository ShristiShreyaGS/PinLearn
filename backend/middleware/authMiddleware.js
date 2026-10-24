const AppError = require("../utils/AppError");
const { verifyToken } = require("../services/tokenService");

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError(401, "Authentication required", "UNAUTHENTICATED"));
  }

  try {
    req.userId = verifyToken(header.slice(7)).userId;
    return next();
  } catch {
    return next(new AppError(401, "Invalid or expired token", "INVALID_TOKEN"));
  }
}

module.exports = authMiddleware;
