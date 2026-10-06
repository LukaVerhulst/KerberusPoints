import { useState } from "react";
import Modal from "./Modal";
import { api, errorMessage, repeatLabel, signed } from "../lib/api";
export default function CompletionDialog({
  task,
  schacht,
  contexts,
  completions,
  onClose,
  onSaved,
  onContexts,
}) {
  const [input, setInput] = useState({
    requestKey: crypto.randomUUID(),
    quantity: 1,
    variant: task.pricing.variants?.[0]?.key || "",
    points: task.pricing.minPoints || task.points,
    note: "",
    subjectId: "",
    eventId: "",
    evidenceConfirmed: false,
    lintConfirmed: false,
    formalitiesConfirmed: false,
    approvalConfirmed: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [contextBusy, setContextBusy] = useState(false);
  const set = (key, value) =>
    setInput((current) => ({ ...current, [key]: value }));
  const rule = task.repeatRule;
  const field = rule.type === "person" ? "subjectId" : "eventId";
  const choices = contexts.filter(
    (c) => c.kind === rule.type && c.groups.includes(rule.group)
  );
  const prior = completions.some(
    (c) => c.taskId === task._id && c[field] === input[field] && input[field]
  );
  const base =
    task.pricing.type === "variant"
      ? task.pricing.variants.find((v) => v.key === input.variant)?.points
      : task.pricing.type === "variable"
        ? input.points
        : task.points;
  const total = base * (rule.type === "quantity" ? input.quantity : 1);
  const validPoints =
    Number.isSafeInteger(total) &&
    (rule.type !== "quantity" ||
      (input.quantity >= 1 && input.quantity <= 1000)) &&
    (task.pricing.type !== "variable" ||
      (input.points >= task.pricing.minPoints &&
        input.points <= 10000 &&
        input.note.trim()));
  async function addContext() {
    setContextBusy(true);
    setError("");
    try {
      const { data } = await api.post("/api/contexts", {
        kind: rule.type,
        group: rule.group,
        name: newName,
      });
      onContexts(data);
      set(field, data._id);
      setCreating(false);
      setNewName("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setContextBusy(false);
    }
  }
  async function submit(e) {
    e.preventDefault();
    if (busy || !validPoints || prior) return;
    setBusy(true);
    setError("");
    const payload = { ...input, schachtId: schacht._id, taskId: task._id };
    if (task.pricing.type !== "variable") delete payload.points;
    if (rule.type !== "person") delete payload.subjectId;
    if (rule.type !== "event") delete payload.eventId;
    try {
      const { data } = await api.post("/api/completions", payload);
      await onSaved(data);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Opdracht bevestigen"
      onClose={onClose}
      busy={busy || contextBusy}
    >
      <form onSubmit={submit}>
        <p className="eyebrow">VOOR {schacht.name}</p>
        <h3>{task.name}</h3>
        <p className="muted">{task.description}</p>
        <span className="badge">{repeatLabel(task)}</span>
        {["person", "event"].includes(rule.type) && (
          <div className="context-field">
            <label>
              {rule.label}
              <select
                required
                value={input[field]}
                onChange={(e) => set(field, e.target.value)}
              >
                <option value="">Selecteer {rule.label.toLowerCase()}</option>
                {choices.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                    {completions.some(
                      (x) => x.taskId === task._id && x[field] === c._id
                    )
                      ? " · al geregistreerd"
                      : ""}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="text-button"
              onClick={() => setCreating(!creating)}
            >
              + {rule.type === "person" ? "Persoon" : rule.label} toevoegen
            </button>
            {creating && (
              <div className="inline-create">
                <input
                  aria-label={`Nieuwe ${rule.label}`}
                  placeholder={
                    rule.type === "person"
                      ? "Volledige naam, geen bijnaam"
                      : "Naam en datum, bv. Openingscantus 14/10/2026"
                  }
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <button
                  type="button"
                  disabled={contextBusy || !newName.trim()}
                  onClick={addContext}
                >
                  Opslaan
                </button>
              </div>
            )}
            <p className="field-hint">
              Gebruik altijd dezelfde persoon of hetzelfde evenement. Een andere
              variant geeft geen tweede beurt.
            </p>
            {prior && (
              <p className="error" role="alert">
                Deze {rule.label.toLowerCase()} is al geregistreerd voor deze
                opdracht.
              </p>
            )}
          </div>
        )}
        {rule.type === "quantity" && (
          <label>
            Aantal {rule.label}
            <input
              required
              type="number"
              min="1"
              max="1000"
              step="1"
              value={input.quantity}
              onChange={(e) =>
                set(
                  "quantity",
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />
          </label>
        )}
        {task.pricing.type === "variant" && (
          <label>
            Uitkomst / variant
            <select
              required
              value={input.variant}
              onChange={(e) => set("variant", e.target.value)}
            >
              {task.pricing.variants.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.label} · {signed(v.points)} punten
                </option>
              ))}
            </select>
          </label>
        )}
        {task.pricing.type === "variable" && (
          <label>
            Goedgekeurde punten (minimaal {task.pricing.minPoints})
            <input
              required
              type="number"
              min={task.pricing.minPoints}
              max="10000"
              step="1"
              value={input.points}
              onChange={(e) =>
                set(
                  "points",
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />
          </label>
        )}
        <label>
          {task.pricing.type === "variable"
            ? "Goedkeuring van de temster / toelichting"
            : "Notitie of link naar bewijs (optioneel)"}
          <textarea
            maxLength="1000"
            required={task.pricing.type === "variable"}
            value={input.note}
            onChange={(e) => set("note", e.target.value)}
            rows="2"
          />
        </label>
        <div className="checks">
          <label>
            <input
              required
              type="checkbox"
              checked={input.evidenceConfirmed}
              onChange={(e) => set("evidenceConfirmed", e.target.checked)}
            />
            Foto/video staat in de Facebookgroep.
          </label>
          {task.requiresLint && (
            <label>
              <input
                required
                type="checkbox"
                checked={input.lintConfirmed}
                onChange={(e) => set("lintConfirmed", e.target.checked)}
              />
              Uitgevoerd met lint.
            </label>
          )}
          {!task.requiresLint && (
            <p className="field-hint">
              Deze opdracht moet volgens het document zonder lint.
            </p>
          )}
          {task.requiresFormalities && (
            <label>
              <input
                required
                type="checkbox"
                checked={input.formalitiesConfirmed}
                onChange={(e) => set("formalitiesConfirmed", e.target.checked)}
              />
              Binnentrekken gebeurde met formaliteiten.
            </label>
          )}
          {task.requiresApproval && (
            <label>
              <input
                required
                type="checkbox"
                checked={input.approvalConfirmed}
                onChange={(e) => set("approvalConfirmed", e.target.checked)}
              />
              Vereiste goedkeuring / aanwezigheid bevestigd.
            </label>
          )}
        </div>
        <div className={`score-preview ${total < 0 ? "negative" : ""}`}>
          <span>
            {total < 0 ? "Punten aftrekken" : "Punten toevoegen"}
            <small>
              Score na bevestiging: {validPoints ? schacht.points + total : "—"}
            </small>
          </span>
          <strong>{validPoints ? signed(total) : "—"}</strong>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" disabled={busy} onClick={onClose}>
            Annuleren
          </button>
          <button
            className={total < 0 ? "danger" : "primary"}
            disabled={busy || contextBusy || !validPoints || prior}
          >
            {busy
              ? "Opslaan…"
              : `Bevestig ${validPoints ? signed(total) : ""} punten`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
