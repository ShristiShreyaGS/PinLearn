const router = require("express").Router();
const validate = require("../middleware/validate");
const schemas = require("../validators/boards");
const boards = require("../controllers/boardController");
const resources = require("../controllers/resourceController");

router.get("/boards", boards.listBoards);
router.post("/boards", validate({ body: schemas.createBoard }), boards.createBoard);
router.delete("/boards/:boardId", validate({ params: schemas.boardIdParam }), boards.deleteBoard);
router.post(
  "/boards/:boardId/resources",
  validate({ params: schemas.boardIdParam, body: schemas.saveResource }),
  boards.saveResource
);

router.patch("/progress/status", validate({ body: schemas.updateStatus }), resources.updateStatus);

router.post("/resources/note", validate({ body: schemas.addNote }), resources.addNote);
router.patch("/resources/note", validate({ body: schemas.updateNote }), resources.updateNote);
router.delete("/resources/note", validate({ body: schemas.deleteNote }), resources.deleteNote);

module.exports = router;
