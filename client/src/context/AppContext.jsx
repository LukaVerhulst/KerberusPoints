import { createContext, useContext, useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {

    const navigate = useNavigate();

    const value = { navigate };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export const useAppContext = () => {
    return useContext(AppContext);
}