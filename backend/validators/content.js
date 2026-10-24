const { z } = require("zod");

const text = (max) => z.string().trim().max(max).default("");

const contentQuery = z.object({
  topic: z.string().trim().min(1, "topic is required").max(100),
  search: text(100),
  pageToken: text(200),
  page: z.coerce.number().int().min(1).max(100).default(1)
});

const quizListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  topic: text(100),
  search: text(100)
});

const quizIdParam = z.object({ quizId: z.string().trim().min(1).max(100) });

const completeQuiz = z.object({
  title: z.string().trim().max(200).default("Daily Quiz"),
  topic: text(100),
  answers: z
    .record(z.string().max(100), z.union([z.string().max(100), z.array(z.string().max(100)).max(10)]))
    .default({})
});

module.exports = { contentQuery, quizListQuery, quizIdParam, completeQuiz };
