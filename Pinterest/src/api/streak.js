import { apiRequest } from "./client";

export async function fetchStreak() {
  return apiRequest("/api/streak", { auth: true });
}