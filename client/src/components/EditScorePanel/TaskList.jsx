import React from "react";
import { isTaskCompleted, getTaskTypeString, canCompleteTask } from "./taskUtils";

const BUTTON_BASE_CLASSES =
  "w-full p-2 text-left rounded transition-colors bg-linear-to-r from-white/4 to-white/2 hover:bg-white/10";
const TASK_ITEM_CLASSES =
  "relative flex items-center justify-between p-2 rounded transition-colors bg-linear-to-r from-white/4 to-white/2 hover:bg-white/10";
const DELETE_BUTTON_CLASSES =
  "text-red-600 font-bold text-2xl hover:text-red-800 transition ml-2";

export default function TaskList({ tasks, completions, onTaskClick, onOpenCustom, onDeleteCustom }) {
  return (
    <div className="flex flex-col flex-1 overflow-auto custom-scrollbar">
      <h3 className="text-white/80 font-medium mb-2">Beschikbare Taken</h3>
      <div className="space-y-2">
        <button
          onClick={onOpenCustom}
          className={`${BUTTON_BASE_CLASSES} border-2 border-white/25`}
        >
          <div className="text-white/90 font-semibold">+ Maak aangepaste taak</div>
          <div className="text-sm text-white/60">
            Maak een schacht-specifieke taak en markeer deze als voltooid
          </div>
        </button>

        <div className="w-[25%] h-px bg-gray-400/60 mx-auto" />

        {tasks.map((task) => {
          const completed = isTaskCompleted(task, completions);
          const isOneTimeTask = !task.repeatable;
          const showStrikethrough = isOneTimeTask && completed;
          const taskTypeString = getTaskTypeString(task);
          const { allowed, reason } = canCompleteTask(task, completions);

          return (
            <div key={task._id} className={TASK_ITEM_CLASSES}>
              <button
                onClick={() => onTaskClick(task)}
                disabled={!allowed}
                title={reason}
                className={`text-left flex-1 ${!allowed ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <div className={`text-white/90 ${showStrikethrough ? "line-through opacity-60" : ""}`}>
                  {task.name}
                </div>
                <div className="text-sm text-white/60">
                  {task.points} punten • {taskTypeString}
                  {task.ownerSchachtId && (
                    <span className="ml-2 text-xs text-yellow-300">(aangepast)</span>
                  )}
                </div>
              </button>

              {task.ownerSchachtId && (
                <button
                  onClick={() => onDeleteCustom(task)}
                  className={DELETE_BUTTON_CLASSES}
                  aria-label="Verwijder aangepaste taak"
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
