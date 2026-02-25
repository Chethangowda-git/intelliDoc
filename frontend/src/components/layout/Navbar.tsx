import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logoutApi } from "../../api/auth.api";
import { useAuth } from "../../store/auth.store";

export const Navbar = () => {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logoutApi();
    clearAuth();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
      <h1 className="font-semibold">IntelliDoc</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600">{user?.name || user?.email}</span>
        <button onClick={onLogout} className="px-3 py-2 border rounded-md text-sm inline-flex gap-2 items-center">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </nav>
  );
};
