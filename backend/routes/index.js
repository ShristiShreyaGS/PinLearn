const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");

router.use(require("./authRoutes"));

// Everything below requires a valid token.
router.use(authMiddleware);
router.use(require("./userRoutes"));
router.use(require("./boardRoutes"));
router.use(require("./contentRoutes"));

module.exports = router;
