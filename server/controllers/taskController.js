import Task from '../models/Tasks.js';
import TaskCompletion from '../models/TaskCompletion.js';
import Schacht from '../models/Schacht.js';
import mongoose from 'mongoose';

// Get all tasks (global + optional schacht-owned)
export const getTasks = async (req, res) => {
  try {
    const { schachtId } = req.query;

    if (schachtId) {
      // Return global tasks (ownerSchachtId null) + tasks owned by this schacht
      const tasks = await Task.find({
        $or: [
          { ownerSchachtId: null },
          { ownerSchachtId: schachtId }
        ]
      }).lean();
      return res.json(tasks);
    }

    // default: return only global tasks
    const tasks = await Task.find({ ownerSchachtId: null }).lean();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get completions for a schacht
export const getCompletions = async (req, res) => {
  try {
    const completions = await TaskCompletion.find({ 
      schachtId: req.params.schachtId 
    }).lean();
    res.json(completions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Complete a task (existing taskId)
export const completeTask = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { schachtId, taskId } = req.body;
    
    const task = await Task.findById(taskId).lean().session(session);
    if (!task) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Task not found' });
    }

    // Create completion record
    const completion = new TaskCompletion({
      schachtId,
      taskId,
      completedAt: new Date()
    });
    await completion.save({ session });

    // Update schacht points
    const updatedSchacht = await Schacht.findByIdAndUpdate(
      schachtId,
      { $inc: { points: task.points }},
      { session, new: true }
    ).lean();

    await session.commitTransaction();
    res.status(201).json({ completion, updatedSchacht });

  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

// Create a custom task owned by a schacht, immediately mark completed, update points
export const createCustomTask = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { schachtId, name, points, repeatable = false, interval = 'none', description = '', category = '' } = req.body;

    if (!schachtId || !name || typeof points !== 'number') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Missing required fields: schachtId, name, points' });
    }

    // Create task with ownerSchachtId set
    const task = new Task({
      name,
      points,
      repeatable,
      interval,
      description,
      category,
      ownerSchachtId: schachtId
    });

    await task.save({ session });

    // Create completion record (since custom task should be immediately completed for that schacht)
    const completion = new TaskCompletion({
      schachtId,
      taskId: task._id,
      completedAt: new Date()
    });
    await completion.save({ session });

    // Update schacht points
    const updatedSchacht = await Schacht.findByIdAndUpdate(
      schachtId,
      { $inc: { points: points }},
      { session, new: true }
    ).lean();

    await session.commitTransaction();

    // Return created task, completion and updated schacht
    res.status(201).json({ task, completion, updatedSchacht });
  } catch (err) {
    await session.abortTransaction();
    console.error('Error creating custom task:', err);
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

// Delete a task completion
export const deleteCompletion = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { completionId } = req.params;
    const completion = await TaskCompletion.findById(completionId).session(session);

    if (!completion) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Completion not found' });
    }

    // Also subtract points from the schacht
    const task = await Task.findById(completion.taskId).lean().session(session);
    if (task) {
      await Schacht.findByIdAndUpdate(
        completion.schachtId,
        { $inc: { points: -task.points } },
        { session }
      );
    }

    await completion.deleteOne({ session });
    await session.commitTransaction();
    res.status(200).json({ message: 'Completion removed' });
  } catch (err) {
    await session.abortTransaction();
    console.error(err);
    res.status(500).json({ message: 'Error removing completion' });
  } finally {
    session.endSession();
  }
};

// Delete a custom task
export const deleteCustomTask = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId).session(session);
    if (!task) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Task not found" });
    }
    if (!task.ownerSchachtId) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Cannot delete global task" });
    }

    // Get all completions and group by schachtId to batch update points
    const completions = await TaskCompletion.find({ taskId }).lean().session(session);
    
    // Group completions by schachtId and count them
    const schachtPointsMap = {};
    completions.forEach(c => {
      if (!schachtPointsMap[c.schachtId]) {
        schachtPointsMap[c.schachtId] = 0;
      }
      schachtPointsMap[c.schachtId] += task.points;
    });

    // Batch update all schachten points in parallel
    const updatePromises = Object.entries(schachtPointsMap).map(([schachtId, pointsToSubtract]) => 
      Schacht.findByIdAndUpdate(
        schachtId,
        { $inc: { points: -pointsToSubtract } },
        { session }
      )
    );

    // Delete all completions in one operation
    const deleteCompletionPromise = TaskCompletion.deleteMany({ taskId }).session(session);
    
    // Delete the task
    const deleteTaskPromise = task.deleteOne({ session });

    // Execute all operations in parallel
    await Promise.all([...updatePromises, deleteCompletionPromise, deleteTaskPromise]);

    await session.commitTransaction();
    res.status(200).json({ message: "Custom task deleted" });
  } catch (err) {
    await session.abortTransaction();
    console.error(err);
    res.status(500).json({ message: "Error deleting custom task" });
  } finally {
    session.endSession();
  }
};
