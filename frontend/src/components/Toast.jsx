// Toast.jsx
import { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export function Toast({ toasts, removeToast }) {
  return (
    <div style={ts.container}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id]);

  const isSuccess = toast.type === 'success';

  return (
    <div style={{ ...ts.toast, ...(isSuccess ? ts.success : ts.error) }}>
      {isSuccess
        ? <CheckCircle size={14} color="#34d399" />
        : <AlertCircle size={14} color="#f87171" />
      }
      <span style={ts.msg}>{toast.message}</span>
      <button style={ts.close} onClick={() => onRemove(toast.id)}>
        <X size={12} color="var(--text-3)" />
      </button>
    </div>
  );
}

const ts = {
  container: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 1000,
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid',
    minWidth: 260,
    maxWidth: 360,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    animation: 'toastIn 0.25s cubic-bezier(0.16,1,0.3,1) both',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  success: {
    background: 'rgba(16,40,26,0.95)',
    borderColor: 'rgba(16,185,129,0.2)',
  },
  error: {
    background: 'rgba(40,16,16,0.95)',
    borderColor: 'rgba(239,68,68,0.2)',
  },
  msg: {
    color: 'var(--text-1)',
    fontSize: 13,
    flex: 1,
    fontWeight: 400,
  },
  close: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 2,
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
};

export default Toast;