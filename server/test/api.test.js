import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";
import { tasks } from "../data/tasks-2026-2027.js";
import { stableTaskId, evaluate, weekKey } from "../lib/rules.js";
import Schacht from "../models/Schacht.js";
import Task from "../models/Tasks.js";
import TaskCompletion from "../models/TaskCompletion.js";
import TaskContext from "../models/TaskContext.js";
import AppConfig from "../models/AppConfig.js";
import { resetYear } from "../scripts/resetYear.js";
let repl, app, agent, schacht;
const headers = { "X-Kerberus-Request": "1", Origin: "http://localhost:5173" };
const base = () => ({
  schachtId: String(schacht._id),
  evidenceConfirmed: true,
  lintConfirmed: true,
  formalitiesConfirmed: true,
  approvalConfirmed: true,
  requestKey: crypto.randomUUID(),
});
const complete = (code, input = {}) =>
  agent
    .post("/api/completions")
    .set(headers)
    .send({ ...base(), taskId: stableTaskId(code), ...input });
const score = async () => (await Schacht.findById(schacht._id)).points;
before(
  async () => {
    repl = await MongoMemoryReplSet.create({
      replSet: { count: 1 },
      binary: { version: "7.0.24" },
    });
    process.env.MONGODB_URI = repl.getUri();
    process.env.MONGODB_DB_NAME = "KerberusPoints";
    process.env.JWT_SECRET = "test-only-secret-never-for-production";
    process.env.ADMINS = JSON.stringify([
      { email: "temster@example.test", password: "test-only-password" },
    ]);
    process.env.NODE_ENV = "test";
    process.env.ALLOWED_ORIGINS = "http://localhost:5173";
    ({ default: app } = await import("../app.js"));
    const { default: connectDB } = await import("../configs/db.js");
    await connectDB();
    agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .set(headers)
      .send({ email: "temster@example.test", password: "test-only-password" })
      .expect(200);
  },
  { timeout: 180000 },
);
beforeEach(async () => {
  for (const model of [Schacht, Task, TaskCompletion, TaskContext, AppConfig])
    await model.deleteMany({});
  await Task.insertMany(
    tasks.map((t) => ({ ...t, _id: stableTaskId(t.code) })),
  );
  schacht = await Schacht.create({ name: "Testschacht" });
});
after(async () => {
  await mongoose.disconnect();
  if (repl) await repl.stop();
});
test("PDF catalogue contains all 39 tasks, known points and exemptions", () => {
  assert.equal(tasks.length, 39);
  assert.equal(new Set(tasks.map((t) => t.code)).size, 39);
  assert.equal(tasks.find((t) => t.code === "overnachten").requiresLint, false);
  assert.equal(
    tasks.find((t) => t.code === "cvs").pricing.variants[1].points,
    30,
  );
  assert.equal(
    tasks.find((t) => t.code === "muil-senior").pricing.variants[1].points,
    17,
  );
});
test("once task rejects repeat, including a concurrent race, without score drift", async () => {
  const responses = await Promise.all([complete("bakdag"), complete("bakdag")]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
  assert.equal(await score(), 30);
  assert.equal(await TaskCompletion.countDocuments(), 1);
});
test("weekly limit uses Monday–Sunday in Europe/Brussels, including DST and year boundaries", async () => {
  await complete("foto-week").expect(201);
  await complete("foto-week").expect(409);
  assert.equal(await score(), 20);
  assert.equal(weekKey(new Date("2026-10-04T21:59:00Z")), "2026-09-28");
  assert.equal(weekKey(new Date("2026-10-04T22:00:00Z")), "2026-10-05");
  assert.equal(weekKey(new Date("2027-01-01T12:00:00Z")), "2026-12-28");
  assert.equal(weekKey(new Date("2026-10-25T22:59:00Z")), "2026-10-19");
  assert.equal(weekKey(new Date("2026-10-25T23:00:00Z")), "2026-10-26");
  const t = tasks.find((t) => t.code === "foto-week");
  assert.notEqual(
    evaluate(t, base(), new Date("2026-10-04T10:00:00Z")).ruleKey,
    evaluate(t, base(), new Date("2026-10-05T10:00:00Z")).ruleKey,
  );
});
test("unlimited allows repeated independent completions and idempotent retries", async () => {
  const body = { requestKey: crypto.randomUUID() };
  await complete("woensdag", body).expect(201);
  await complete("woensdag", body).expect(200);
  await complete("woensdag").expect(201);
  assert.equal(await score(), 10);
  assert.equal(await TaskCompletion.countDocuments(), 2);
});
test("per-person limit is shared across win/loss variants and aliases reuse the same identity", async () => {
  const person = await agent
    .post("/api/contexts")
    .set(headers)
    .send({ kind: "person", group: "praesidium", name: "Émilie Janssens" })
    .expect(201);
  const alias = await agent
    .post("/api/contexts")
    .set(headers)
    .send({ kind: "person", group: "praesidium", name: " emilie   JANSSENS " })
    .expect(201);
  assert.equal(person.body._id, alias.body._id);
  await complete("sasch-praesidium", {
    subjectId: person.body._id,
    variant: "verlies",
  }).expect(201);
  await complete("sasch-praesidium", {
    subjectId: person.body._id,
    variant: "winst",
  }).expect(409);
  assert.equal(await score(), -5);
  await complete("sasch-praesidium", {
    subjectId: "123456789012345678901234",
    variant: "winst",
  }).expect(400);
});
test("senior/flosh and kiss variants preserve the per-person constraint", async () => {
  const c = await TaskContext.create({
    kind: "person",
    name: "Senior",
    normalizedName: "senior",
    groups: ["senior"],
  });
  await complete("muil-senior", {
    subjectId: String(c._id),
    variant: "kus",
  }).expect(201);
  await complete("muil-senior", {
    subjectId: String(c._id),
    variant: "muil",
  }).expect(409);
  assert.equal(await score(), 17);
});
test("event, cantus and CVS contexts enforce membership and per-event limit", async () => {
  const event = await TaskContext.create({
    kind: "event",
    name: "Openingscantus 2026",
    normalizedName: "openingscantus 2026",
    groups: ["cantus", "event"],
  });
  await complete("radje", { eventId: String(event._id) }).expect(201);
  await complete("radje", { eventId: String(event._id) }).expect(409);
  await complete("helpen-evenement", { eventId: String(event._id) }).expect(
    201,
  );
  await complete("cvs", {
    eventId: String(event._id),
    variant: "winst",
  }).expect(400);
  assert.equal(await score(), 35);
});
test("quantity multiplier rejects zero, fractional, string and extreme quantities", async () => {
  await complete("onderbroeken", { quantity: 7 }).expect(201);
  assert.equal(await score(), 14);
  for (const quantity of [0, -1, 1.5, "3", 1001])
    await complete("onderbroeken", { quantity }).expect(400);
  assert.equal(await score(), 14);
  await complete("bakdag", { quantity: 3 }).expect(400);
});
test("variable minimum points require approval, integer bounds and explanation", async () => {
  await complete("taakje-praesidium", {
    points: 9,
    note: "Temster keurde goed",
  }).expect(400);
  await complete("taakje-praesidium", { points: 15 }).expect(400);
  await complete("taakje-praesidium", {
    points: 15,
    note: "Goedgekeurd door de temster",
  }).expect(201);
  assert.equal(await score(), 15);
});
test("evidence, lint and formalities are required server-side, with no-lint exception", async () => {
  await complete("halve-liter", { formalitiesConfirmed: false }).expect(400);
  await complete("bakdag", { evidenceConfirmed: false }).expect(400);
  await complete("bakdag", { lintConfirmed: false }).expect(400);
  await complete("overnachten", { lintConfirmed: false }).expect(201);
  assert.equal(await score(), 60);
});
test("removal reverses the awarded snapshot even after task points change; concurrent undo is safe", async () => {
  const r = await complete("onderbroeken", { quantity: 4 }).expect(201);
  await Task.updateOne(
    { _id: stableTaskId("onderbroeken") },
    { $set: { points: 99 } },
  );
  const responses = await Promise.all([
    agent.delete(`/api/completions/${r.body.completion._id}`).set(headers),
    agent.delete(`/api/completions/${r.body.completion._id}`).set(headers),
  ]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 404]);
  assert.equal(await score(), 0);
});
test("negative completion undo restores the score", async () => {
  const c = await TaskContext.create({
    kind: "person",
    name: "Praesidium",
    normalizedName: "praesidium",
    groups: ["praesidium"],
  });
  const r = await complete("sasch-praesidium", {
    subjectId: String(c._id),
    variant: "verlies",
  }).expect(201);
  assert.equal(await score(), -5);
  await agent
    .delete(`/api/completions/${r.body.completion._id}`)
    .set(headers)
    .expect(200);
  assert.equal(await score(), 0);
});
test("custom task is owned, atomic, repeatable and its deletion reverses all completions", async () => {
  const payload = {
    ...base(),
    name: "Eigen taak",
    customPoints: -5,
    repeatType: "unlimited",
  };
  const r = await agent
    .post("/api/custom-tasks")
    .set(headers)
    .send(payload)
    .expect(201);
  await complete("woensdag").expect(201);
  await agent
    .post("/api/completions")
    .set(headers)
    .send({ ...base(), taskId: r.body.task._id })
    .expect(201);
  assert.equal(await score(), -5);
  const other = await Schacht.create({ name: "Andere schacht" });
  await agent
    .post("/api/completions")
    .set(headers)
    .send({ ...base(), schachtId: String(other._id), taskId: r.body.task._id })
    .expect(403);
  await agent
    .delete(`/api/custom-tasks/${r.body.task._id}`)
    .set(headers)
    .expect(200);
  assert.equal(await score(), 5);
  await agent
    .delete(`/api/custom-tasks/${stableTaskId("bakdag")}`)
    .set(headers)
    .expect(403);
  assert.ok(await Task.findById(stableTaskId("bakdag")));
});
test("deleting a schacht also deletes completions and owned tasks without touching others", async () => {
  const other = await Schacht.create({ name: "Andere schacht" });
  await complete("bakdag").expect(201);
  await agent
    .post("/api/custom-tasks")
    .set(headers)
    .send({
      ...base(),
      name: "Eigen taak",
      customPoints: 10,
      repeatType: "once",
    })
    .expect(201);
  await agent.delete(`/api/schachten/${schacht._id}`).set(headers).expect(200);
  assert.equal(
    await TaskCompletion.countDocuments({ schachtId: schacht._id }),
    0,
  );
  assert.equal(await Task.countDocuments({ ownerSchachtId: schacht._id }), 0);
  assert.ok(await Schacht.findById(other._id));
  assert.equal(await Task.countDocuments(), 39);
});
test("mutations require admin auth; CSRF and direct score overwrites are rejected", async () => {
  for (const [method, path] of [
    ["post", "/api/completions"],
    ["post", "/api/custom-tasks"],
    ["post", "/api/schachten"],
    ["patch", `/api/schachten/${schacht._id}`],
    ["delete", `/api/schachten/${schacht._id}`],
    ["delete", "/api/completions/123456789012345678901234"],
    ["delete", "/api/custom-tasks/123456789012345678901234"],
    ["post", "/api/contexts"],
  ])
    await request(app)[method](path).set(headers).send({}).expect(401);
  await agent.post("/api/schachten").send({ name: "Test" }).expect(403);
  await agent
    .post("/api/schachten")
    .set({ ...headers, Origin: "https://evil.example" })
    .send({ name: "Test" })
    .expect(403);
  await agent
    .patch(`/api/schachten/${schacht._id}`)
    .set(headers)
    .send({ points: 9999 })
    .expect(409);
  await complete("bakdag", { points: 99999 }).expect(400);
  assert.equal(await score(), 0);
});
test("malformed inputs and nonexistent schacht leave no orphan completion", async () => {
  await complete("bakdag", { schachtId: "invalid" }).expect(400);
  await complete("bakdag", { schachtId: "123456789012345678901234" }).expect(
    404,
  );
  await complete("bakdag", { requestKey: "bad" }).expect(400);
  assert.equal(await TaskCompletion.countDocuments(), 0);
});
test("reset is scoped, transactional, replaces 39 definitions and cannot erase next-year progress twice", async () => {
  await AppConfig.create({ _id: "keep-configuration", academicYear: "keep" });
  await complete("bakdag").expect(201);
  const plan = await resetYear();
  assert.equal(plan.dryRun, true);
  assert.equal(await Schacht.countDocuments(), 1);
  const r = await resetYear({ apply: true });
  assert.equal(r.tasks, 39);
  assert.equal(await Schacht.countDocuments(), 0);
  assert.equal(await TaskCompletion.countDocuments(), 0);
  assert.equal(await Task.countDocuments(), 39);
  assert.ok(await AppConfig.findById("keep-configuration"));
  await Schacht.create({ name: "Nieuw jaar" });
  assert.equal((await resetYear({ apply: true })).alreadyApplied, true);
  assert.equal(await Schacht.countDocuments(), 1);
});
