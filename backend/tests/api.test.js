require("./helpers/env");
const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const createApp = require("../app");
const { signToken } = require("../services/tokenService");

const app = createApp();
const validBoardId = "64b7f0f2a1b2c3d4e5f60718";
const bearer = () => ({ Authorization: `Bearer ${signToken(validBoardId)}` });

// These tests exercise routing, auth, validation and error shaping; all reject before any DB access.

test("GET /api/health is public and returns ok", async () => {
  const res = await request(app).get("/api/health");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: "ok" });
  assert.ok(res.headers["x-request-id"]);
});

test("GET /api/ready reports 503 when the database is not connected", async () => {
  const res = await request(app).get("/api/ready");
  assert.equal(res.status, 503);
  assert.equal(res.body.db, "down");
});

test("protected routes reject missing and invalid tokens with the standard error shape", async () => {
  const missing = await request(app).get("/api/boards");
  assert.equal(missing.status, 401);
  assert.equal(missing.body.code, "UNAUTHENTICATED");
  assert.ok(missing.body.requestId);

  const invalid = await request(app).get("/api/boards").set("Authorization", "Bearer nope");
  assert.equal(invalid.status, 401);
  assert.equal(invalid.body.code, "INVALID_TOKEN");
});

test("third-party proxy endpoints require authentication", async () => {
  for (const path of ["/api/youtube?topic=react", "/api/github?topic=react"]) {
    assert.equal((await request(app).get(path)).status, 401, path);
  }
});

test("removed debug and streak-farming routes no longer exist", async () => {
  assert.equal((await request(app).get("/api/protected").set(bearer())).status, 404);
  assert.equal((await request(app).post("/api/activity").set(bearer()).send({})).status, 404);
});

test("signup validates input and never leaks internals", async () => {
  const weak = await request(app).post("/api/signup").send({ email: "a@b.com", password: "short" });
  assert.equal(weak.status, 400);
  assert.equal(weak.body.code, "VALIDATION_ERROR");

  const injection = await request(app).post("/api/signup").send({ email: { $gt: "" }, password: "longenough1" });
  assert.equal(injection.status, 400);
});

test("login rejects malformed payloads before touching the database", async () => {
  const res = await request(app).post("/api/login").send({ email: { $ne: null }, password: "x" });
  assert.equal(res.status, 400);
});

test("malformed JSON returns a 400 in the standard shape", async () => {
  const res = await request(app).post("/api/login").set("Content-Type", "application/json").send("{bad");
  assert.equal(res.status, 400);
  assert.equal(res.body.code, "BAD_JSON");
});

test("unknown routes return a standard 404", async () => {
  const res = await request(app).get("/api/nope").set(bearer());
  assert.equal(res.status, 404);
  assert.equal(res.body.code, "NOT_FOUND");
});

test("board id and resource payloads are validated", async () => {
  const badId = await request(app).delete("/api/boards/not-an-id").set(bearer());
  assert.equal(badId.status, 400);

  const unsafeUrl = await request(app)
    .post(`/api/boards/${validBoardId}/resources`)
    .set(bearer())
    .send({ resource: { title: "x", url: "javascript:alert(1)" } });
  assert.equal(unsafeUrl.status, 400);
  assert.match(unsafeUrl.body.message, /http\(s\)/);
});

test("note and status endpoints validate their bodies", async () => {
  const note = await request(app)
    .post("/api/resources/note")
    .set(bearer())
    .send({ boardId: validBoardId, resourceId: "r1", content: "   " });
  assert.equal(note.status, 400);

  const status = await request(app)
    .patch("/api/progress/status")
    .set(bearer())
    .send({ boardId: validBoardId, resourceId: "r1", status: "hacked" });
  assert.equal(status.status, 400);
});

test("content search requires a topic", async () => {
  const res = await request(app).get("/api/youtube").set(bearer());
  assert.equal(res.status, 400);
  assert.equal(res.body.details[0].field, "query.topic");
});

test("unconfigured integrations fail cleanly with 503", async () => {
  const res = await request(app).get("/api/github?topic=react").set(bearer());
  assert.equal(res.status, 503);
  assert.equal(res.body.code, "NOT_CONFIGURED");
});
