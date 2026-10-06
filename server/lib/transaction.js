import mongoose from "mongoose";
import { AppError } from "./rules.js";
export async function transaction(work) {
  try {
    return await mongoose.connection.transaction(work, {
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
    });
  } catch (error) {
    if (error.code === 20 || error.codeName === "IllegalOperation")
      throw new AppError(
        503,
        "De database moet transacties ondersteunen. Er zijn geen punten gewijzigd.",
      );
    throw error;
  }
}
export function objectId(value) {
  if (typeof value !== "string" || !/^[a-fA-F0-9]{24}$/.test(value))
    throw new AppError(400, "Ongeldig ID.");
  return value;
}
