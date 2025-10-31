import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import AddSchachtModal from './AddSchachtModal';

export default function Leaderboard() {
  const { schachten, addSchacht, setSelectedSchacht } = useAppContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);

  const baseRowClass = "transition-colors border-t border-white/5";
  const zebra = "even:bg-white/[0.02]";

  const medalStyle = (pos) => {
    if (pos === 1)
      return { background: 'linear-gradient(90deg, rgba(255,215,0,0.14), rgba(255,215,0,0.06))' };
    if (pos === 2)
      return { background: 'linear-gradient(90deg, rgba(192,192,192,0.14), rgba(192,192,192,0.06))' };
    if (pos === 3)
      return { background: 'linear-gradient(90deg, rgba(205,127,50,0.14), rgba(205,127,50,0.06))' };
    return {};
  };

  const handleAdd = async (name) => {
    if (!name || !name.trim()) return;
    setLoadingAdd(true);
    try {
      await addSchacht(name.trim());
      setModalOpen(false);
    } finally {
      setLoadingAdd(false);
    }
  };

  return (
    <div className="w-full h-full bg-transparent p-0 flex">
      <div className="flex-1">
        <div className="w-full h-full rounded-lg border border-white/10 shadow-2xl backdrop-blur-md bg-black/35 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-lg font-semibold text-white/95">Leaderboard</h2>
            <button
              onClick={() => setModalOpen(true)}
              className="text-sm text-white/95 bg-white/6 hover:bg-white/10 px-3 py-1 rounded"
            >
              Add Schacht
            </button>
          </div>

          <div className="px-4 pb-4 flex-1 flex flex-col overflow-hidden">
            <table className="leaderboard-table w-full table-fixed border-collapse text-sm h-full">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 sticky top-0 backdrop-blur-sm bg-black/45 text-xs text-white/90 uppercase tracking-wide" style={{ width: 48 }}>#</th>
                  <th className="text-left px-4 py-3 sticky top-0 backdrop-blur-sm bg-black/45 text-xs text-white/90 uppercase tracking-wide">Name</th>
                  <th className="text-right px-4 py-3 sticky top-0 backdrop-blur-sm bg-black/45 text-xs text-white/90 uppercase tracking-wide" style={{ width: 96 }}>Points</th>
                </tr>
              </thead>

              <tbody className="custom-scrollbar">
                {schachten.map((player, idx) => (
                  <tr
                    key={player._id}
                    style={medalStyle(idx + 1)}
                    className={`${baseRowClass} ${zebra} hover:bg-white/6 cursor-pointer text-white/70 hover:text-white font-medium`}
                    onClick={() => setSelectedSchacht(player)}
                  >
                    <td className="px-4 py-3 w-12">{idx + 1}</td>
                    <td className="px-4 py-3">{player.name}</td>
                    <td className="px-4 py-3 text-right font-medium" style={{ width: 96 }}>
                      {player.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddSchachtModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAdd}
        loading={loadingAdd}
      />
    </div>
  );
}
