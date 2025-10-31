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
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
            <h2 className="text-lg font-semibold text-white/95">Leaderboard</h2>
            <button
              onClick={() => setModalOpen(true)}
              className="text-sm text-white/95 bg-white/6 hover:bg-white/10 px-3 py-1 rounded"
            >
              Schacht toevoegen {/* Add Schacht */}
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden"> {/* Changed this line */}
            <div className="h-full overflow-auto"> {/* Added this wrapper */}
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-3 sticky top-0 backdrop-blur-sm bg-black/45 text-xs text-white/90 uppercase tracking-wide w-12">#</th>
                    <th className="text-left px-4 py-3 sticky top-0 backdrop-blur-sm bg-black/45 text-xs text-white/90 uppercase tracking-wide min-w-0"> {/* Changed this */}
                      <span className="truncate block">Naam</span> {/* Name */}
                    </th>
                    <th className="text-right px-4 py-3 sticky top-0 backdrop-blur-sm bg-black/45 text-xs text-white/90 uppercase tracking-wide w-24">Punten</th> {/* Points */}
                  </tr>
                </thead>

                <tbody>
                  {schachten.map((player, idx) => (
                    <tr
                      key={player._id}
                      style={medalStyle(idx + 1)}
                      className={`${baseRowClass} ${zebra} hover:bg-white/6 cursor-pointer text-white/70 hover:text-white font-medium`}
                      onClick={() => setSelectedSchacht(player)}
                    >
                      <td className="px-4 py-3 w-12">{idx + 1}</td>
                      <td className="px-4 py-3 min-w-0"> {/* Changed this */}
                        <span className="truncate block">{player.name}</span> {/* Added truncate */}
                      </td>
                      <td className="px-4 py-3 text-right font-medium w-24"> {/* Changed width */}
                        {player.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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