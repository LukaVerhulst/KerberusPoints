import Schacht from "../models/Schacht.js";
import Task from "../models/Tasks.js";
import TaskCompletion from "../models/TaskCompletion.js";
import { transaction, objectId } from "../lib/transaction.js";
import { fail, textValue } from "../lib/rules.js";
export async function getSchachten(req, res) {
  res.json(await Schacht.find().sort({ points: -1, name: 1 }).lean());
}
export async function addSchacht(req, res) {
  const name = textValue(req.body?.name, "Naam", 100);
  res.status(201).json(await Schacht.create({ name }));
}
export async function updatePoints(req, res) {
  if ("points" in (req.body ?? {}))
    fail(409, "Wijzig punten via een opdracht, zodat de geschiedenis klopt.");
  const schacht = await Schacht.findByIdAndUpdate(
    objectId(req.params.id),
    { $set: { name: textValue(req.body?.name, "Naam", 100) } },
    { new: true, runValidators: true },
  );
  if (!schacht) fail(404, "Schacht niet gevonden.");
  res.json(schacht);
}
export async function deleteSchacht(req, res) {
  const id = objectId(req.params.id);
  await transaction(async (session) => {
    if (!(await Schacht.findByIdAndDelete(id, { session })))
      fail(404, "Schacht niet gevonden.");
    await TaskCompletion.deleteMany({ schachtId: id }, { session });
    await Task.deleteMany({ ownerSchachtId: id }, { session });
  });
  res.json({ ok: true });
}
