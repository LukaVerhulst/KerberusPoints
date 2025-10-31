/**
 * Check if a task has been completed by the current schacht
 */
export const isTaskCompleted = (task, completions) => {
  return completions.some((completion) => completion.taskId === task._id);
};

/**
 * Get the display type string for a task
 */
export const getTaskTypeString = (task) => {
  if (!task.repeatable) return "Eenmalig"; // Once only
  if (task.interval === "weekly") return "Wekelijks"; // Weekly
  return "Herhaalbaar"; // Repeatable
};

/**
 * Check if a task can be completed
 * - One-time tasks can only be completed once
 * - Weekly and repeatable tasks can be completed multiple times
 */
export const canCompleteTask = (task, completions) => {
  // If it's a one-time task and already completed, block it
  if (!task.repeatable) {
    const completed = isTaskCompleted(task, completions);
    return {
      allowed: !completed,
      reason: completed ? "Deze taak kan maar één keer worden voltooid" : "" // This task can only be completed once
    };
  }
  
  // Weekly and repeatable tasks can always be completed
  return { allowed: true, reason: "" };
};
