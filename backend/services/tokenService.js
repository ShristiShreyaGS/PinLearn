const jwt = require("jsonwebtoken");
const config = require("../config/env");

const ALGORITHM = "HS256";

function signToken(userId) {
  return jwt.sign({ userId: String(userId) }, config.JWT_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: config.JWT_EXPIRES_IN
  });
}

function verifyToken(token) {
  return jwt.verify(token, config.JWT_SECRET, { algorithms: [ALGORITHM] });
}

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    selectedInterests: user.selectedInterests
  };
}

function buildAuthResponse(user, message) {
  return { message, token: signToken(user._id), user: toPublicUser(user) };
}

module.exports = { signToken, verifyToken, toPublicUser, buildAuthResponse };
