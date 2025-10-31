// Helper function to check if a task has been completed
export const isTaskCompleted = (task, completions) => {
  return completions.some((c) => c.taskId === task._id);
};

// All tasks can now be completed multiple times (weekly logic removed)
// This function is kept for compatibility but always returns allowed: true
export const canCompleteTask = (task, completions) => {
  // All tasks can be completed - no blocking logic
  return { allowed: true, reason: "" };
};
