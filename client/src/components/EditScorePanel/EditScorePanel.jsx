import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";

export default function EditScorePanel() {
  const { selectedSchacht, fetchSchachten, completeTask, setSelectedSchacht } = useAppContext();
  const [tasks, setTasks] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Custom task modal state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPoints, setCustomPoints] = useState(0);
  const [repeatType, setRepeatType] = useState("once"); // once | repeatable | weekly

  useEffect(() => {
    if (selectedSchacht) loadData();
    else {
      setTasks([]);
      setCompletions([]);
    }
  }, [selectedSchacht]);

  const loadData = async () => {
    try {
      setLoading(true);
      const tasksUrl = `http://localhost:4000/api/tasks${
        selectedSchacht ? `?schachtId=${selectedSchacht._id}` : ""
      }`;
      const [tasksRes, completionsRes] = await Promise.all([
        axios.get(tasksUrl),
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

  const canCompleteTask = (task) => {
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

  const handleTaskSelect = async (task) => {
    const { allowed, reason } = canCompleteTask(task);
    if (!allowed) return toast.error(reason);

    try {
      if (completeTask) {
        await completeTask(selectedSchacht._id, task._id);
      } else {
        await axios.post("http://localhost:4000/api/completions", {
          schachtId: selectedSchacht._id,
          taskId: task._id,
        });
      }
      await loadData();
      if (fetchSchachten) {
        const updated = await fetchSchachten();
        if (updated && setSelectedSchacht) {
          const updatedSch = updated.find((s) => s._id === selectedSchacht._id);
          if (updatedSch) setSelectedSchacht(updatedSch);
        }
      }
    } catch (err) {
      console.error("Error completing task:", err);
      toast.error("Error completing task");
    }
  };

  const openCustomModal = () => {
    setCustomName("");
    setCustomPoints(0);
    setRepeatType("once");
    setShowCustomModal(true);
  };

  const submitCustomTask = async (e) => {
    e.preventDefault();
    if (!customName.trim()) return toast.error("Enter a name");
    if (isNaN(customPoints)) return toast.error("Points must be a number");

    const { repeatable, interval } =
      repeatType === "once"
        ? { repeatable: false, interval: "none" }
        : repeatType === "repeatable"
        ? { repeatable: true, interval: "none" }
        : { repeatable: true, interval: "weekly" };

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:4000/api/custom-tasks", {
        schachtId: selectedSchacht._id,
        name: customName.trim(),
        points: Number(customPoints),
        repeatable,
        interval,
      });

      toast.success("Custom task created and marked completed");

      await loadData();
      if (fetchSchachten) {
        const updated = await fetchSchachten();
        if (updated && setSelectedSchacht) {
          const updatedSch = updated.find((s) => s._id === selectedSchacht._id);
          if (updatedSch) setSelectedSchacht(updatedSch);
        }
      }

      setShowCustomModal(false);
    } catch (err) {
      console.error("Error creating custom task:", err);
      toast.error("Error creating custom task");
    } finally {
      setLoading(false);
    }
  };

  const deleteSchacht = async () => {
    if (!selectedSchacht) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedSchacht.name}?`)) return;

    try {
      await axios.delete(`http://localhost:4000/api/schachten/${selectedSchacht._id}`);
      toast.success(`${selectedSchacht.name} deleted`);
      if (fetchSchachten) await fetchSchachten();
    } catch (err) {
      console.error(err);
      toast.error("Error deleting schacht");
    }
  };

  const handleRemoveCompletion = async (completionId) => {
    if (!window.confirm("Remove this completed task?")) return;
    try {
      await axios.delete(`http://localhost:4000/api/completions/${completionId}`);
      toast.success("Completion removed");
      if (fetchSchachten) {
        const updatedSchachten = await fetchSchachten();
        const updatedSchacht = updatedSchachten.find((s) => s._id === selectedSchacht._id);
        if (updatedSchacht) setSelectedSchacht(updatedSchacht);
      }
      loadData();
    } catch (err) {
      console.error("Error removing completion:", err);
      toast.error("Error removing completion");
    }
  };

  if (!selectedSchacht)
    return (
      <div className="w-full h-full rounded-lg border border-white/10 shadow-2xl backdrop-blur-md bg-black/35 flex items-center justify-center">
        <div className="text-white/50 text-sm italic">
          Select a schacht to edit points
        </div>
      </div>
    );

  if (loading) return <div className="text-white/60 p-4">Loading...</div>;

  const filteredTasks = tasks.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full rounded-lg border border-white/10 shadow-2xl backdrop-blur-md bg-black/35 flex flex-col">
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-white/90">
            {selectedSchacht.name}
          </h2>
          <p className="text-white/60">Current Points: {selectedSchacht.points}</p>
        </div>
        <button
          onClick={deleteSchacht}
          className="px-3 py-1 text-sm rounded bg-red-600 hover:bg-red-700 text-white"
        >
          Delete
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
        <input
          type="text"
          placeholder="Search available tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-2 py-1 rounded bg-white/6 text-white placeholder:text-white/50 text-sm"
        />

        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* Available Tasks */}
          <div className="flex flex-col flex-1 overflow-auto custom-scrollbar">
            <h3 className="text-white/80 font-medium mb-2">Available Tasks</h3>
            <div className="space-y-2">
              {/* Create custom task button */}
              <button
                onClick={openCustomModal}
                className="w-full p-2 text-left rounded transition-colors bg-gradient-to-r from-white/4 to-white/2 hover:from-white/6"
              >
                <div className="text-white/90 font-semibold">+ Create custom task</div>
                <div className="text-sm text-white/60">
                  Create a schacht-specific task and mark it completed
                </div>
              </button>

              {filteredTasks.map((task) => {
                const { allowed, reason } = canCompleteTask(task);
                return (
                  <button
                    key={task._id}
                    onClick={() => handleTaskSelect(task)}
                    disabled={!allowed}
                    title={!allowed ? reason : ""}
                    className={`w-full p-2 text-left rounded transition-colors ${
                      allowed
                        ? "bg-white/5 hover:bg-white/10"
                        : "bg-white/10 text-white/50 line-through"
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
                      {task.ownerSchachtId && (
                        <span className="ml-2 text-xs text-yellow-300">(custom)</span>
                      )}
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
                const grouped = completions.reduce((acc, completion) => {
                  const task = tasks.find((t) => t._id === completion.taskId);
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
                        <div className="text-white/60 font-medium">
                          {completions.length}x
                        </div>
                      )}
                      <button
                        onClick={() => handleRemoveCompletion(completions[0]._id)}
                        className="text-red-600 font-bold text-2xl hover:text-red-800 transition"
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

      {/* Custom Task Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCustomModal(false)}
          />
          <form
            onSubmit={submitCustomTask}
            className="relative z-10 w-full max-w-md p-6 bg-[#0b0b0c] border border-white/10 rounded-lg"
          >
            <h3 className="text-lg font-semibold text-white/90 mb-3">
              Create custom task for {selectedSchacht.name}
            </h3>

            <label className="block mb-2 text-sm text-white/70">Name</label>
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded bg-white/5 text-white"
              placeholder="e.g. 'Helped with clean-up'"
              required
            />

            <label className="block mb-2 text-sm text-white/70">Points</label>
            <input
              type="number"
              value={customPoints}
              onChange={(e) => setCustomPoints(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded bg-white/5 text-white"
              required
            />

            <label className="block mb-2 text-sm text-white/70">Repeat type</label>
            <select
              value={repeatType}
              onChange={(e) => setRepeatType(e.target.value)}
              className="w-full mb-4 px-3 py-2 rounded bg-white/5 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-white/20"
              style={{
                colorScheme: "dark",
                backgroundColor: "rgba(255,255,255,0.05)",
              }}
            >
              <option value="once" className="text-black bg-white">
                Once only
              </option>
              <option value="repeatable" className="text-black bg-white">
                Repeatable anytime
              </option>
              <option value="weekly" className="text-black bg-white">
                Weekly repeatable
              </option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-3 py-1 rounded bg-white/6"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white"
              >
                Create & Complete
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
