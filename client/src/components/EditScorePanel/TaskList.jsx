import React from "react";
import { canCompleteTask } from "./taskUtils";

export default function TaskList({ tasks, completions, onTaskClick, onOpenCustom }) {
  return (
    <div className="flex flex-col flex-1 overflow-auto custom-scrollbar">
      <h3 className="text-white/80 font-medium mb-2">Available Tasks</h3>
      <div className="space-y-2">
        <button
          onClick={onOpenCustom}
          className="w-full p-2 text-left rounded transition-colors bg-linear-to-r from-white/4 to-white/2 hover:bg-white/10"
        >
          <div className="text-white/90 font-semibold">+ Create custom task</div>
          <div className="text-sm text-white/60">
            Create a schacht-specific task and mark it completed
          </div>
        </button>

        {tasks.map((task) => {
          const { allowed, reason } = canCompleteTask(task, completions);
          return (
            <button
              key={task._id}
              onClick={() => onTaskClick(task)}
              disabled={!allowed}
              title={!allowed ? reason : ""}
              className={`w-full p-2 text-left rounded transition-colors ${
                allowed ? "bg-white/5 hover:bg-white/10" : "bg-white/10 text-white/50 line-through"
              }`}
            >
              <div className="text-white/90">{task.name}</div>
              <div className="text-sm text-white/60">
                {task.points} points •{" "}
                {!task.repeatable
                  ? "Once only"
                  : task.interval === "weekly"
                  ? "Weekly"
                  : "Repeatable"}
                {task.ownerSchachtId && <span className="ml-2 text-xs text-yellow-300">(custom)</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
