import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [schachten, setSchachten] = useState([]);
  const [selectedSchacht, setSelectedSchacht] = useState(null);

  // 🔹 Fetch current user
  const fetchUser = async () => {
    try {
      const res = await axios.get("/api/auth/me", { withCredentials: true });
      const user = res.data?.user || null;
      setUser(user);
      setIsAuthenticated(!!user);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // 🔹 Auth functions
  const login = async (email, password) => {
    try {
      const res = await axios.post(
        "/api/auth/login",
        { email, password },
        { withCredentials: true }
      );
      setUser(res.data);
      setIsAuthenticated(true);
      toast.success("Ingelogd");
      navigate("/");
      return true;
    } catch {
      toast.error("E-mail of wachtwoord niet juist.");
      return false;
    }
  };

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      toast.success("Uitgelogd");
      navigate("/");
    }
  };

  // 🔹 Schachten
  const fetchSchachten = async () => {
    try {
      const response = await axios.get("/api/schachten");
      setSchachten(response.data);
      return response.data; // <-- return data
    } catch (error) {
      console.error("Error fetching schachten:", error);
      toast.error("Error loading leaderboard");
      return [];
    }
  };
  
  const addSchacht = async (name) => {
    try {
      await axios.post("/api/schachten", { name });
      toast.success("Schacht toegevoegd");
      await fetchSchachten();
    } catch (error) {
      console.error("Error adding schacht:", error);
      toast.error("Kon schacht niet toevoegen");
      throw error;
    }
  };

  const deleteSchacht = async (id) => {
    try {
      await axios.delete(`/api/schachten/${id}`);
      toast.success("Schacht verwijderd");
      await fetchSchachten();
      setSelectedSchacht(null); // Clear selection after deletion
    } catch (error) {
      console.error("Error deleting schacht:", error);
      toast.error("Kon schacht niet verwijderen");
      throw error;
    }
  };

  // 🔹 Points management (when task completed)
  const completeTask = async (schachtId, taskId) => {
    try {
      await axios.post("/api/completions", { schachtId, taskId });
      toast.success("Punten toegevoegd");
      await fetchSchachten(); // refresh leaderboard
    } catch (err) {
      console.error("Error completing task:", err);
      toast.error("Error completing task");
    }
  };

  // 🔹 Remove a completed task
  const removeCompletion = async (completionId) => {
    try {
      await axios.delete(`/api/completions/${completionId}`);
      toast.success("Completion removed");
      await fetchSchachten(); // refresh leaderboard and points
    } catch (err) {
      console.error("Error removing completion:", err);
      toast.error("Error removing completion");
    }
  };

  // 🔹 Delete a custom task (only schacht-owned tasks)
  const deleteCustomTask = async (taskId) => {
    try {
      if (!selectedSchacht) {
        toast.error("No schacht selected");
        return;
      }

      const confirmed = window.confirm("Are you sure you want to delete this custom task?");
      if (!confirmed) return;
  
      await axios.delete(`/api/custom-tasks/${taskId}`);
      toast.success("Custom task deleted");
  
      // Fetch updated tasks and completions
      const tasks = await fetchTasks(selectedSchacht._id);
      const completions = await fetchCompletions(selectedSchacht._id);
      await fetchSchachten(); // Refresh leaderboard/points
  
      return { tasks, completions }; // Return so component can update state
    } catch (err) {
      console.error("Error deleting custom task:", err);
      toast.error("Error deleting custom task");
    }
  };

  // 🔹 Tasks & Completions
  const fetchTasks = async (schachtId) => {
    try {
      const res = await axios.get(`/api/tasks?schachtId=${schachtId}`);
      return res.data || [];
    } catch (err) {
      console.error("Error fetching tasks:", err);
      toast.error("Error loading tasks");
      return [];
    }
  };
  
  const fetchCompletions = async (schachtId) => {
    try {
      const res = await axios.get(`/api/completions/${schachtId}`);
      return res.data || [];
    } catch (err) {
      console.error("Error fetching completions:", err);
      toast.error("Error loading completions");
      return [];
    }
  };

  const createCustomTask = async (schachtId, { name, points, repeatable, interval }) => {
    try {
      const res = await axios.post("/api/custom-tasks", {
        schachtId,
        name,
        points,
        repeatable,
        interval,
      });
      toast.success("Custom task created & completed");
      return res.data;
    } catch (err) {
      console.error("Error creating custom task:", err);
      toast.error("Error creating custom task");
      throw err;
    }
  };
  
  // Initialize data on mount
  useEffect(() => {
    fetchUser();
    fetchSchachten();
  }, []);

  // Context value
  const value = {
    navigate,
    user,
    isAuthenticated,
    schachten,
    selectedSchacht,
    setSelectedSchacht,
    fetchUser,
    fetchSchachten,
    login,
    logout,
    addSchacht,
    deleteSchacht,
    completeTask,
    removeCompletion,
    fetchTasks,
    fetchCompletions,
    createCustomTask,
    deleteCustomTask
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
