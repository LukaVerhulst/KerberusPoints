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
  category: String
});

export default mongoose.model('Task', taskSchema);