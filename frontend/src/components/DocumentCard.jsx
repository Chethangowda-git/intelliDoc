import { FileText, Trash2, Clock, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import client from '../api/client';

const STATUS = {
  queued:     { label: 'Queued',     color: 'var(--text-3)',  bg: 'var(--bg-3)',       dot: '#4a5568' },
  extracting: { label: 'Extracting', color: '#fbbf24',        bg: 'rgba(251,191,36,0.08)', dot: '#f59e0b', animate: true },
  embedding:  { label: 'Embedding',  color: '#a78bfa',        bg: 'rgba(167,139,250,0.08)', dot: '#8b5cf6', animate: true },
  ready:      { label: 'Ready',      color: '#34d399',        bg: 'rgba(52,211,153,0.08)',  dot: '#10b981' },
  failed:     { label: 'Failed',     color: '#f87171',        bg: 'rgba(248,113,113,0.08)', dot: '#ef4444' },
};

export default function DocumentCard({ doc, onDelete, onDeleteError, onOpen, active }) {
  const st = STATUS[doc.status] || STATUS.queued;
  const isReady = doc.status === 'ready';
  const isProcessing = doc.status === 'extracting' || doc.status === 'embedding' || doc.status === 'queued';

  async function handleDelete(e) {
    e.stopPropagation();
    if (!confirm(`Delete "${doc.originalName}"?`)) return;
    try {
      await client.delete(`/api/documents/${doc._id}`);
      onDelete(doc._id, doc.originalName);
    } catch {
      onDeleteError?.();
    }
  }

  const ext = doc.originalName?.split('.').pop()?.toUpperCase() || 'FILE';

  return (
    <div
      style={{
        ...s.card,
        ...(active ? s.cardActive : {}),
        ...(isReady ? s.cardClickable : {}),
      }}
      onClick={() => isReady && onOpen(doc)}
    >
      {/* File type badge + icon */}
      <div style={s.fileIconWrap}>
        <div style={{ ...s.fileIcon, ...(active ? s.fileIconActive : {}) }}>
          <FileText size={14} color={active ? '#3b82f6' : 'var(--text-3)'} />
        </div>
        <span style={s.extBadge}>{ext}</span>
      </div>

      {/* Info */}
      <div style={s.info}>
        <p style={s.name}>{doc.originalName}</p>
        <p style={s.meta}>
          {(doc.size / 1024 / 1024).toFixed(1)} MB
          {doc.chunkCount > 0 && ` · ${doc.chunkCount} chunks`}
        </p>
      </div>

      {/* Right side */}
      <div style={s.right}>
        {/* Status */}
        <div style={{ ...s.statusBadge, background: st.bg }}>
          <span style={{
            ...s.statusDot,
            background: st.dot,
            animation: st.animate ? 'pulse-dot 1.2s ease-in-out infinite' : 'none',
          }} />
          <span style={{ ...s.statusLabel, color: st.color }}>{st.label}</span>
        </div>

        {/* Chat icon for ready docs */}
        {isReady && (
          <MessageSquare
            size={14}
            color={active ? '#3b82f6' : 'var(--text-3)'}
          />
        )}

        {/* Delete */}
        <button
          style={s.deleteBtn}
          onClick={handleDelete}
          title="Delete"
        >
          <Trash2 size={13} color="var(--text-3)" />
        </button>
      </div>
    </div>
  );
}

const s = {
  card: {
    background: 'var(--bg-3)',
    borderRadius: 10,
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    border: '1px solid var(--border)',
    transition: 'all 0.15s',
    position: 'relative',
  },
  cardActive: {
    borderColor: 'rgba(59,130,246,0.35)',
    background: 'rgba(59,130,246,0.06)',
  },
  cardClickable: {
    cursor: 'pointer',
  },
  fileIconWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  fileIcon: {
    width: 32,
    height: 32,
    background: 'var(--bg-4)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIconActive: {
    background: 'var(--blue-dim)',
    borderColor: 'rgba(59,130,246,0.2)',
  },
  extBadge: {
    position: 'absolute',
    bottom: -4,
    right: -6,
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 3,
    fontSize: 8,
    fontWeight: 700,
    color: 'var(--text-3)',
    padding: '0px 3px',
    letterSpacing: '0.04em',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: 'var(--text-1)',
    fontSize: 13,
    fontWeight: 500,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  meta: {
    color: 'var(--text-3)',
    fontSize: 11,
    margin: 0,
    marginTop: 2,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '3px 8px',
    borderRadius: 20,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    display: 'inline-block',
    flexShrink: 0,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.02em',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '3px',
    borderRadius: 5,
    display: 'flex',
    alignItems: 'center',
    opacity: 0.6,
    transition: 'opacity 0.15s',
  },
};