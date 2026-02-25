import { Link } from "react-router-dom";
import { RegisterForm } from "../components/auth/RegisterForm";

export const RegisterPage = () => (
  <div className="min-h-screen grid place-items-center p-4">
    <div className="w-full max-w-md bg-white rounded-xl border p-6">
      <h2 className="text-xl font-semibold mb-4">Register</h2>
      <RegisterForm />
      <p className="text-sm mt-4">Already have account? <Link to="/login" className="underline">Login</Link></p>
    </div>
  </div>
);
