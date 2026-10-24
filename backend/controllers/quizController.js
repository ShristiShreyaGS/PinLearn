const QuizCompletion = require("../models/QuizCompletion");
const { listQuizzes, getQuestions, scoreQuiz } = require("../services/quizService");
const { getStreak, toActivityDate } = require("../services/streakService");

async function list(req, res) {
  const { limit, topic, search } = req.valid.query;
  res.json({ topic, quizzes: await listQuizzes({ limit, topic, search }) });
}

async function questions(req, res) {
  const items = await getQuestions(req.valid.params.quizId, { includeAnswers: false });
  res.json({ questions: items });
}

// Scoring happens server-side against provider answers; the client never asserts a result.
async function complete(req, res) {
  const { quizId } = req.valid.params;
  const { answers, title, topic } = req.valid.body;

  const items = await getQuestions(quizId, { includeAnswers: true });
  const score = scoreQuiz(items, answers);
  const base = { score, totalQuestions: items.length };

  const date = toActivityDate();
  const alreadyDone = await QuizCompletion.exists({ userId: req.userId, activityDate: date });
  if (alreadyDone) {
    return res.json({ completed: false, ...base, streak: await getStreak(req.userId) });
  }

  try {
    await QuizCompletion.create({ userId: req.userId, quizId, title, topic, ...base, activityDate: date });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    return res.json({ completed: false, ...base, streak: await getStreak(req.userId) });
  }

  return res.status(201).json({ completed: true, ...base, streak: await getStreak(req.userId) });
}

module.exports = { list, questions, complete };
