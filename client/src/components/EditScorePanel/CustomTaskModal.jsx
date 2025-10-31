import React, { useState } from "react";

export default function CustomTaskModal({ schacht, onSubmit, onClose }) {
  const [name, setName] = useState("");
  const [points, setPoints] = useState(0);
  const [repeatType, setRepeatType] = useState("once");

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload =
      repeatType === "once"
        ? { name, points: Number(points), repeatable: false, interval: "none" }
        : repeatType === "repeatable"
        ? { name, points: Number(points), repeatable: true, interval: "none" }
        : { name, points: Number(points), repeatable: true, interval: "weekly" };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md p-6 bg-[#0b0b0c] border border-white/10 rounded-lg"
      >
        <h3 className="text-lg font-semibold text-white/90 mb-3">
          Create custom task for {schacht.name}
        </h3>

        <label className="block mb-2 text-sm text-white/70">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded bg-white/5 text-white"
          placeholder="e.g. 'Helped with clean-up'"
          required
        />

        <label className="block mb-2 text-sm text-white/70">Points</label>
        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded bg-white/5 text-white"
          required
        />

        <label className="block mb-2 text-sm text-white/70">Repeat type</label>
        <select
          value={repeatType}
          onChange={(e) => setRepeatType(e.target.value)}
          className="w-full mb-4 px-3 py-2 rounded bg-white/5 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-white/20"
          style={{
            colorScheme: "dark",
            backgroundColor: "rgba(255,255,255,0.05)",
          }}
        >
          <option value="once" className="text-black bg-white">
            Once only
          </option>
          <option value="repeatable" className="text-black bg-white">
            Repeatable anytime
          </option>
          <option value="weekly" className="text-black bg-white">
            Weekly repeatable
          </option>
        </select>


        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1 rounded bg-white/6">
            Cancel
          </button>
          <button type="submit" className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white">
            Create & Complete
          </button>
        </div>
      </form>
    </div>
  );
}
