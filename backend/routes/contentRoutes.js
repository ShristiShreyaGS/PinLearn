const router = require("express").Router();
const validate = require("../middleware/validate");
const { providerLimiter } = require("../middleware/rateLimiters");
const schemas = require("../validators/content");
const content = require("../controllers/contentController");
const quiz = require("../controllers/quizController");

// Third-party proxies cost quota, so they sit behind auth plus a per-user limiter.
router.get("/youtube", providerLimiter, validate({ query: schemas.contentQuery }), content.youtube);
router.get("/github", providerLimiter, validate({ query: schemas.contentQuery }), content.github);

router.get("/quizzes", validate({ query: schemas.quizListQuery }), quiz.list);
router.get("/quizzes/:quizId/questions", validate({ params: schemas.quizIdParam }), quiz.questions);
router.post(
  "/quizzes/:quizId/complete",
  validate({ params: schemas.quizIdParam, body: schemas.completeQuiz }),
  quiz.complete
);

module.exports = router;
