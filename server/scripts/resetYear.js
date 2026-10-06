import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../configs/db.js";
import Schacht from "../models/Schacht.js";
import Task from "../models/Tasks.js";
import TaskCompletion from "../models/TaskCompletion.js";
import AppConfig from "../models/AppConfig.js";
import { tasks, academicYear } from "../data/tasks-2026-2027.js";
import { stableTaskId } from "../lib/rules.js";
import { transaction } from "../lib/transaction.js";
export async function resetYear({ apply = false } = {}) {
  const marker = await AppConfig.findById(`year-reset:${academicYear}`).lean();
  if (marker)
    return { alreadyApplied: true, academicYear, resetAt: marker.resetAt };
  const counts = {
    schachten: await Schacht.countDocuments(),
    taskcompletions: await TaskCompletion.countDocuments(),
    customTasks: await Task.countDocuments({ ownerSchachtId: { $ne: null } }),
    globalTasks: await Task.countDocuments({ ownerSchachtId: null }),
  };
  if (!apply)
    return {
      dryRun: true,
      database: mongoose.connection.name,
      collections: [
        "schachten",
        "taskcompletions",
        "tasks",
        "appconfigs (one reset marker)",
      ],
      counts,
      replacementTasks: tasks.length,
      academicYear,
    };
  if (mongoose.connection.name !== "KerberusPoints")
    throw new Error("Reset refused: expected database KerberusPoints.");
  return transaction(async (session) => {
    if (await AppConfig.findById(`year-reset:${academicYear}`).session(session))
      return { alreadyApplied: true };
    // Explicit collection operations. Never drop the database or application/admin configuration.
    await Schacht.deleteMany({}, { session });
    await TaskCompletion.deleteMany({}, { session });
    await Task.deleteMany({ ownerSchachtId: { $ne: null } }, { session });
    await Task.deleteMany({ ownerSchachtId: null }, { session });
    await Task.insertMany(
      tasks.map((t, order) => ({
        ...t,
        order,
        _id: stableTaskId(t.code),
        ownerSchachtId: null,
      })),
      { session, ordered: true },
    );
    await AppConfig.create(
      [
        {
          _id: `year-reset:${academicYear}`,
          academicYear,
          resetAt: new Date(),
        },
      ],
      { session },
    );
    return { applied: true, counts, academicYear, tasks: tasks.length };
  });
}
if (process.argv[1]?.replaceAll("\\", "/").endsWith("/scripts/resetYear.js")) {
  try {
    await connectDB();
    const apply = process.argv.includes("--apply");
    if (apply && !process.argv.includes("--confirm=KerberusPoints:2026-2027"))
      throw new Error("Expected --confirm=KerberusPoints:2026-2027");
    console.log(JSON.stringify(await resetYear({ apply }), null, 2));
  } catch (e) {
    console.error(
      "Reset failed:",
      e.name,
      e.code || "",
      e.message.includes("Expected") || e.message.includes("Reset refused")
        ? e.message
        : "No successful reset was confirmed.",
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
