import { createHash } from "node:crypto";
export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const fail = (status, message) => {
  throw new AppError(status, message);
};
export function textValue(value, label, max = 200, required = true) {
  if (typeof value !== "string") {
    if (!required && value === undefined) return "";
    fail(400, `${label} is verplicht.`);
  }
  const result = value.trim().replace(/\s+/g, " ");
  if ((required && !result) || result.length > max)
    fail(400, `${label} moet 1–${max} tekens bevatten.`);
  return result;
}
export const normalize = (value) =>
  value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("nl-BE")
    .trim()
    .replace(/\s+/g, " ");
export function weekKey(now = new Date()) {
  // Use the civil date in Brussels, including DST, then the Monday of that calendar week.
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en", {
      timeZone: "Europe/Brussels",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const date = new Date(
    Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)),
  );
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}
export function evaluate(task, input, now = new Date()) {
  if (input.evidenceConfirmed !== true)
    fail(
      400,
      "Geen bewijs = geen punten. Bevestig de foto/video in de Facebookgroep.",
    );
  if (task.requiresLint && input.lintConfirmed !== true)
    fail(400, "Bevestig dat de opdracht met lint is uitgevoerd.");
  if (task.requiresFormalities && input.formalitiesConfirmed !== true)
    fail(400, "Binnentrekken telt alleen met formaliteiten.");
  if (task.requiresApproval && input.approvalConfirmed !== true)
    fail(
      400,
      "Bevestig de vereiste goedkeuring / aanwezigheid van het praesidium.",
    );
  const type = task.repeatRule.type;
  let quantity = 1;
  if (type === "quantity") {
    quantity = input.quantity;
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000)
      fail(400, "Aantal moet een geheel getal tussen 1 en 1000 zijn.");
  } else if (input.quantity !== undefined && input.quantity !== 1)
    fail(400, "Deze opdracht ondersteunt geen aantal.");
  let points = task.points;
  let variant = "";
  if (task.pricing.type === "variant") {
    const choice = task.pricing.variants.find((v) => v.key === input.variant);
    if (!choice) fail(400, "Kies een geldige variant.");
    points = choice.points;
    variant = choice.key;
  } else if (input.variant) fail(400, "Deze opdracht heeft geen varianten.");
  if (task.pricing.type === "variable") {
    points = input.points;
    if (
      !Number.isSafeInteger(points) ||
      points < task.pricing.minPoints ||
      points > 10000
    )
      fail(
        400,
        `Punten moeten een geheel getal tussen ${task.pricing.minPoints} en 10000 zijn.`,
      );
  } else if (input.points !== undefined)
    fail(400, "Punten worden door de opdracht bepaald.");
  points *= quantity;
  if (!Number.isSafeInteger(points) || Math.abs(points) > 1000000)
    fail(400, "Ongeldig aantal punten.");
  const note = textValue(input.note, "Notitie", 1000, false);
  if (task.pricing.type === "variable" && !note)
    fail(400, "Noteer wie de punten heeft goedgekeurd.");
  let ruleKey;
  if (type === "once") ruleKey = "once";
  else if (type === "weekly") ruleKey = `week:${weekKey(now)}`;
  else if (type === "person") {
    if (!input.subjectId) fail(400, "Kies een persoon.");
    ruleKey = `person:${input.subjectId}`;
  } else if (type === "event") {
    if (!input.eventId) fail(400, "Kies een evenement/cantus/opdracht.");
    ruleKey = `event:${input.eventId}`;
  } else if (!["unlimited", "quantity"].includes(type))
    fail(400, "Onbekende herhaalregel.");
  const requestKey = textValue(input.requestKey, "Verzoekcode", 80);
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(requestKey))
    fail(400, "Ongeldige verzoekcode.");
  return {
    pointsAwarded: points,
    quantity,
    variant,
    note,
    ruleKey,
    requestKey,
    evidenceConfirmed: true,
    lintConfirmed: input.lintConfirmed === true,
    formalitiesConfirmed: input.formalitiesConfirmed === true,
    approvalConfirmed: input.approvalConfirmed === true,
  };
}
export const stableTaskId = (code) =>
  createHash("sha256").update(`2026-2027:${code}`).digest("hex").slice(0, 24);
