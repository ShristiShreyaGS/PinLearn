const Board = require("../models/Boards");
const AppError = require("../utils/AppError");
const { findOwnedBoard } = require("../services/boardService");
const { recordActivity } = require("../services/streakService");

async function listBoards(req, res) {
  res.json(await Board.find({ userId: req.userId }).sort({ createdAt: 1 }));
}

async function createBoard(req, res) {
  const { name } = req.valid.body;
  const duplicateError = () => new AppError(409, "A board with this name already exists", "BOARD_EXISTS");

  // Collation makes this case-insensitive without a regex; the unique index closes the race.
  const existing = await Board.findOne({ userId: req.userId, name }).collation({ locale: "en", strength: 2 });
  if (existing) throw duplicateError();

  try {
    const board = await Board.create({ userId: req.userId, name, resources: [] });
    res.status(201).json(board);
  } catch (error) {
    if (error?.code === 11000) throw duplicateError();
    throw error;
  }
}

async function deleteBoard(req, res) {
  const board = await Board.findOneAndDelete({ _id: req.valid.params.boardId, userId: req.userId });
  if (!board) throw new AppError(404, "Board not found", "BOARD_NOT_FOUND");
  res.json({ message: "Board deleted" });
}

async function saveResource(req, res) {
  const { resource } = req.valid.body;
  const board = await findOwnedBoard(req.userId, req.valid.params.boardId);
  const resourceId = resource.id ?? (resource.url || resource.title);

  if (board.resources.some((saved) => String(saved.id) === resourceId)) {
    return res.status(200).json(board);
  }

  board.resources.push({
    id: resourceId,
    title: resource.title,
    description: resource.description,
    thumbnail: resource.thumbnail || resource.image,
    url: resource.url,
    type: resource.type,
    source: resource.source,
    channel: resource.channel
  });
  await board.save();
  await recordActivity(req.userId, "save");

  return res.status(201).json(board);
}

module.exports = { listBoards, createBoard, deleteBoard, saveResource };
