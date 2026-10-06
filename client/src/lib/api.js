import axios from "axios";
export const api = axios.create({
  baseURL: "/",
  withCredentials: true,
  timeout: 20000,
  headers: { "X-Kerberus-Request": "1" },
});
export const errorMessage = (error) =>
  error.response?.data?.message || "Verbinding mislukt. Probeer opnieuw.";
export const signed = (value) => `${value >= 0 ? "+" : "−"}${Math.abs(value)}`;
export function weekKey(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en", {
      timeZone: "Europe/Brussels",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  const day = new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day));
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}
export function repeatLabel(task) {
  const r = task.repeatRule;
  return {
    once: "Eenmalig",
    unlimited: "Onbeperkt",
    weekly: "1× per week",
    person: `1× per ${r.label?.toLowerCase() || "persoon"}`,
    event: `1× per ${r.label?.toLowerCase() || "evenement"}`,
    quantity: `Per ${r.label || "aantal"}`,
  }[r.type];
}
export function pointsLabel(task) {
  if (task.pricing.type === "variable")
    return `vanaf ${task.pricing.minPoints}`;
  if (task.pricing.type === "variant")
    return [...new Set(task.pricing.variants.map((v) => v.points))]
      .map(signed)
      .join(" / ");
  return signed(task.points);
}
export function blocked(task, completions) {
  return completions.some(
    (c) =>
      c.taskId === task._id &&
      (task.repeatRule.type === "once" ||
        (task.repeatRule.type === "weekly" &&
          c.ruleKey === `week:${weekKey()}`))
  );
}
