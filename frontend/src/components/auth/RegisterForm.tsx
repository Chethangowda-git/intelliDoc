import { FormEvent, useMemo, useState } from "react";
import { registerApi } from "../../api/auth.api";
import { useAuth } from "../../store/auth.store";
import { useNavigate } from "react-router-dom";

export const RegisterForm = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const nameError = useMemo(() => (name || error ? (name.trim() ? "" : "Name is required") : ""), [name, error]);
  const emailError = useMemo(() => (email && !email.includes("@") ? "Enter a valid email address" : ""), [email]);
  const passwordError = useMemo(
    () => (password && password.length < 8 ? "Password must be at least 8 characters" : ""),
    [password]
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email || !password || emailError || passwordError) {
      setError("Please complete all fields correctly");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await registerApi({ name: name.trim(), email, password });
      setAuth(data.user, data.accessToken);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
          Name
        </label>
        <input id="name" className="input" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
        {nameError ? <p className="mt-1 text-xs text-red-600">{nameError}</p> : null}
      </div>

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
          placeholder="Minimum 8 characters"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {passwordError ? <p className="mt-1 text-xs text-red-600">{passwordError}</p> : null}
      </div>

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <button disabled={loading} className="btn-primary w-full">
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
};
