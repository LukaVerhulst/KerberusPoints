import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["person", "event"], required: true },
    name: { type: String, required: true },
    normalizedName: { type: String, required: true },
    groups: [
      {
        type: String,
        enum: ["praesidium", "senior", "event", "cantus", "cvs"],
      },
    ],
  },
  { timestamps: true },
);
schema.index({ kind: 1, normalizedName: 1 }, { unique: true });
export default mongoose.model("TaskContext", schema);
