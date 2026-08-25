import { apiRequest } from "./client";

export async function fetchQuizzes(limit = 10, topic = "", search = "") {
  const topicQuery = topic ? `&topic=${encodeURIComponent(topic)}` : "";
  const searchQuery = search ? `&search=${encodeURIComponent(search)}` : "";
  const data = await apiRequest(`/api/quizzes?limit=${limit}${topicQuery}${searchQuery}`, { auth: true });
  return Array.isArray(data?.quizzes) ? data.quizzes : [];
}

export async function fetchQuizQuestions(quizId) {
  const data = await apiRequest(`/api/quizzes/${encodeURIComponent(quizId)}/questions`, { auth: true });
  return Array.isArray(data?.questions) ? data.questions : [];
}

export async function completeQuiz(quizId, payload) {
  return apiRequest(`/api/quizzes/${encodeURIComponent(quizId)}/complete`, {
    method: "POST",
    body: payload,
    auth: true
  });
}
