import { useCallback, useEffect, useState } from "react";
import { AppContext } from "./context";
import { api } from "../lib/api";
export function AppContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const fetchUser = useCallback(async () => {
    setAuthError("");
    try {
      const { data } = await api.get("/api/auth/me");
      setUser(data.user);
    } catch {
      setAuthError("Je sessie kon niet gecontroleerd worden.");
    } finally {
      setAuthLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);
  const login = async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    setUser(data);
  };
  const logout = async () => {
    await api.post("/api/auth/logout");
    setUser(null);
  };
  return (
    <AppContext.Provider
      value={{ user, authLoading, authError, fetchUser, login, logout }}
    >
      {children}
    </AppContext.Provider>
  );
}
