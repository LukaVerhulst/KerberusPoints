import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  points: { type: Number, required: true },
  repeatable: { type: Boolean, default: false },
  interval: { 
    type: String,
    enum: ['none', 'daily', 'weekly'],
    default: 'none'
  },
  description: String,
  category: String,
  // NEW: optional owner — if set, the task is only visible to that schacht
  ownerSchachtId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schacht',
    default: null
  }
});

export default mongoose.model('Task', taskSchema);
