import { Navigate } from "react-router-dom";
import { useAuth } from "../../store/auth.store";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { accessToken, initializing } = useAuth();

  if (initializing) return <div className="p-10 text-center">Loading session...</div>;
  if (!accessToken) return <Navigate to="/login" replace />;

  return children;
};
