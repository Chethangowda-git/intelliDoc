import { Link } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm";

export const LoginPage = () => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 px-4">
    <div className="card w-full max-w-md p-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Welcome back</p>
      <h2 className="mb-2 text-2xl font-semibold">Sign in to IntelliDoc</h2>
      <p className="mb-6 text-sm text-slate-600">Manage uploads, track processing, and continue document intelligence workflows.</p>
      <LoginForm />
      <p className="mt-5 text-sm text-slate-600">
        No account?{" "}
        <Link to="/register" className="font-medium text-blue-600 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  </div>
);
