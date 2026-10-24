const config = require("../config/env");
const logger = require("../utils/logger");
const AppError = require("../utils/AppError");
const { fetchProvider } = require("./providerClient");

const TOPIC_ALIASES = {
  DSA: "data structures algorithms",
  AI: "artificial intelligence machine learning",
  DevOps: "devops docker kubernetes"
};

const asArray = (data) => (Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);

function normalizeQuizList(data) {
  return asArray(data).map((quiz) => ({
    id: String(quiz.id),
    title: quiz.title || "Untitled quiz",
    description: quiz.description || "",
    category: quiz.category || "General",
    difficulty: quiz.difficulty || "mixed",
    questionsCount: Number(quiz.questions_count || quiz.questionsCount || 0)
  }));
}

// Maps provider keys like "answer_a_correct" to { answer_a: true }.
function normalizeCorrectAnswers(raw = {}) {
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    const match = key.match(/^(answer_[a-zA-Z0-9]+)_correct$/);
    if (match) out[match[1]] = value === true || value === "true";
  }
  return out;
}

function normalizeQuestions(data) {
  return asArray(data).map((question) => ({
    id: String(question.id),
    question: question.question || question.text || "",
    description: question.description || "",
    answers: Object.entries(question.answers || {})
      .filter(([, value]) => value)
      .map(([key, value]) => ({ key, text: value })),
    correctAnswers: normalizeCorrectAnswers(question.correct_answers)
  }));
}

// Pure scoring: a question counts only when the selected set equals the correct set.
function scoreQuiz(questions, answers) {
  return questions.reduce((total, question) => {
    const expected = Object.entries(question.correctAnswers)
      .filter(([, isCorrect]) => isCorrect)
      .map(([key]) => key)
      .sort();
    const selected = answers[question.id];
    const actual = (Array.isArray(selected) ? [...selected] : [selected]).filter(Boolean).sort();
    const isCorrect = expected.length > 0 && expected.join("|") === actual.join("|");
    return isCorrect ? total + 1 : total;
  }, 0);
}

async function fetchQuizApi(path) {
  if (!config.QUIZ_API_KEY) {
    throw new AppError(503, "Quiz integration is not configured", "NOT_CONFIGURED");
  }

  const response = await fetchProvider(`${config.QUIZ_API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${config.QUIZ_API_KEY}`, Accept: "application/json" }
  });

  if (!response.ok) {
    logger.error({ status: response.status, path }, "QuizAPI request failed");
    throw new AppError(502, "Quiz provider request failed", "UPSTREAM_ERROR");
  }

  return response.json();
}

async function listQuizzes({ limit, topic, search }) {
  const providerTopic = [TOPIC_ALIASES[topic] || topic, search].filter(Boolean).join(" ");
  const topicQuery = providerTopic ? `&topic=${encodeURIComponent(providerTopic)}` : "";

  let quizzes = normalizeQuizList(await fetchQuizApi(`/quizzes?limit=${limit}${topicQuery}`));
  if (quizzes.length === 0 && providerTopic) {
    quizzes = normalizeQuizList(await fetchQuizApi(`/quizzes?limit=${limit}`));
  }
  return quizzes;
}

async function getQuestions(quizId, { includeAnswers }) {
  const data = await fetchQuizApi(
    `/questions?quiz_id=${encodeURIComponent(quizId)}&include_answers=${includeAnswers}`
  );
  return normalizeQuestions(data);
}

module.exports = { listQuizzes, getQuestions, scoreQuiz, normalizeQuestions };
