const Activity = require("../models/Activity");
const QuizCompletion = require("../models/QuizCompletion");
const config = require("../config/env");

function toActivityDate(date = new Date(), timeZone = config.APP_TIMEZONE) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}

function shiftDate(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

const previousDate = (date) => shiftDate(date, -1);
const nextDate = (date) => shiftDate(date, 1);

// Pure function: no I/O, so streak rules are unit-testable.
function computeStreak(activeDates, today) {
  const dates = new Set(activeDates);

  let current = 0;
  let cursor = dates.has(today) ? today : previousDate(today);
  while (dates.has(cursor)) {
    current += 1;
    cursor = previousDate(cursor);
  }

  let longest = 0;
  for (const date of dates) {
    // Only start counting at the first day of a run.
    if (dates.has(previousDate(date))) continue;
    let length = 1;
    let next = nextDate(date);
    while (dates.has(next)) {
      length += 1;
      next = nextDate(next);
    }
    longest = Math.max(longest, length);
  }

  const calendar = {};
  for (const date of dates) calendar[date] = 1;

  return { current, longest, activeToday: dates.has(today), today, calendar };
}

async function getStreak(userId) {
  const [activityDates, quizDates] = await Promise.all([
    Activity.distinct("date", { userId }),
    QuizCompletion.distinct("activityDate", { userId })
  ]);

  return computeStreak([...activityDates, ...quizDates], toActivityDate());
}

// Called only from server-verified actions; there is no public endpoint for it.
async function recordActivity(userId, type) {
  try {
    await Activity.create({ userId, date: toActivityDate(), type });
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }
}

module.exports = {
  toActivityDate,
  previousDate,
  nextDate,
  computeStreak,
  getStreak,
  recordActivity
};
