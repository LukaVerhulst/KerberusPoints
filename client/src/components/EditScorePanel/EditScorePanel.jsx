import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";
import { canCompleteTask } from "./taskUtils";
import TaskList from "./TaskList";
import CompletedTasks from "./CompletedTasks";
import CustomTaskModal from "./CustomTaskModal";
import ConfirmModal from "./ConfirmModal";

const PANEL_CLASSES =
  "w-full h-full rounded-lg border border-white/10 shadow-2xl backdrop-blur-md bg-black/35 flex flex-col";
const EMPTY_STATE_CLASSES =
  "w-full h-full rounded-lg border border-white/10 shadow-2xl backdrop-blur-md bg-black/35 flex flex-col justify-center items-center";

export default function EditScorePanel() {
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
    deleteSchacht,
  } = useAppContext();

  // Local state
  const [tasks, setTasks] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const [completionToDelete, setCompletionToDelete] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [schachtToDelete, setSchachtToDelete] = useState(null);

  // Load tasks and completions
  const loadData = useCallback(async () => {
    if (!selectedSchacht) return;
    try {
      const [fetchedTasks, fetchedCompletions] = await Promise.all([
        fetchTasks(selectedSchacht._id),
        fetchCompletions(selectedSchacht._id),
      ]);
      setTasks(fetchedTasks);
      setCompletions(fetchedCompletions);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, [selectedSchacht, fetchTasks, fetchCompletions]);

  // Refresh schacht data
  const refreshSchachtData = useCallback(async () => {
    await loadData();
    const updatedSchachten = await fetchSchachten();
    const updatedSchacht = updatedSchachten.find(
      (s) => s._id === selectedSchacht?._id
    );
    if (updatedSchacht) setSelectedSchacht(updatedSchacht);
  }, [selectedSchacht?._id, loadData, fetchSchachten, setSelectedSchacht]);

  useEffect(() => {
    if (selectedSchacht) {
      loadData();
    } else {
      setTasks([]);
      setCompletions([]);
    }
  }, [selectedSchacht, loadData]);

  // Task click handler
  const handleTaskClick = useCallback(
    (task) => {
      if (!selectedSchacht) return;
      const { allowed, reason } = canCompleteTask(task, completions);
      if (!allowed) {
        toast.error(reason || "Deze taak kan niet worden voltooid");
        return;
      }

      setCompletions((prev) => [...prev, { ...task, _id: `temp-${task._id}` }]);

      completeTask(selectedSchacht._id, task._id).catch((error) => {
        console.error("Error completing task:", error);
        toast.error("Fout bij voltooien van taak");
        setCompletions((prev) =>
          prev.filter((c) => c._id !== `temp-${task._id}`)
        );
      });
    },
    [selectedSchacht, completions, completeTask]
  );

  // Create custom task
  const handleCustomSubmit = useCallback(
    async (payload) => {
      if (!selectedSchacht) return;
      try {
        await createCustomTask(selectedSchacht._id, payload);
        setShowCustomModal(false);
        await refreshSchachtData();
      } catch (error) {
        console.error("Error creating custom task:", error);
        toast.error("Fout bij aanmaken van aangepaste taak");
      }
    },
    [selectedSchacht, createCustomTask, refreshSchachtData]
  );

  // Confirm modals handlers
  const handleConfirmRemoveCompletion = async () => {
    if (!completionToDelete) return;
    setModalLoading(true);
    try {
      await removeCompletion(completionToDelete._id);
      await refreshSchachtData();
      setCompletionToDelete(null);
    } catch (err) {
      console.error(err);
      toast.error("Fout bij verwijderen van voltooiing");
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;
    setModalLoading(true);
    try {
      await handleDeleteCustom(taskToDelete._id);
      setTaskToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDeleteSchacht = async () => {
    if (!schachtToDelete) return;
    setModalLoading(true);
    try {
      await deleteSchacht(schachtToDelete._id);
      setSchachtToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleRemoveCompletion = (completion) => {
    if (deletingIds.includes(completion._id)) return;
    setCompletionToDelete(completion);
  };

  const handleDeleteCustom = useCallback(
    async (taskId) => {
      try {
        await deleteCustomTask(taskId);
        await refreshSchachtData();
      } catch (error) {
        console.error("Error deleting custom task:", error);
      }
    },
    [deleteCustomTask, refreshSchachtData]
  );

  const handleDeleteSchachtClick = () => {
    if (!selectedSchacht) return;
    setSchachtToDelete(selectedSchacht);
  };

  const filteredTasks = tasks.filter((task) =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!selectedSchacht) {
    return (
      <div className={EMPTY_STATE_CLASSES}>
        <div className="text-white/50 p-4 italic">
          Selecteer een schacht om punten te bewerken
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
          <p className="text-white/60">
            Huidige Punten: {selectedSchacht.points}
          </p>
        </div>
        <button
          onClick={handleDeleteSchachtClick}
          className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white"
        >
          Verwijderen
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Zoek beschikbare taken..."
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
          onDeleteCustom={(task) => setTaskToDelete(task)}
        />
        <CompletedTasks
          tasks={tasks}
          completions={completions}
          onRemove={(completion) => handleRemoveCompletion(completion)}
          deletingIds={deletingIds}
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

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={!!completionToDelete}
        title="Voltooiing verwijderen"
        message={`Weet je zeker dat je deze voltooiing wilt verwijderen?`}
        onCancel={() => setCompletionToDelete(null)}
        onConfirm={handleConfirmRemoveCompletion}
        loading={modalLoading}
      />
      <ConfirmModal
        isOpen={!!taskToDelete}
        title="Aangepaste taak verwijderen"
        message={`Weet je zeker dat je "${taskToDelete?.name}" wilt verwijderen?`}
        onCancel={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDeleteTask}
        loading={modalLoading}
      />
      <ConfirmModal
        isOpen={!!schachtToDelete}
        title="Schacht verwijderen"
        message={`Weet je zeker dat je "${schachtToDelete?.name}" wilt verwijderen? Dit zal ook alle bijbehorende taakvoltooiingen verwijderen.`}
        onCancel={() => setSchachtToDelete(null)}
        onConfirm={handleConfirmDeleteSchacht}
        loading={modalLoading}
      />
    </div>
  );
}
