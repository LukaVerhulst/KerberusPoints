import mongoose from "mongoose";
import Task from "../models/Tasks.js";
import TaskCompletion from "../models/TaskCompletion.js";
import Schacht from "../models/Schacht.js";

// Utility: check if we can use sessions
const supportsTransactions = () => mongoose.connection?.client?.topology?.s?.replicaSet;

// Get all tasks (global + optional schacht-owned)
export const getTasks = async (req, res) => {
  try {
    const { schachtId } = req.query;

    if (schachtId) {
      const tasks = await Task.find({
        $or: [{ ownerSchachtId: null }, { ownerSchachtId: schachtId }],
      }).lean();
      return res.json(tasks);
    }

    const tasks = await Task.find({ ownerSchachtId: null }).lean();
    res.json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get completions for a schacht
export const getCompletions = async (req, res) => {
  try {
    const completions = await TaskCompletion.find({
      schachtId: req.params.schachtId,
    }).lean();
    res.json(completions);
  } catch (err) {
    console.error("Error fetching completions:", err);
    res.status(500).json({ message: err.message });
  }
};

// Complete an existing task
export const completeTask = async (req, res) => {
  const { schachtId, taskId } = req.body;

  // Validate input early
  if (!schachtId || !mongoose.isValidObjectId(taskId)) {
    return res
      .status(400)
      .json({ message: "Invalid or missing schachtId/taskId" });
  }

  const useSession = supportsTransactions();
  const session = useSession ? await mongoose.startSession() : null;

  if (useSession) session.startTransaction();

  try {
    const task = await Task.findById(taskId).lean();
    if (!task) {
      if (useSession) await session.abortTransaction();
      return res.status(404).json({ message: "Task not found" });
    }

    // Create completion record
    const completion = new TaskCompletion({
      schachtId,
      taskId,
      completedAt: new Date(),
    });
    await completion.save(useSession ? { session } : {});

    // Update schacht points
    const updatedSchacht = await Schacht.findByIdAndUpdate(
      schachtId,
      { $inc: { points: task.points } },
      { new: true, ...(useSession ? { session } : {}) }
    ).lean();

    if (useSession) await session.commitTransaction();

    res.status(201).json({ completion, updatedSchacht });
  } catch (err) {
    if (useSession) await session.abortTransaction();
    console.error("Error completing task:", err);
    res.status(500).json({ message: err.message });
  } finally {
    if (useSession) session.endSession();
  }
};

// Create a custom task owned by a schacht
export const createCustomTask = async (req, res) => {
  const {
    schachtId,
    name,
    points,
    repeatable = false,
    interval = "none",
    description = "",
    category = "",
  } = req.body;

  if (!schachtId || !name || typeof points !== "number") {
    return res
      .status(400)
      .json({ message: "Missing required fields: schachtId, name, points" });
  }

  const useSession = supportsTransactions();
  const session = useSession ? await mongoose.startSession() : null;
  if (useSession) session.startTransaction();

  try {
    // Create task
    const task = new Task({
      name,
      points,
      repeatable,
      interval,
      description,
      category,
      ownerSchachtId: schachtId,
    });
    await task.save(useSession ? { session } : {});

    // Create immediate completion
    const completion = new TaskCompletion({
      schachtId,
      taskId: task._id,
      completedAt: new Date(),
    });
    await completion.save(useSession ? { session } : {});

    // Update schacht points
    const updatedSchacht = await Schacht.findByIdAndUpdate(
      schachtId,
      { $inc: { points } },
      { new: true, ...(useSession ? { session } : {}) }
    ).lean();

    if (useSession) await session.commitTransaction();

    res.status(201).json({ task, completion, updatedSchacht });
  } catch (err) {
    if (useSession) await session.abortTransaction();
    console.error("Error creating custom task:", err);
    res.status(500).json({ message: err.message });
  } finally {
    if (useSession) session.endSession();
  }
};

// Delete a task completion
export const deleteCompletion = async (req, res) => {
  const { completionId } = req.params;

  const useSession = supportsTransactions();
  const session = useSession ? await mongoose.startSession() : null;
  if (useSession) session.startTransaction();

  try {
    const completion = await TaskCompletion.findById(completionId).session(
      useSession ? session : null
    );

    if (!completion) {
      if (useSession) await session.abortTransaction();
      return res.status(404).json({ message: "Completion not found" });
    }

    const task = await Task.findById(completion.taskId)
      .lean()
      .session(useSession ? session : null);

    if (task) {
      await Schacht.findByIdAndUpdate(
        completion.schachtId,
        { $inc: { points: -task.points } },
        useSession ? { session } : {}
      );
    }

    await completion.deleteOne(useSession ? { session } : {});

    if (useSession) await session.commitTransaction();
    res.status(200).json({ message: "Completion removed" });
  } catch (err) {
    if (useSession) await session.abortTransaction();
    console.error("Error deleting completion:", err);
    res.status(500).json({ message: "Error removing completion" });
  } finally {
    if (useSession) session.endSession();
  }
};

// Delete a custom task
export const deleteCustomTask = async (req, res) => {
  const { taskId } = req.params;

  const useSession = supportsTransactions();
  const session = useSession ? await mongoose.startSession() : null;
  if (useSession) session.startTransaction();

  try {
    const task = await Task.findById(taskId).session(useSession ? session : null);
    if (!task) {
      if (useSession) await session.abortTransaction();
      return res.status(404).json({ message: "Task not found" });
    }

    if (!task.ownerSchachtId) {
      if (useSession) await session.abortTransaction();
      return res.status(400).json({ message: "Cannot delete global task" });
    }

    const completions = await TaskCompletion.find({ taskId })
      .lean()
      .session(useSession ? session : null);

    const schachtPointsMap = {};
    completions.forEach((c) => {
      if (!schachtPointsMap[c.schachtId]) schachtPointsMap[c.schachtId] = 0;
      schachtPointsMap[c.schachtId] += task.points;
    });

    const updatePromises = Object.entries(schachtPointsMap).map(
      ([schachtId, pointsToSubtract]) =>
        Schacht.findByIdAndUpdate(
          schachtId,
          { $inc: { points: -pointsToSubtract } },
          useSession ? { session } : {}
        )
    );

    await Promise.all([
      ...updatePromises,
      TaskCompletion.deleteMany({ taskId }).session(useSession ? session : null),
      task.deleteOne(useSession ? { session } : {}),
    ]);

    if (useSession) await session.commitTransaction();
    res.status(200).json({ message: "Custom task deleted" });
  } catch (err) {
    if (useSession) await session.abortTransaction();
    console.error("Error deleting custom task:", err);
    res.status(500).json({ message: "Error deleting custom task" });
  } finally {
    if (useSession) session.endSession();
  }
};
