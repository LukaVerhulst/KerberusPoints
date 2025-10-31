import Task from '../models/Tasks.js';
import TaskCompletion from '../models/TaskCompletion.js';
import Schacht from '../models/Schacht.js';
import mongoose from 'mongoose';

// Get all tasks
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find();
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
    });
    res.json(completions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Complete a task
export const completeTask = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { schachtId, taskId } = req.body;
    
    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // Create completion record
    const completion = new TaskCompletion({
      schachtId,
      taskId,
      completedAt: new Date()
    });
    await completion.save({ session });

    // Update schacht points
    await Schacht.findByIdAndUpdate(
      schachtId,
      { $inc: { points: task.points }},
      { session }
    );

    await session.commitTransaction();
    res.status(201).json(completion);

  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

// Delete a task completion
export const deleteCompletion = async (req, res) => {
  try {
    const { completionId } = req.params;
    const completion = await TaskCompletion.findByIdAndDelete(completionId);

    if (!completion) return res.status(404).json({ message: 'Completion not found' });

    // Also subtract points from the schacht
    const task = await Task.findById(completion.taskId);
    if (task) {
      await Schacht.findByIdAndUpdate(
        completion.schachtId,
        { $inc: { points: -task.points } }
      );
    }

    res.status(200).json({ message: 'Completion removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error removing completion' });
  }
};