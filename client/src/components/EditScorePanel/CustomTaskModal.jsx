import React, { useState } from "react";

const MODAL_BACKDROP_CLASSES = "absolute inset-0 bg-black/50";
const MODAL_FORM_CLASSES = "relative z-10 w-full max-w-md p-6 bg-[#0b0b0c] border border-white/10 rounded-lg";
const INPUT_CLASSES = "w-full mb-3 px-3 py-2 rounded bg-white/5 text-white";
const SELECT_CLASSES = "w-full mb-4 px-3 py-2 rounded bg-white/5 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-white/20";

const createTaskPayload = (name, points, repeatType) => {
  const basePayload = { name, points: Number(points) };
  
  switch (repeatType) {
    case "once":
      return { ...basePayload, repeatable: false, interval: "none" };
    case "repeatable":
      return { ...basePayload, repeatable: true, interval: "none" };
    case "weekly":
      return { ...basePayload, repeatable: true, interval: "weekly" };
    default:
      return { ...basePayload, repeatable: false, interval: "none" };
  }
};

export default function CustomTaskModal({ schacht, onSubmit, onClose }) {
  const [name, setName] = useState("");
  const [points, setPoints] = useState(0);
  const [repeatType, setRepeatType] = useState("once");

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = createTaskPayload(name, points, repeatType);
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className={MODAL_BACKDROP_CLASSES} onClick={onClose} />
      
      <form onSubmit={handleSubmit} className={MODAL_FORM_CLASSES}>
        <h3 className="text-lg font-semibold text-white/90 mb-3">
          Maak aangepaste taak voor {schacht.name} {/* Create custom task for */}
        </h3>

        <label className="block mb-2 text-sm text-white/70">Naam</label> {/* Name */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={INPUT_CLASSES}
          placeholder="bijv. 'Hielp met opruimen'" // e.g. 'Helped with clean-up'
          required
        />

        <label className="block mb-2 text-sm text-white/70">Punten</label> {/* Points */}
        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          className={INPUT_CLASSES}
          required
        />

        <label className="block mb-2 text-sm text-white/70">Herhaaltype</label> {/* Repeat type */}
        <select
          value={repeatType}
          onChange={(e) => setRepeatType(e.target.value)}
          className={SELECT_CLASSES}
          style={{
            colorScheme: "dark",
            backgroundColor: "rgba(255,255,255,0.05)",
          }}
        >
          <option value="once" className="text-black bg-white">
            Eenmalig {/* Once only */}
          </option>
          <option value="repeatable" className="text-black bg-white">
            Herhaalbaar op elk moment {/* Repeatable anytime */}
          </option>
          <option value="weekly" className="text-black bg-white">
            Wekelijks herhaalbaar {/* Weekly repeatable */}
          </option>
        </select>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-white/6"
          >
            Annuleren {/* Cancel */}
          </button>
          <button
            type="submit"
            className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white"
          >
            Maak & Voltooi {/* Create & Complete */}
          </button>
        </div>
      </form>
    </div>
  );
}
