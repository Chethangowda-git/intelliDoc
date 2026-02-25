import { Link } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm";

export const LoginPage = () => (
  <div className="min-h-screen grid place-items-center p-4">
    <div className="w-full max-w-md bg-white rounded-xl border p-6">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      <LoginForm />
      <p className="text-sm mt-4">No account? <Link to="/register" className="underline">Register</Link></p>
    </div>
  </div>
);
