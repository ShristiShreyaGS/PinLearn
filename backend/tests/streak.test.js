require("./helpers/env");
const test = require("node:test");
const assert = require("node:assert/strict");
const { computeStreak, previousDate, nextDate, toActivityDate } = require("../services/streakService");

test("date helpers cross month and year boundaries", () => {
  assert.equal(previousDate("2026-03-01"), "2026-02-28");
  assert.equal(previousDate("2026-01-01"), "2025-12-31");
  assert.equal(nextDate("2024-02-28"), "2024-02-29");
});

test("toActivityDate respects the configured timezone", () => {
  const instant = new Date("2026-01-01T20:00:00Z");
  assert.equal(toActivityDate(instant, "Asia/Kolkata"), "2026-01-02");
  assert.equal(toActivityDate(instant, "UTC"), "2026-01-01");
});

test("empty history yields zero streak", () => {
  const result = computeStreak([], "2026-05-10");
  assert.deepEqual([result.current, result.longest, result.activeToday], [0, 0, false]);
});

test("streak counts consecutive days ending today", () => {
  const result = computeStreak(["2026-05-08", "2026-05-09", "2026-05-10"], "2026-05-10");
  assert.equal(result.current, 3);
  assert.equal(result.activeToday, true);
});

test("streak stays alive when today has no activity yet but yesterday does", () => {
  const result = computeStreak(["2026-05-08", "2026-05-09"], "2026-05-10");
  assert.equal(result.current, 2);
  assert.equal(result.activeToday, false);
});

test("a missed day resets the current streak but keeps the longest", () => {
  const result = computeStreak(["2026-05-01", "2026-05-02", "2026-05-03", "2026-05-09"], "2026-05-10");
  assert.equal(result.current, 1);
  assert.equal(result.longest, 3);
});

test("streak runs across a month boundary", () => {
  const result = computeStreak(["2026-04-30", "2026-05-01"], "2026-05-01");
  assert.equal(result.current, 2);
});

test("duplicate dates are counted once", () => {
  assert.equal(computeStreak(["2026-05-10", "2026-05-10"], "2026-05-10").current, 1);
});
