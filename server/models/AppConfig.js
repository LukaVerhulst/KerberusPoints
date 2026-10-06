import mongoose from "mongoose";
const schema = new mongoose.Schema(
  { _id: String, academicYear: String, resetAt: Date },
  { collection: "appconfigs" },
);
export default mongoose.model("AppConfig", schema);
