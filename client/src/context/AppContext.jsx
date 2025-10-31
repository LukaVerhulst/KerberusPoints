import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

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
      const res = await axios.get("http://localhost:4000/api/auth/me", { withCredentials: true });
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
        "http://localhost:4000/api/auth/login",
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
      await axios.post("http://localhost:4000/api/auth/logout", {}, { withCredentials: true });
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
      const response = await axios.get("http://localhost:4000/api/schachten");
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
      await axios.post("http://localhost:4000/api/schachten", { name });
      toast.success("Schacht toegevoegd");
      await fetchSchachten();
    } catch (error) {
      console.error("Error adding schacht:", error);
      toast.error("Kon schacht niet toevoegen");
      throw error;
    }
  };

  // 🔹 Points management (when task completed)
  const completeTask = async (schachtId, taskId) => {
    try {
      await axios.post("http://localhost:4000/api/completions", { schachtId, taskId });
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
      await axios.delete(`http://localhost:4000/api/completions/${completionId}`);
      toast.success("Completion removed");
      await fetchSchachten(); // refresh leaderboard and points
    } catch (err) {
      console.error("Error removing completion:", err);
      toast.error("Error removing completion");
    }
  };
  
  useEffect(() => {
    fetchUser();
    fetchSchachten();
  }, []);

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
    completeTask,
    removeCompletion, // <-- add this
  };


  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
