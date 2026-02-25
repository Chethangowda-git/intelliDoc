import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
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
    <div style={s.page}>
      {/* Background mesh */}
      <div style={s.mesh1} />
      <div style={s.mesh2} />

      <div style={s.card} className="fade-up">
        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={s.logoIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="14 2 14 8 20 8" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="13" x2="8" y2="13" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
              <line x1="16" y1="17" x2="8" y2="17" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={s.logoText}>IntelliDoc</span>
        </div>

        <h1 style={s.title}>
          {mode === 'login' ? 'Welcome back' : 'Get started'}
        </h1>
        <p style={s.subtitle}>
          {mode === 'login'
            ? 'Sign in to your workspace'
            : 'Create your account — it\'s free'}
        </p>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              onFocus={e => e.target.style.borderColor = '#3b82f6'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              onFocus={e => e.target.style.borderColor = '#3b82f6'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>

          {error && (
            <div style={s.errorBox}>
              <span style={s.errorDot} />
              {error}
            </div>
          )}

          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? (
              <span style={s.spinner} />
            ) : (
              mode === 'login' ? 'Sign in' : 'Create account'
            )}
          </button>
        </form>

        <div style={s.divider}>
          <span style={s.dividerLine} />
          <span style={s.dividerText}>or</span>
          <span style={s.dividerLine} />
        </div>

        <button
          style={s.switchBtn}
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
        >
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <span style={s.switchLink}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </span>
        </button>
      </div>

      <p style={s.footer}>AI-powered document intelligence</p>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    position: 'relative',
    overflow: 'hidden',
    padding: '24px',
  },
  mesh1: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
    top: -100,
    right: -100,
    pointerEvents: 'none',
  },
  mesh2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
    bottom: -80,
    left: -80,
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '40px 36px',
    position: 'relative',
    zIndex: 1,
    boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  logoIcon: {
    width: 34,
    height: 34,
    background: 'var(--blue-dim)',
    border: '1px solid rgba(59,130,246,0.2)',
    borderRadius: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-1)',
    letterSpacing: '-0.02em',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 26,
    fontWeight: 700,
    color: 'var(--text-1)',
    letterSpacing: '-0.03em',
    marginBottom: 6,
  },
  subtitle: {
    color: 'var(--text-2)',
    fontSize: 14,
    marginBottom: 28,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-2)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  input: {
    background: 'var(--bg-3)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    color: 'var(--text-1)',
    padding: '11px 14px',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'var(--font-body)',
    transition: 'border-color 0.2s',
    width: '100%',
  },
  errorBox: {
    background: 'var(--red-dim)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 13,
    color: '#fca5a5',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  errorDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--red)',
    flexShrink: 0,
  },
  btn: {
    background: 'var(--blue)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '12px',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    marginTop: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    transition: 'opacity 0.2s',
  },
  spinner: {
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '20px 0',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'var(--border)',
  },
  dividerText: {
    color: 'var(--text-3)',
    fontSize: 12,
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-2)',
    fontSize: 13,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'center',
    fontFamily: 'var(--font-body)',
  },
  switchLink: {
    color: 'var(--blue)',
    fontWeight: 500,
  },
  footer: {
    marginTop: 28,
    color: 'var(--text-3)',
    fontSize: 12,
    letterSpacing: '0.04em',
    position: 'relative',
    zIndex: 1,
  },
};