import React from "react";

export default function CompletedTasks({ tasks, completions, onRemove, deletingIds }) {
  const grouped = completions.reduce((acc, completion) => {
    const task = tasks.find((t) => t._id === completion.taskId);
    if (!task) return acc;
    if (!acc[task._id]) acc[task._id] = { task, completions: [] };
    acc[task._id].completions.push(completion);
    return acc;
  }, {});

  return (
    <div className="flex flex-col flex-1 overflow-auto custom-scrollbar">
      <h3 className="text-white/80 font-medium mb-2">Voltooide Taken</h3>
      <div className="space-y-2">
        {Object.values(grouped).map(({ task, completions }) => (
          <div
            key={task._id}
            className="p-2 rounded bg-white/5 flex justify-between items-center"
          >
            <div className="text-white/90">{task.name}</div>
            <div className="flex items-center gap-2">
              {completions.length > 1 && (
                <div className="text-white/60 font-medium">{completions.length}x</div>
              )}
              <button
                onClick={() => onRemove(completions[0]._id)}
                disabled={deletingIds.includes(completions[0]._id)}
                className="text-red-600 font-bold text-2xl hover:text-red-800 transition"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

