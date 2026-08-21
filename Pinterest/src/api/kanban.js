import { apiRequest } from "./client";

export function fetchKanban() {
  return apiRequest("/api/kanban", {
    auth: true
  });
}

export function saveKanban(columns) {
  return apiRequest("/api/kanban", {
    method: "PATCH",
    auth: true,
    body: { columns }
  });
}