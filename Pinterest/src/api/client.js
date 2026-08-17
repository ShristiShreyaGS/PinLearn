export const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

export function authHeaders() {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Please login first.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

export async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Request failed");
  }

  return data;
}

export async function apiRequest(path, { method = "GET", body, auth = false } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: auth
      ? authHeaders()
      : body
        ? { "Content-Type": "application/json" }
        : undefined,
    body: body ? JSON.stringify(body) : undefined
  });

  return parseResponse(response);
}
