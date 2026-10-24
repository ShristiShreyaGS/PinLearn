export const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

export const SESSION_EXPIRED_EVENT = "auth:session-expired";

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function authHeaders() {
  const token = sessionStorage.getItem("token");

  if (!token) {
    throw new ApiError("Please login first.", 401, "UNAUTHENTICATED");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

// A 401 on an authenticated call means the token is gone or expired: drop it and let the app redirect.
function handleExpiredSession() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

export async function parseResponse(response, { auth = false } = {}) {
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    if (response.status === 401 && auth) handleExpiredSession();
    throw new ApiError(
      data?.message || data?.error || "Request failed",
      response.status,
      data?.code
    );
  }

  return data;
}

export async function apiRequest(path, { method = "GET", body, auth = false } = {}) {
  let headers;
  try {
    headers = auth
      ? authHeaders()
      : body
        ? { "Content-Type": "application/json" }
        : undefined;
  } catch (error) {
    handleExpiredSession();
    throw error;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  return parseResponse(response, { auth });
}
