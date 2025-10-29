import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // noop for now — when you add backend, fetch current user here
    const fetchUser = async () => {
        // Example: await fetch('/api/auth/me') and setUser / setIsAuthenticated
        return;
    };

    useEffect(() => {
        // intentionally not persisting auth across refreshes for now
        fetchUser();
    }, []);

    // local-only login (for dev). Does NOT persist to localStorage.
    const login = (email, password) => {
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
        const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

        if (email === adminEmail && password === adminPassword) {
            setUser({ email });
            setIsAuthenticated(true);
            toast.success("Logged in");
            navigate("/");
            return true;
        }

        toast.error("Invalid credentials");
        return false;
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        toast.success("Logged out");
        navigate("/");
    };

    // helper so you can set auth state manually from components while developing
    const setAuthState = ({ user: u = null, isAuthenticated: auth = false }) => {
        setUser(u);
        setIsAuthenticated(auth);
    };

    const value = {
        navigate,
        fetchUser,
        login,
        logout,
        user,
        isAuthenticated,
        setAuthState,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);