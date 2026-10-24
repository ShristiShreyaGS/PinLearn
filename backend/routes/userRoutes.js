const router = require("express").Router();
const validate = require("../middleware/validate");
const auth = require("../validators/auth");
const kanban = require("../validators/kanban");
const profile = require("../controllers/profileController");
const kanbanController = require("../controllers/kanbanController");
const streak = require("../controllers/streakController");

router.get("/profile", profile.getProfile);
router.patch("/profile", validate({ body: auth.updateProfile }), profile.updateProfile);
router.patch("/interests", validate({ body: auth.updateInterests }), profile.updateInterests);

router.get("/kanban", kanbanController.getKanban);
router.patch("/kanban", validate({ body: kanban.saveKanban }), kanbanController.saveKanban);

router.get("/streak", streak.current);

module.exports = router;
