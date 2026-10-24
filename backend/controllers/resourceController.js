const { findOwnedResource, findNote } = require("../services/boardService");
const { recordActivity } = require("../services/streakService");

async function updateStatus(req, res) {
  const { boardId, resourceId, status } = req.valid.body;
  const { board, resource } = await findOwnedResource(req.userId, boardId, resourceId);
  const firstCompletion = status === "completed" && !resource.completedAt;

  resource.status = status;
  if (status === "visited" && !resource.visitedAt) resource.visitedAt = new Date();
  if (firstCompletion) resource.completedAt = new Date();

  await board.save();
  if (firstCompletion) await recordActivity(req.userId, "complete");

  res.json({ message: "Status updated", resource });
}

async function addNote(req, res) {
  const { boardId, resourceId, content } = req.valid.body;
  const { board, resource } = await findOwnedResource(req.userId, boardId, resourceId);

  resource.notes.push({ content });
  await board.save();

  res.json({ message: "Note added", notes: resource.notes });
}

async function updateNote(req, res) {
  const { boardId, resourceId, noteIndex, content } = req.valid.body;
  const { board, resource } = await findOwnedResource(req.userId, boardId, resourceId);

  findNote(resource, noteIndex).content = content;
  await board.save();

  res.json({ message: "Note updated", notes: resource.notes });
}

async function deleteNote(req, res) {
  const { boardId, resourceId, noteIndex } = req.valid.body;
  const { board, resource } = await findOwnedResource(req.userId, boardId, resourceId);

  findNote(resource, noteIndex);
  resource.notes.splice(noteIndex, 1);
  await board.save();

  res.json({ message: "Note deleted" });
}

module.exports = { updateStatus, addNote, updateNote, deleteNote };
