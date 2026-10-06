import Task from "../models/Tasks.js";
import TaskCompletion from "../models/TaskCompletion.js";
import Schacht from "../models/Schacht.js";
import TaskContext from "../models/TaskContext.js";
import { transaction, objectId } from "../lib/transaction.js";
import { evaluate, fail, textValue, normalize } from "../lib/rules.js";
export async function getTasks(req, res) {
  const filter = req.query.schachtId
    ? {
        $or: [
          { ownerSchachtId: null },
          { ownerSchachtId: objectId(req.query.schachtId) },
        ],
      }
    : { ownerSchachtId: null };
  res.json(
    await Task.find(filter).sort({ order: 1, createdAt: 1, _id: 1 }).lean(),
  );
}
export async function getCompletions(req, res) {
  res.json(
    await TaskCompletion.find({ schachtId: objectId(req.params.schachtId) })
      .sort({ completedAt: -1, _id: -1 })
      .lean(),
  );
}
async function recordCompletion(task, schachtId, input, user, session) {
  if (task.ownerSchachtId && String(task.ownerSchachtId) !== schachtId)
    fail(403, "Deze opdracht hoort bij een andere schacht.");
  const values = evaluate(task, input);
  for (const [field, kind] of [
    ["subjectId", "person"],
    ["eventId", "event"],
  ]) {
    if (task.repeatRule.type !== kind) {
      if (input[field]) fail(400, "Onverwachte context voor deze opdracht.");
      continue;
    }
    const context = await TaskContext.findById(objectId(input[field]))
      .session(session)
      .lean();
    if (
      !context ||
      context.kind !== kind ||
      !context.groups.includes(task.repeatRule.group)
    )
      fail(400, `Kies een geldige ${task.repeatRule.label}.`);
    values[field] = context._id;
    values[kind === "person" ? "subject" : "event"] = context.name;
  }
  // Every score operation writes the same schacht document. This serializes races with deletes.
  const schacht = await Schacht.findByIdAndUpdate(
    schachtId,
    { $inc: { points: values.pointsAwarded, revision: 1 } },
    { new: true, session },
  ).lean();
  if (!schacht) fail(404, "Schacht niet gevonden.");
  const [completion] = await TaskCompletion.create(
    [
      {
        ...values,
        schachtId,
        taskId: task._id,
        taskName: task.name,
        createdBy: user.email,
      },
    ],
    { session },
  );
  return { completion, updatedSchacht: schacht };
}
export async function completeTask(req, res) {
  const schachtId = objectId(req.body?.schachtId),
    taskId = objectId(req.body?.taskId);
  const result = await transaction(async (session) => {
    const existing =
      typeof req.body.requestKey === "string" &&
      (await TaskCompletion.findOne({
        schachtId,
        requestKey: req.body.requestKey,
      })
        .session(session)
        .lean());
    if (existing) {
      if (String(existing.taskId) !== taskId)
        fail(409, "Deze verzoekcode is al gebruikt.");
      return {
        completion: existing,
        updatedSchacht: await Schacht.findById(schachtId)
          .session(session)
          .lean(),
        replayed: true,
      };
    }
    const task = await Task.findById(taskId).session(session).lean();
    if (!task) fail(404, "Opdracht niet gevonden.");
    return recordCompletion(task, schachtId, req.body, req.user, session);
  });
  res.status(result.replayed ? 200 : 201).json(result);
}
export async function createCustomTask(req, res) {
  const schachtId = objectId(req.body?.schachtId),
    input = req.body;
  const name = textValue(input.name, "Naam van de opdracht");
  const points = input.customPoints;
  if (!Number.isSafeInteger(points) || Math.abs(points) > 10000 || points === 0)
    fail(
      400,
      "Kies een geheel aantal punten tussen −10000 en 10000, behalve 0.",
    );
  const type = input.repeatType;
  if (!["once", "weekly", "unlimited"].includes(type))
    fail(400, "Kies eenmalig, wekelijks of onbeperkt.");
  const result = await transaction(async (session) => {
    const existing =
      typeof input.requestKey === "string" &&
      (await TaskCompletion.findOne({ schachtId, requestKey: input.requestKey })
        .session(session)
        .lean());
    if (existing)
      return {
        completion: existing,
        updatedSchacht: await Schacht.findById(schachtId)
          .session(session)
          .lean(),
        replayed: true,
      };
    const [task] = await Task.create(
      [
        {
          name,
          points,
          ownerSchachtId: schachtId,
          category: "Eigen opdracht",
          description: textValue(input.description, "Uitleg", 1000, false),
          repeatRule: { type },
          pricing: { type: "fixed" },
          requiresLint: input.requiresLint !== false,
        },
      ],
      { session },
    );
    return {
      task,
      ...(await recordCompletion(task, schachtId, input, req.user, session)),
    };
  });
  res.status(result.replayed ? 200 : 201).json(result);
}
export async function deleteCompletion(req, res) {
  const result = await transaction(async (session) => {
    const completion = await TaskCompletion.findByIdAndDelete(
      objectId(req.params.completionId),
      { session },
    ).lean();
    if (!completion) fail(404, "Voltooiing niet gevonden.");
    if (!Number.isSafeInteger(completion.pointsAwarded))
      fail(409, "Deze oude voltooiing moet eerst worden gemigreerd.");
    const updatedSchacht = await Schacht.findByIdAndUpdate(
      completion.schachtId,
      { $inc: { points: -completion.pointsAwarded, revision: 1 } },
      { new: true, session },
    ).lean();
    if (!updatedSchacht) fail(404, "Schacht niet gevonden.");
    return { updatedSchacht };
  });
  res.json(result);
}
export async function deleteCustomTask(req, res) {
  await transaction(async (session) => {
    const task = await Task.findByIdAndDelete(objectId(req.params.taskId), {
      session,
    }).lean();
    if (!task) fail(404, "Opdracht niet gevonden.");
    if (!task.ownerSchachtId)
      fail(403, "Standaardopdrachten kunnen niet worden verwijderd.");
    const completions = await TaskCompletion.find({ taskId: task._id })
      .session(session)
      .lean();
    let points = 0;
    for (const c of completions) {
      if (!Number.isSafeInteger(c.pointsAwarded))
        fail(409, "Oude voltooiing zonder puntensnapshot.");
      points += c.pointsAwarded;
    }
    await Schacht.updateOne(
      { _id: task.ownerSchachtId },
      { $inc: { points: -points, revision: 1 } },
      { session },
    );
    await TaskCompletion.deleteMany({ taskId: task._id }, { session });
  });
  res.json({ ok: true });
}
export async function getContexts(req, res) {
  res.json(await TaskContext.find().sort({ name: 1 }).lean());
}
export async function createContext(req, res) {
  const name = textValue(req.body?.name, "Naam"),
    { kind, group } = req.body;
  const groups =
    kind === "person"
      ? ["praesidium", "senior"]
      : kind === "event"
        ? ["event", "cantus", "cvs"]
        : [];
  if (!groups.includes(group)) fail(400, "Ongeldig type persoon/evenement.");
  // Reuse a canonical identity, even if the person has more than one role.
  res
    .status(201)
    .json(
      await TaskContext.findOneAndUpdate(
        { kind, normalizedName: normalize(name) },
        {
          $setOnInsert: { name, kind, normalizedName: normalize(name) },
          $addToSet: { groups: group },
        },
        { upsert: true, new: true, runValidators: true },
      ),
    );
}
