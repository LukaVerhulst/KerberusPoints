import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    code: String,
    academicYear: String,
    order: Number,
    name: { type: String, required: true, maxlength: 200 },
    points: { type: Number, required: true },
    description: String,
    category: String,
    repeatRule: {
      type: {
        type: String,
        enum: ["once", "unlimited", "weekly", "person", "event", "quantity"],
        required: true,
      },
      group: String,
      label: String,
    },
    pricing: {
      type: {
        type: String,
        enum: ["fixed", "variant", "variable"],
        default: "fixed",
      },
      minPoints: Number,
      variants: [{ _id: false, key: String, label: String, points: Number }],
    },
    requiresLint: { type: Boolean, default: true },
    requiresFormalities: Boolean,
    requiresApproval: Boolean,
    ownerSchachtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schacht",
      default: null,
    },
  },
  { timestamps: true },
);
schema.index({ ownerSchachtId: 1 });
export default mongoose.model("Task", schema);
