import { Link } from "react-router-dom";
import { RegisterForm } from "../components/auth/RegisterForm";

export const RegisterPage = () => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 px-4">
    <div className="card w-full max-w-md p-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Get started</p>
      <h2 className="mb-2 text-2xl font-semibold">Create your IntelliDoc account</h2>
      <p className="mb-6 text-sm text-slate-600">Set up your workspace to upload and manage documents.</p>
      <RegisterForm />
      <p className="mt-5 text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  </div>
);
