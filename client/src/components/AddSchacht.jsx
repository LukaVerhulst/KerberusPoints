import { useState } from "react";
import Modal from "./Modal";
import { api, errorMessage } from "../lib/api";
export default function AddSchacht({ onClose, onSaved }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/api/schachten", { name });
      await onSaved(data);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }
  return (
    <Modal title="Schacht toevoegen" onClose={onClose} busy={busy}>
      <form onSubmit={submit}>
        <p className="muted">
          Een nieuw gezicht in de strijd om superschacht. Iedereen begint op 0
          punten.
        </p>
        <label>
          Naam
          <input
            required
            maxLength="100"
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" disabled={busy} onClick={onClose}>
            Annuleren
          </button>
          <button className="primary" disabled={busy || !name.trim()}>
            {busy ? "Toevoegen…" : "Schacht toevoegen"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
