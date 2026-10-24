const router = require("express").Router();
const validate = require("../middleware/validate");
const { authLimiter } = require("../middleware/rateLimiters");
const schemas = require("../validators/auth");
const { signup, login } = require("../controllers/authController");

router.post("/signup", authLimiter, validate({ body: schemas.signup }), signup);
router.post("/login", authLimiter, validate({ body: schemas.login }), login);

module.exports = router;
