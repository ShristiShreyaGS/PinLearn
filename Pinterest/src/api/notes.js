import { apiRequest } from "./client";

export async function addNote(
  boardId,
  resourceId,
  content
) {
  return apiRequest("/api/resources/note", {
    method: "POST",
    auth: true,
    body: {
      boardId,
      resourceId,
      content
    }
  });
}

export async function deleteNote(
  boardId,
  resourceId,
  noteIndex
) {
  return apiRequest("/api/resources/note", {
    method: "DELETE",
    auth: true,
    body: {
      boardId,
      resourceId,
      noteIndex
    }
  });
}