import mongoose from "mongoose";
import Task from "../models/Tasks.js";
import TaskCompletion from "../models/TaskCompletion.js";
import Schacht from "../models/Schacht.js";
import TaskContext from "../models/TaskContext.js";
import AppConfig from "../models/AppConfig.js";
let promise;
export default async function connectDB() {
  if (!promise)
    promise = (async () => {
      if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI ontbreekt");
      await mongoose.connect(process.env.MONGODB_URI, {
        dbName: process.env.MONGODB_DB_NAME || "KerberusPoints",
        bufferCommands: false,
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 7000,
        socketTimeoutMS: 20000,
      });
      // Uniqueness is a database constraint, not a find-before-insert check.
      for (const model of [
        Task,
        TaskCompletion,
        Schacht,
        TaskContext,
        AppConfig,
      ])
        await model.init();
      return mongoose.connection;
    })().catch((error) => {
      promise = undefined;
      throw error;
    });
  return promise;
}
