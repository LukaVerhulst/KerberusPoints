export const canCompleteTask = (task, completions) => {
  const completed = completions
    .filter((c) => c.taskId === task._id)
    .map((c) => new Date(c.completedAt));

  if (!task.repeatable) {
    return { allowed: completed.length === 0, reason: "This task cannot be repeated" };
  }

  if (task.interval === "weekly") {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const doneThisWeek = completed.some((d) => d >= weekStart && d <= weekEnd);
    return { allowed: !doneThisWeek, reason: doneThisWeek ? "Already done this week" : "" };
  }

  return { allowed: true, reason: "" };
};
