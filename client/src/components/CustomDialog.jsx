import { useState } from "react";
import Modal from "./Modal";
import { api, signed, errorMessage } from "../lib/api";
export default function CustomDialog({ schacht, onClose, onSaved }) {
  const [input, setInput] = useState({
    requestKey: crypto.randomUUID(),
    name: "",
    customPoints: "",
    description: "",
    note: "",
    repeatType: "once",
    requiresLint: true,
    lintConfirmed: false,
    evidenceConfirmed: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key, value) => setInput((c) => ({ ...c, [key]: value }));
  const valid =
    Number.isSafeInteger(input.customPoints) &&
    input.customPoints !== 0 &&
    Math.abs(input.customPoints) <= 10000;
  async function submit(e) {
    e.preventDefault();
    if (busy || !valid) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/api/custom-tasks", {
        ...input,
        schachtId: schacht._id,
      });
      await onSaved(data);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }
  return (
    <Modal title="Eigen opdracht" onClose={onClose} busy={busy}>
      <form onSubmit={submit}>
        <p className="muted">
          Voor {schacht.name}. De opdracht wordt aangemaakt én één keer
          geregistreerd na bevestiging.
        </p>
        <label>
          Naam
          <input
            required
            maxLength="200"
            value={input.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </label>
        <div className="form-grid">
          <label>
            Punten
            <input
              required
              type="number"
              min="-10000"
              max="10000"
              step="1"
              placeholder="Bijvoorbeeld 10 of -5"
              value={input.customPoints}
              onChange={(e) =>
                set(
                  "customPoints",
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />
          </label>
          <label>
            Herhaalregel
            <select
              value={input.repeatType}
              onChange={(e) => set("repeatType", e.target.value)}
            >
              <option value="once">Eenmalig</option>
              <option value="weekly">1× per week</option>
              <option value="unlimited">Onbeperkt</option>
            </select>
          </label>
        </div>
        <label>
          Uitleg / reden
          <textarea
            rows="2"
            maxLength="1000"
            value={input.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </label>
        <div className="checks">
          <label>
            <input
              type="checkbox"
              checked={input.requiresLint}
              onChange={(e) => set("requiresLint", e.target.checked)}
            />
            Lint verplicht voor deze opdracht.
          </label>
          {input.requiresLint && (
            <label>
              <input
                type="checkbox"
                required
                checked={input.lintConfirmed}
                onChange={(e) => set("lintConfirmed", e.target.checked)}
              />
              Uitgevoerd met lint.
            </label>
          )}
          <label>
            <input
              type="checkbox"
              required
              checked={input.evidenceConfirmed}
              onChange={(e) => set("evidenceConfirmed", e.target.checked)}
            />
            Foto/video staat in de Facebookgroep.
          </label>
        </div>
        <div
          className={`score-preview ${input.customPoints < 0 ? "negative" : ""}`}
        >
          <span>
            Voor {schacht.name}
            <small>
              Nieuwe score: {valid ? schacht.points + input.customPoints : "—"}
            </small>
          </span>
          <strong>{valid ? signed(input.customPoints) : "—"}</strong>
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
            className={input.customPoints < 0 ? "danger" : "primary"}
            disabled={busy || !valid}
          >
            {busy ? "Opslaan…" : "Aanmaken en punten bevestigen"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
