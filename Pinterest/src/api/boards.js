import { apiRequest } from "./client";

export function fetchBoards() {
  return apiRequest("/api/boards", { auth: true });
}

export function createBoardRequest(name) {
  return apiRequest("/api/boards", {
    method: "POST",
    auth: true,
    body: { name }
  });
}

export function saveResourceRequest(boardId, resource) {
  return apiRequest(`/api/boards/${boardId}/resources`, {
    method: "POST",
    auth: true,
    body: { resource }
  });
}

export function deleteBoardRequest(boardId) {
  return apiRequest(`/api/boards/${boardId}`, {
    method: "DELETE",
    auth: true
  });
}
