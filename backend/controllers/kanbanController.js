const User = require("../models/User");
const AppError = require("../utils/AppError");

async function getKanban(req, res) {
  const user = await User.findById(req.userId).select("kanbanColumns");
  if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");
  res.json({ columns: user.kanbanColumns });
}

async function saveKanban(req, res) {
  const user = await User.findByIdAndUpdate(
    req.userId,
    { kanbanColumns: req.valid.body.columns },
    { returnDocument: "after" }
  ).select("kanbanColumns");
  if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");
  res.json({ columns: user.kanbanColumns });
}

module.exports = { getKanban, saveKanban };
