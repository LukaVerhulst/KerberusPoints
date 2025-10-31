import mongoose from 'mongoose';

const taskCompletionSchema = new mongoose.Schema({
  schachtId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schacht',
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task',
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for frequently queried fields
taskCompletionSchema.index({ schachtId: 1 }); // For finding completions by schacht
taskCompletionSchema.index({ taskId: 1 }); // For finding completions by task
taskCompletionSchema.index({ schachtId: 1, taskId: 1 }); // Compound index for unique lookups
taskCompletionSchema.index({ completedAt: -1 }); // For sorting by completion date

export default mongoose.model('TaskCompletion', taskCompletionSchema);