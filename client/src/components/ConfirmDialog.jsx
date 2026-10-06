import { useState } from "react";
import Modal from "./Modal";
import { errorMessage } from "../lib/api";
export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  typedName,
  onClose,
  onConfirm,
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    if (busy || (typedName && value !== typedName)) return;
    setBusy(true);
    try {
      await onConfirm();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }
  return (
    <Modal title={title} onClose={onClose} busy={busy}>
      <form onSubmit={submit}>
        <p>{message}</p>
        {typedName && (
          <label>
            Typ “{typedName}” om te bevestigen
            <input
              autoComplete="off"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </label>
        )}
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
            className="danger"
            disabled={busy || Boolean(typedName && value !== typedName)}
          >
            {busy ? "Verwerken…" : confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
