import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";
import TaskList from "./TaskList";
import CompletedTasks from "./CompletedTasks";
import CustomTaskModal from "./CustomTaskModal";

export default function EditScorePanel() {
  const { selectedSchacht, setSelectedSchacht, fetchSchachten, completeTask, fetchTasks, fetchCompletions, createCustomTask, removeCompletion } = useAppContext();
  const [tasks, setTasks] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);

  useEffect(() => {
    if (selectedSchacht) loadData();
    else {
      setTasks([]);
      setCompletions([]);
    }
  }, [selectedSchacht]);

  const loadData = async () => {
    if (!selectedSchacht) return;
    setLoading(true);
    const [t, c] = await Promise.all([
      fetchTasks(selectedSchacht._id),
      fetchCompletions(selectedSchacht._id)
    ]);
    setTasks(t);
    setCompletions(c);
    setLoading(false);
  };

  const handleTaskClick = async (task) => {
    try {
      await completeTask(selectedSchacht._id, task._id);
      await loadData();
      const updated = await fetchSchachten();
      setSelectedSchacht(updated.find(s => s._id === selectedSchacht._id));
    } catch (err) {
      toast.error("Error completing task");
    }
  };

  const handleCustomSubmit = async (payload) => {
    try {
      await createCustomTask(selectedSchacht._id, payload);
      setShowCustomModal(false);
      await loadData();
      const updated = await fetchSchachten();
      setSelectedSchacht(updated.find(s => s._id === selectedSchacht._id));
    } catch (err) {}
  };

  const handleRemoveCompletion = async (completionId) => {
    if (!window.confirm("Remove this completed task?")) return;
    try {
      await removeCompletion(completionId);
      await loadData();
      const updated = await fetchSchachten();
      setSelectedSchacht(updated.find(s => s._id === selectedSchacht._id));
    } catch (err) {
      console.error(err);
      toast.error("Error removing completion");
    }
  };

  if (!selectedSchacht) return <div className="text-white/50 p-4 italic">Select a schacht to edit points</div>;
  if (loading) return <div className="text-white/60 p-4">Loading...</div>;

  const filteredTasks = tasks.filter((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="w-full h-full rounded-lg border border-white/10 shadow-2xl backdrop-blur-md bg-black/35 flex flex-col">
      <div className="p-4 flex justify-between items-center border-b border-white/10">
        <div>
          <h2 className="text-white/90 font-semibold">{selectedSchacht.name}</h2>
          <p className="text-white/60">Current Points: {selectedSchacht.points}</p>
        </div>
        <button onClick={() => {/* delete schacht logic */}} className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white">Delete</button>
      </div>

      <input
        type="text"
        placeholder="Search available tasks..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-2 py-1 text-white placeholder-white/50 rounded bg-white/6"
      />

      <div className="flex gap-4 flex-1 overflow-hidden p-4">
        <TaskList tasks={filteredTasks} completions={completions} onTaskClick={handleTaskClick} onOpenCustom={() => setShowCustomModal(true)} />
        <CompletedTasks tasks={tasks} completions={completions} onRemove={handleRemoveCompletion} />
      </div>

      {showCustomModal && <CustomTaskModal schacht={selectedSchacht} onSubmit={handleCustomSubmit} onClose={() => setShowCustomModal(false)} />}
    </div>
  );
}
