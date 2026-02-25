import { FormEvent, useMemo, useState } from "react";
import { loginApi } from "../../api/auth.api";
import { useAuth } from "../../store/auth.store";
import { useNavigate } from "react-router-dom";

export const LoginForm = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailError = useMemo(() => (email && !email.includes("@") ? "Enter a valid email address" : ""), [email]);
  const passwordError = useMemo(
    () => (password && password.length < 8 ? "Password must be at least 8 characters" : ""),
    [password]
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || emailError || passwordError) {
      setError("Please fix the errors above");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await loginApi({ email, password });
      setAuth(data.user, data.accessToken);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          className="input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {emailError ? <p className="mt-1 text-xs text-red-600">{emailError}</p> : null}
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          className="input"
          placeholder="••••••••"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {passwordError ? <p className="mt-1 text-xs text-red-600">{passwordError}</p> : null}
      </div>

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <button disabled={loading} className="btn-primary w-full">
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
};
