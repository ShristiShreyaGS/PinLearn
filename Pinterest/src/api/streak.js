import { apiRequest } from "./client";

export async function fetchStreak() {
  return apiRequest("/api/streak", { auth: true });
}

export async function markActivity(payload = {}) {
  return apiRequest("/api/activity", { auth: true, method: "POST", body: payload });
}