require("./helpers/env");
const test = require("node:test");
const assert = require("node:assert/strict");
const { sanitizeHttpUrl } = require("../utils/url");
const { scoreQuiz } = require("../services/quizService");
const { isStudyVideo } = require("../services/youtubeService");
const auth = require("../validators/auth");
const boards = require("../validators/boards");

test("sanitizeHttpUrl accepts http(s) and rejects script-capable schemes", () => {
  assert.equal(sanitizeHttpUrl("https://example.com/a b"), "https://example.com/a%20b");
  assert.equal(sanitizeHttpUrl("javascript:alert(1)"), "");
  assert.equal(sanitizeHttpUrl("data:text/html,<script>"), "");
  assert.equal(sanitizeHttpUrl("not a url"), "");
  assert.equal(sanitizeHttpUrl(42), "");
});

test("scoreQuiz requires the exact set of correct answers", () => {
  const questions = [
    { id: "1", correctAnswers: { answer_a: true, answer_b: false } },
    { id: "2", correctAnswers: { answer_a: true, answer_b: true } },
    { id: "3", correctAnswers: {} }
  ];
  const answers = { 1: "answer_a", 2: ["answer_b", "answer_a"], 3: "answer_a" };
  assert.equal(scoreQuiz(questions, answers), 2);
  assert.equal(scoreQuiz(questions, { 1: "answer_b", 2: ["answer_a"] }), 0);
});

test("isStudyVideo uses whole-word matching", () => {
  const video = (title) => ({ snippet: { title, description: "" } });
  assert.equal(isStudyVideo(video("React tutorial for beginners")), true);
  assert.equal(isStudyVideo(video("Keyboard shortcuts tutorial")), true);
  assert.equal(isStudyVideo(video("Funny coding meme compilation")), false);
});

test("signup schema normalises email and enforces password bounds", () => {
  const ok = auth.signup.safeParse({ email: "  A@B.COM ", password: "longenough1" });
  assert.equal(ok.success, true);
  assert.equal(ok.data.email, "a@b.com");
  assert.equal(auth.signup.safeParse({ email: "a@b.com", password: "short" }).success, false);
  assert.equal(auth.signup.safeParse({ email: "a@b.com", password: "x".repeat(73) }).success, false);
  assert.equal(auth.signup.safeParse({ email: { $ne: "" }, password: "longenough1" }).success, false);
});

test("resource schema rejects unsafe URLs and coerces numeric ids", () => {
  const base = { title: "Repo" };
  assert.equal(boards.saveResource.safeParse({ resource: { ...base, url: "javascript:alert(1)" } }).success, false);
  const ok = boards.saveResource.safeParse({ resource: { ...base, id: 123, url: "https://github.com/a/b" } });
  assert.equal(ok.success, true);
  assert.equal(ok.data.resource.id, "123");
});
