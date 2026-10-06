// Isolated, disposable database for browser verification; never connects to Atlas.
import { MongoMemoryReplSet } from "mongodb-memory-server-core";
import mongoose from "mongoose";
import Task from "../models/Tasks.js";
import { tasks } from "../data/tasks-2026-2027.js";
import { stableTaskId } from "../lib/rules.js";
const repl = await MongoMemoryReplSet.create({
  replSet: { count: 1 },
  binary: { version: "7.0.24" },
});
process.env.MONGODB_URI = repl.getUri();
process.env.MONGODB_DB_NAME = "KerberusPoints";
process.env.JWT_SECRET = "local-browser-test-only-secret";
process.env.ADMINS = JSON.stringify([
  { email: "temster@example.test", password: "local-test-only" },
]);
process.env.NODE_ENV = "test";
process.env.ALLOWED_ORIGINS = "http://localhost:5173";
const { default: app } = await import("../app.js");
const { default: connectDB } = await import("../configs/db.js");
await connectDB();
await Task.insertMany(
  tasks.map((t, order) => ({ ...t, order, _id: stableTaskId(t.code) })),
);
const server = app.listen(4000, () =>
  console.log("Isolated browser test API on http://localhost:4000"),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    server.close();
    await mongoose.disconnect();
    await repl.stop();
    process.exit(0);
  });
