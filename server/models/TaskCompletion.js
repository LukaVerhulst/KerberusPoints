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

export default mongoose.model('TaskCompletion', taskCompletionSchema);