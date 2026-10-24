import { apiRequest, ApiError, SESSION_EXPIRED_EVENT } from "./client";

const jsonResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: () => "application/json" },
  json: async () => body
});

beforeEach(() => {
  sessionStorage.clear();
  global.fetch = jest.fn();
});

test("sends the bearer token on authenticated requests", async () => {
  sessionStorage.setItem("token", "abc");
  global.fetch.mockResolvedValue(jsonResponse(200, { ok: true }));

  await apiRequest("/api/boards", { auth: true });

  expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe("Bearer abc");
});

test("a 401 on an authenticated call clears the session and signals expiry", async () => {
  sessionStorage.setItem("token", "stale");
  sessionStorage.setItem("user", "{}");
  global.fetch.mockResolvedValue(jsonResponse(401, { message: "Invalid or expired token" }));
  const onExpired = jest.fn();
  window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);

  await expect(apiRequest("/api/boards", { auth: true })).rejects.toMatchObject({
    name: "ApiError",
    status: 401,
    message: "Invalid or expired token"
  });

  expect(sessionStorage.getItem("token")).toBeNull();
  expect(sessionStorage.getItem("user")).toBeNull();
  expect(onExpired).toHaveBeenCalledTimes(1);
  window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
});

test("a failed login (401 without auth) does not trigger the global expiry handler", async () => {
  global.fetch.mockResolvedValue(jsonResponse(401, { message: "Invalid email or password" }));
  const onExpired = jest.fn();
  window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);

  await expect(apiRequest("/api/login", { method: "POST", body: {} })).rejects.toBeInstanceOf(ApiError);

  expect(onExpired).not.toHaveBeenCalled();
  window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
});

test("calling an authenticated endpoint without a token signals expiry before any request", async () => {
  const onExpired = jest.fn();
  window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);

  await expect(apiRequest("/api/boards", { auth: true })).rejects.toMatchObject({ status: 401 });

  expect(global.fetch).not.toHaveBeenCalled();
  expect(onExpired).toHaveBeenCalled();
  window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
});
