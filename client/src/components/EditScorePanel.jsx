import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

export default function EditScorePanel() {
  const { selectedSchacht, fetchSchachten, completeTask, setSelectedSchacht } = useAppContext();
  const [tasks, setTasks] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (selectedSchacht) loadData();
  }, [selectedSchacht]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksRes, completionsRes] = await Promise.all([
        axios.get("http://localhost:4000/api/tasks"),
        axios.get(`http://localhost:4000/api/completions/${selectedSchacht._id}`),
      ]);
      setTasks(tasksRes.data || []);
      setCompletions(completionsRes.data || []);
    } catch (err) {
      console.error("Error loading data:", err);
      toast.error("Error loading tasks");
    } finally {
      setLoading(false);
    }
  };

  // Task availability logic
  const canCompleteTask = (task) => {
    const completed = completions
      .filter(c => c.taskId === task._id)
      .map(c => new Date(c.completedAt));

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

      const doneThisWeek = completed.some(date => date >= weekStart && date <= weekEnd);
      return { allowed: !doneThisWeek, reason: doneThisWeek ? "Already done this week" : "" };
    }

    return { allowed: true, reason: "" };
  };

  const handleTaskSelect = async (task) => {
    const { allowed, reason } = canCompleteTask(task);
    if (!allowed) return toast.error(reason);

    await completeTask(selectedSchacht._id, task._id);
    loadData();
  };

  // DELETE SCHACHT
  const deleteSchacht = async () => {
    if (!selectedSchacht) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedSchacht.name}?`)) return;

    try {
      await axios.delete(`http://localhost:4000/api/schachten/${selectedSchacht._id}`);
      toast.success(`${selectedSchacht.name} deleted`);
      fetchSchachten();
    } catch (err) {
      console.error(err);
      toast.error("Error deleting schacht");
    }
  };

  const handleRemoveCompletion = async (completionId) => {
    if (!window.confirm("Are you sure you want to remove this completed task?")) return;
  
    try {
      await axios.delete(`http://localhost:4000/api/completions/${completionId}`);
      toast.success("Completion removed");
  
      // Refresh leaderboard and update selectedSchacht points
      const updatedSchachten = await fetchSchachten(); // make fetchSchachten return data
      const updatedSchacht = updatedSchachten.find(s => s._id === selectedSchacht._id);
      setSelectedSchacht(updatedSchacht); // <-- update points
      loadData(); // refresh tasks/completions
    } catch (err) {
      console.error("Error removing completion:", err);
      toast.error("Error removing completion");
    }
  };


  if (!selectedSchacht)
    return (
      <div className="w-full h-full rounded-lg border border-white/10 shadow-2xl backdrop-blur-md bg-black/35 flex items-center justify-center">
        <div className="text-white/50 text-sm italic">Select a schacht to edit points</div>
      </div>
    );

  if (loading) return <div className="text-white/60 p-4">Loading...</div>;

  // Filter tasks based on search
  const filteredTasks = tasks.filter(task =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full rounded-lg border border-white/10 shadow-2xl backdrop-blur-md bg-black/35 flex flex-col">
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-white/90">{selectedSchacht.name}</h2>
          <p className="text-white/60">Current Points: {selectedSchacht.points}</p>
        </div>
        <button
          onClick={deleteSchacht}
          className="px-3 py-1 text-sm rounded bg-red-600 hover:bg-red-700 text-white"
          title="Delete Schacht"
        >
          Delete
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
        {/* Search bar */}
        <input
          type="text"
          placeholder="Search available tasks..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-2 py-1 rounded bg-white/6 text-white placeholder:text-white/50 text-sm"
        />

        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* Available Tasks */}
          <div className="flex flex-col flex-1 overflow-auto custom-scrollbar">
            <h3 className="text-white/80 font-medium mb-2">Available Tasks</h3>
            <div className="space-y-2">
              {filteredTasks.map((task) => {
                const { allowed, reason } = canCompleteTask(task);
                return (
                  <button
                    key={task._id}
                    onClick={() => handleTaskSelect(task)}
                    disabled={!allowed}
                    title={!allowed ? reason : ""}
                    className={`w-full p-2 text-left rounded transition-colors ${
                      allowed ? "bg-white/5 hover:bg-white/10" : "bg-white/10 text-white/50 line-through"
                    }`}
                  >
                    <div className="text-white/90">{task.name}</div>
                    <div className="text-sm text-white/60">
                      {task.points} points • {task.repeatable ? (task.interval === "none" ? "Repeatable" : `Every ${task.interval}`) : "Once only"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="flex flex-col flex-1 overflow-auto custom-scrollbar">
            <h3 className="text-white/80 font-medium mb-2">Completed Tasks</h3>
            <div className="space-y-2">
              {(() => {
                // Group completions by taskId
                const grouped = completions.reduce((acc, completion) => {
                  const task = tasks.find(t => t._id === completion.taskId);
                  if (!task) return acc;

                  if (!acc[task._id]) acc[task._id] = { task, completions: [] };
                  acc[task._id].completions.push(completion);
                  return acc;
                }, {});

                return Object.values(grouped).map(({ task, completions }) => (
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
                        onClick={() => handleRemoveCompletion(completions[0]._id)}
                        className="text-red-600 font-bold text-2xl hover:text-red-800 transition"
                        title="Remove completion"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
