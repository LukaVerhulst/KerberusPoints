import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";
import { canCompleteTask } from "./taskUtils";
import TaskList from "./TaskList";
import CompletedTasks from "./CompletedTasks";
import CustomTaskModal from "./CustomTaskModal";

const PANEL_CLASSES = "w-full h-full rounded-lg border border-white/10 shadow-2xl backdrop-blur-md bg-black/35 flex flex-col";
const EMPTY_STATE_CLASSES = "w-full h-full rounded-lg border border-white/10 shadow-2xl backdrop-blur-md bg-black/35 flex flex-col justify-center items-center";

export default function EditScorePanel() {
  // Context hooks
  const {
    selectedSchacht,
    setSelectedSchacht,
    fetchSchachten,
    completeTask,
    fetchTasks,
    fetchCompletions,
    createCustomTask,
    removeCompletion,
    deleteCustomTask,
    deleteSchacht
  } = useAppContext();

  // Local state
  const [tasks, setTasks] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Load tasks and completions for selected schacht
  const loadData = useCallback(async () => {
    if (!selectedSchacht) return;
    
    try {
      const [fetchedTasks, fetchedCompletions] = await Promise.all([
        fetchTasks(selectedSchacht._id),
        fetchCompletions(selectedSchacht._id)
      ]);
      setTasks(fetchedTasks);
      setCompletions(fetchedCompletions);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, [selectedSchacht, fetchTasks, fetchCompletions]);

  // Reload data and update selected schacht
  const refreshSchachtData = useCallback(async () => {
    await loadData();
    const updatedSchachten = await fetchSchachten();
    const updatedSchacht = updatedSchachten.find(
      (s) => s._id === selectedSchacht?._id
    );
    if (updatedSchacht) {
      setSelectedSchacht(updatedSchacht);
    }
  }, [selectedSchacht?._id, loadData, fetchSchachten, setSelectedSchacht]);

  // Effect: Load data when schacht selection changes
  useEffect(() => {
    if (selectedSchacht) {
      loadData();
    } else {
      setTasks([]);
      setCompletions([]);
    }
  }, [selectedSchacht, loadData]);

  // Handlers
  const handleTaskClick = useCallback((task) => {
    if (!selectedSchacht) return;
  
    const { allowed, reason } = canCompleteTask(task, completions);
    if (!allowed) {
      toast.error(reason || "Deze taak kan niet worden voltooid");
      return;
    }
  
    // Optimistic UI update
    setCompletions(prev => [...prev, { ...task, _id: `temp-${task._id}` }]);
  
    // Fire-and-forget backend request
    completeTask(selectedSchacht._id, task._id).catch(error => {
      console.error("Error completing task:", error);
      toast.error("Fout bij voltooien van taak");
  
      // Revert optimistic update if it fails
      setCompletions(prev => prev.filter(c => c._id !== `temp-${task._id}`));
    });
  }, [selectedSchacht, completions, completeTask]);

  const handleCustomSubmit = useCallback(async (payload) => {
    if (!selectedSchacht) return;
    
    try {
      await createCustomTask(selectedSchacht._id, payload);
      setShowCustomModal(false);
      await refreshSchachtData();
    } catch (error) {
      console.error("Error creating custom task:", error);
      toast.error("Fout bij aanmaken van aangepaste taak"); // Error creating custom task
    }
  }, [selectedSchacht, createCustomTask, refreshSchachtData]);

  const handleRemoveCompletion = useCallback(async (completionId) => {
    if (!window.confirm("Deze voltooide taak verwijderen?")) return; // Remove this completed task?
    
    try {
      await removeCompletion(completionId);
      await refreshSchachtData();
    } catch (error) {
      console.error("Error removing completion:", error);
      toast.error("Fout bij verwijderen van voltooiing"); // Error removing completion
    }
  }, [removeCompletion, refreshSchachtData]);

  const handleDeleteCustom = useCallback(async (taskId) => {
    try {
      const result = await deleteCustomTask(taskId);
      if (result) {
        setTasks(result.tasks);
        setCompletions(result.completions);
      }
    } catch (error) {
      console.error("Error deleting custom task:", error);
    }
  }, [deleteCustomTask]);

  const handleDeleteSchacht = useCallback(async () => {
    if (!selectedSchacht) return;
    
    const confirmed = window.confirm(
      `Weet u zeker dat u "${selectedSchacht.name}" wilt verwijderen? ` + // Are you sure you want to delete
      "Dit zal ook alle bijbehorende taakvoltooiingen verwijderen." // This will also delete all associated task completions
    );
    
    if (!confirmed) return;
    
    try {
      await deleteSchacht(selectedSchacht._id);
    } catch (error) {
      console.error("Error deleting schacht:", error);
      // Error toast is handled in the context function
    }
  }, [selectedSchacht, deleteSchacht]);

  // Filter tasks by search term
  const filteredTasks = tasks.filter((task) =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Empty state
  if (!selectedSchacht) {
    return (
      <div className={EMPTY_STATE_CLASSES}>
        <div className="text-white/50 p-4 italic">
          Selecteer een schacht om punten te bewerken {/* Select a schacht to edit points */}
        </div>
      </div>
    );
  }

  return (
    <div className={PANEL_CLASSES}>
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-white/10">
        <div>
          <h2 className="text-white/90 font-semibold">{selectedSchacht.name}</h2>
          <p className="text-white/60">Huidige Punten: {selectedSchacht.points}</p> {/* Current Points */}
        </div>
        <button
          onClick={handleDeleteSchacht}
          className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white"
        >
          Verwijderen {/* Delete */}
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Zoek beschikbare taken..." // Search available tasks...
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-2 py-1 text-white placeholder-white/50 rounded bg-white/6"
      />

      {/* Task Lists */}
      <div className="flex gap-4 flex-1 overflow-hidden p-4">
        <TaskList
          tasks={filteredTasks}
          completions={completions}
          onTaskClick={handleTaskClick}
          onOpenCustom={() => setShowCustomModal(true)}
          onDeleteCustom={handleDeleteCustom}
        />
        <CompletedTasks
          tasks={tasks}
          completions={completions}
          onRemove={handleRemoveCompletion}
        />
      </div>

      {/* Custom Task Modal */}
      {showCustomModal && (
        <CustomTaskModal
          schacht={selectedSchacht}
          onSubmit={handleCustomSubmit}
          onClose={() => setShowCustomModal(false)}
        />
      )}
    </div>
  );
}
