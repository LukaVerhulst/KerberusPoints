import mongoose from "mongoose";
const schema = new mongoose.Schema({
  schachtId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Schacht",
    required: true,
  },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  taskName: { type: String, required: true },
  pointsAwarded: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now },
  createdBy: String,
  ruleKey: String,
  requestKey: String,
  quantity: Number,
  variant: String,
  note: String,
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "TaskContext" },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "TaskContext" },
  subject: String,
  event: String,
  evidenceConfirmed: Boolean,
  lintConfirmed: Boolean,
  formalitiesConfirmed: Boolean,
  approvalConfirmed: Boolean,
});
schema.index({ schachtId: 1, completedAt: -1 });
schema.index(
  { schachtId: 1, taskId: 1, ruleKey: 1 },
  { unique: true, partialFilterExpression: { ruleKey: { $type: "string" } } },
);
schema.index(
  { schachtId: 1, requestKey: 1 },
  {
    unique: true,
    partialFilterExpression: { requestKey: { $type: "string" } },
  },
);
export default mongoose.model("TaskCompletion", schema);
