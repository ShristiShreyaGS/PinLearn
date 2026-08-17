import { apiRequest } from "./client";

export function signup({ name, email, password, selectedInterests }) {
  return apiRequest("/api/signup", {
    method: "POST",
    body: { name, email, password, selectedInterests }
  });
}
export function login({ email, password }) {
  return apiRequest("/api/login", {
    method: "POST",
    body: { email, password }
  });
}
export function getProfile() {
  return apiRequest("/api/profile", {
    auth: true
  });
}
export function updateProfile(profile) {
  return apiRequest("/api/profile", {
    method: "PATCH",
    auth: true,
    body: profile
  });
}
export function updateInterests(selectedInterests) {
  return apiRequest("/api/interests", {
    method: "PATCH",
    auth: true,
    body: { selectedInterests }
  });
}

export function storeSession(data) {
  localStorage.setItem("token", data.token);

  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
