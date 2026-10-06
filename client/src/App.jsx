import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAppContext } from "./context/context";
import Home from "./pages/Home";
import Login from "./pages/Login";
export default function App() {
  const { user, authLoading, authError, fetchUser } = useAppContext();
  if (authLoading) return <main className="loading-page">Kerberus laden…</main>;
  if (authError)
    return (
      <main className="loading-page">
        <p>{authError}</p>
        <button onClick={fetchUser}>Opnieuw proberen</button>
      </main>
    );
  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/"
          element={user ? <Home /> : <Navigate to="/login" replace />}
        />
        <Route
          path="*"
          element={<Navigate to={user ? "/" : "/login"} replace />}
        />
      </Routes>
    </>
  );
}
