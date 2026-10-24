const Board = require("../models/Boards");
const AppError = require("../utils/AppError");

async function findOwnedBoard(userId, boardId) {
  const board = await Board.findOne({ _id: boardId, userId });
  if (!board) throw new AppError(404, "Board not found", "BOARD_NOT_FOUND");
  return board;
}

async function findOwnedResource(userId, boardId, resourceId) {
  const board = await findOwnedBoard(userId, boardId);
  const resource = board.resources.find((item) => String(item.id) === String(resourceId));
  if (!resource) throw new AppError(404, "Resource not found", "RESOURCE_NOT_FOUND");
  return { board, resource };
}

function findNote(resource, noteIndex) {
  const note = resource.notes[noteIndex];
  if (!note) throw new AppError(404, "Note not found", "NOTE_NOT_FOUND");
  return note;
}

module.exports = { findOwnedBoard, findOwnedResource, findNote };
