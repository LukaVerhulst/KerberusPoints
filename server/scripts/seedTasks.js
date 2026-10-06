import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../configs/db.js";
import Task from "../models/Tasks.js";
import { tasks } from "../data/tasks-2026-2027.js";
import { stableTaskId } from "../lib/rules.js";
import { transaction } from "../lib/transaction.js";
try {
  await connectDB();
  await transaction(async (session) => {
    for (const [order, task] of tasks.entries())
      await Task.replaceOne(
        { _id: stableTaskId(task.code) },
        { ...task, order, ownerSchachtId: null },
        { upsert: true, session },
      );
    await Task.deleteMany(
      {
        ownerSchachtId: null,
        _id: {
          $nin: tasks.map(
            (t) => new mongoose.Types.ObjectId(stableTaskId(t.code)),
          ),
        },
      },
      { session },
    );
  });
  console.log(
    `${tasks.length} opdrachten 2026-2027 bijgewerkt. Personen en geschiedenis behouden.`,
  );
} catch (e) {
  console.error("Seed failed:", e.name, e.code || "");
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
