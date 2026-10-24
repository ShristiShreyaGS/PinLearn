const User = require("../models/User");
const AppError = require("../utils/AppError");
const { toPublicUser } = require("../services/tokenService");

const userNotFound = () => new AppError(404, "User not found", "USER_NOT_FOUND");

async function getProfile(req, res) {
  const user = await User.findById(req.userId);
  if (!user) throw userNotFound();
  res.json(user);
}

async function updateProfile(req, res) {
  const user = await User.findByIdAndUpdate(req.userId, req.valid.body, {
    returnDocument: "after",
    runValidators: true
  });
  if (!user) throw userNotFound();
  res.json(user);
}

async function updateInterests(req, res) {
  const user = await User.findByIdAndUpdate(req.userId, req.valid.body, {
    returnDocument: "after",
    runValidators: true
  });
  if (!user) throw userNotFound();
  res.json({ user: toPublicUser(user) });
}

module.exports = { getProfile, updateProfile, updateInterests };
