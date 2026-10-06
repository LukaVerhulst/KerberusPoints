import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    points: { type: Number, default: 0 },
    revision: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "schachten" },
);
schema.index({ points: -1, name: 1 });
export default mongoose.model("Schacht", schema);
