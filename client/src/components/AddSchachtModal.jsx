import React, { useEffect, useRef, useState } from 'react';

export default function AddSchachtModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await onAdd(trimmed);
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-sm bg-white/5 backdrop-blur-md rounded p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Add Schacht"
      >
        <h3 className="text-sm font-semibold text-white mb-2">Add Schacht</h3>
        <label className="block text-xs text-white/80 mb-1">Naam</label>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded bg-white/6 text-white placeholder:text-white/50 mb-3"
          placeholder="Naam van de schacht"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1 text-sm rounded  text-white">Cancel</button>
          <button type="submit" className="px-3 py-1 text-sm rounded bg-primary bg-white/6 hover:bg-white/10 text-white">Add</button>
        </div>
      </form>
    </div>
  );
}