import React from "react";
import { canCompleteTask, isTaskCompleted } from "./taskUtils";

export default function TaskList({ tasks, completions, onTaskClick, onOpenCustom, onDeleteCustom }) {
  return (
    <div className="flex flex-col flex-1 overflow-auto custom-scrollbar">
      <h3 className="text-white/80 font-medium mb-2">Available Tasks</h3>
      <div className="space-y-2">
        <button
          onClick={onOpenCustom}
          className="w-full p-2 text-left rounded transition-colors bg-linear-to-r from-white/4 to-white/2 hover:bg-white/10 border-2 border-white/25"
        >
          <div className="text-white/90 font-semibold">+ Create custom task</div>
          <div className="text-sm text-white/60">
            Create a schacht-specific task and mark it completed
          </div>
        </button>

        <div className="w-[25%] h-px bg-gray-400/60 mx-auto" />
        {tasks.map((task) => {
          const { allowed } = canCompleteTask(task, completions);
          const completed = isTaskCompleted(task, completions);
          const isOneTimeTask = !task.repeatable;
          const showStrikethrough = isOneTimeTask && completed;
          
          return (
            <div
              key={task._id}
              className="relative flex items-center justify-between p-2 rounded transition-colors bg-linear-to-r from-white/4 to-white/2 hover:bg-white/10"
            >
              {/* Task info */}
              <button
                onClick={() => onTaskClick(task)}
                disabled={!allowed}
                className="text-left flex-1"
              >
                <div className={`text-white/90 ${showStrikethrough ? 'line-through opacity-60' : ''}`}>
                  {task.name}
                </div>
                <div className="text-sm text-white/60">
                  {task.points} points •{" "}
                  {!task.repeatable
                    ? "Once only"
                    : task.interval === "weekly"
                    ? "Weekly"
                    : "Repeatable"}
                  {task.ownerSchachtId && (
                    <span className="ml-2 text-xs text-yellow-300">(custom)</span>
                  )}
                </div>
              </button>
        
              {/* Delete button for custom tasks, same style as completed tasks */}
              {task.ownerSchachtId && (
                <button
                  onClick={() => onDeleteCustom(task._id)}
                  className="text-red-600 font-bold text-2xl hover:text-red-800 transition ml-2"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
