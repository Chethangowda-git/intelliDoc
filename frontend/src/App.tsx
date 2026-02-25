import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DocumentChatPlaceholderPage } from "./pages/DocumentChatPlaceholderPage";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { Navbar } from "./components/layout/Navbar";
import { setAuthHooks } from "./api/axios";
import { refreshToken } from "./api/auth.api";
import { useAuth } from "./store/auth.store";
import { useEffect } from "react";

function App() {
  const { clearAuth, setAuth, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setAuthHooks(
      () => {
        clearAuth();
        navigate("/login");
      },
      async () => {
        const data = await refreshToken();
        setAuth(user, data.accessToken);
        return data.accessToken;
      }
    );
  }, [clearAuth, navigate, setAuth, user]);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/:id"
          element={
            <ProtectedRoute>
              <DocumentChatPlaceholderPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;
