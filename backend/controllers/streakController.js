const { getStreak } = require("../services/streakService");

async function current(req, res) {
  res.json(await getStreak(req.userId));
}

module.exports = { current };
