import { FormEvent, useState } from "react";
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

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || password.length < 8) return setError("Enter valid email and password");
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
    <form onSubmit={onSubmit} className="space-y-3">
      <input className="w-full border rounded p-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="w-full border rounded p-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button disabled={loading} className="w-full bg-slate-900 text-white rounded p-2">{loading ? "Loading..." : "Login"}</button>
    </form>
  );
};
