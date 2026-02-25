import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const { data } = await client.post(endpoint, { email, password });
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>IntelliDoc</h1>
        <p style={styles.tagline}>AI-powered document intelligence</p>

        <div style={styles.tabs}>
          {['login', 'register'].map((m) => (
            <button
              key={m}
              style={{ ...styles.tab, ...(mode === m ? styles.tabActive : {}) }}
              onClick={() => { setMode(m); setError(''); }}
            >
              {m === 'login' ? 'Log In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' },
  card: { background: '#1e293b', borderRadius: 16, padding: '40px 48px', width: 400, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  logo: { color: '#f8fafc', fontSize: 28, fontWeight: 700, margin: 0, textAlign: 'center' },
  tagline: { color: '#94a3b8', textAlign: 'center', marginTop: 6, marginBottom: 28, fontSize: 14 },
  tabs: { display: 'flex', marginBottom: 24, borderRadius: 8, overflow: 'hidden', border: '1px solid #334155' },
  tab: { flex: 1, padding: '10px 0', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  tabActive: { background: '#3b82f6', color: '#fff' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { padding: '11px 14px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: 14, outline: 'none' },
  error: { color: '#f87171', fontSize: 13, margin: 0 },
  button: { padding: '12px', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginTop: 4 },
};