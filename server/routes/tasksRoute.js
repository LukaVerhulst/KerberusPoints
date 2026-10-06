import express from "express";
import {
  getTasks,
  getCompletions,
  completeTask,
  deleteCompletion,
  createCustomTask,
  deleteCustomTask,
  getContexts,
  createContext,
} from "../controllers/taskController.js";
const router = express.Router();
router.get("/tasks", getTasks);
router.get("/completions/:schachtId", getCompletions);
router.post("/completions", completeTask);
router.post("/custom-tasks", createCustomTask);
router.delete("/completions/:completionId", deleteCompletion);
router.delete("/custom-tasks/:taskId", deleteCustomTask);
router.get("/contexts", getContexts);
router.post("/contexts", createContext);
export default router;
