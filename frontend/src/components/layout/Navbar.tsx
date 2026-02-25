import { FileText, LogOut } from "lucide-react";
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
    <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <button className="inline-flex items-center gap-2 text-lg font-semibold" onClick={() => navigate("/dashboard")}>
          <FileText size={18} className="text-blue-600" /> IntelliDoc
        </button>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{user?.name || user?.email}</span>
          <button onClick={onLogout} className="btn-secondary px-3 py-2">
            <LogOut size={16} className="mr-2" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};
