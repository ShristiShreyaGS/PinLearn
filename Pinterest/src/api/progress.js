import { apiRequest } from "./client";

export const updateResourceStatus = async (
  boardId,
  resourceId,
  status
) => {
  return apiRequest("/api/progress/status", {
    method: "PATCH",
    auth: true,
    body: {
      boardId,
      resourceId,
      status
    }
  });
};

export const markVisited = (boardId, resourceId) =>
  updateResourceStatus(
    boardId,
    resourceId,
    "visited"
  );

export const markInProgress = (boardId, resourceId) =>
  updateResourceStatus(
    boardId,
    resourceId,
    "in_progress"
  );

export const markCompleted = (boardId, resourceId) =>
  updateResourceStatus(
    boardId,
    resourceId,
    "completed"
  );