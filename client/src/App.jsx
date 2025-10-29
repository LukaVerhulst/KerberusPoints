import { Route, Routes, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import { Toaster } from "react-hot-toast";
import { useAppContext } from "./context/AppContext";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  const { isAuthenticated } = useAppContext();

  return (
    <div className="text-default min-h-screen flex flex-col text-gray-700 bg-white">
      <Toaster />

      <div className="px-6 md:px-16 lg:px-24 xl:px-32 flex-1">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;