import { FileText, Trash2, Clock, CheckCircle, AlertCircle, Loader, MessageSquare } from 'lucide-react';
import client from '../api/client';

const STATUS_CONFIG = {
  queued:     { label: 'Queued',     color: '#94a3b8', Icon: Clock },
  extracting: { label: 'Extracting', color: '#f59e0b', Icon: Loader },
  embedding:  { label: 'Embedding',  color: '#a78bfa', Icon: Loader },
  ready:      { label: 'Ready',      color: '#34d399', Icon: CheckCircle },
  failed:     { label: 'Failed',     color: '#f87171', Icon: AlertCircle },
};

export default function DocumentCard({ doc, onDelete, onOpen, active }) {
  const { label, color, Icon } = STATUS_CONFIG[doc.status] || STATUS_CONFIG.queued;

  async function handleDelete(e) {
    e.stopPropagation();
    if (!confirm(`Delete "${doc.originalName}"?`)) return;
    try {
      await client.delete(`/api/documents/${doc._id}`);
      onDelete(doc._id);
    } catch (err) {
      alert('Delete failed');
    }
  }

  const fileSizeMB = (doc.size / 1024 / 1024).toFixed(2);
  const isReady = doc.status === 'ready';

  return (
    <div
      style={{ ...styles.card, ...(active ? styles.cardActive : {}), ...(isReady ? styles.cardClickable : {}) }}
      onClick={() => isReady && onOpen(doc)}
    >
      <div style={styles.left}>
        <FileText size={22} color={active ? '#3b82f6' : '#64748b'} />
        <div>
          <p style={styles.name}>{doc.originalName}</p>
          <p style={styles.meta}>
            {fileSizeMB} MB · {new Date(doc.createdAt).toLocaleDateString()}
            {doc.chunkCount > 0 && ` · ${doc.chunkCount} chunks`}
          </p>
        </div>
      </div>
      <div style={styles.right}>
        <span style={{ ...styles.status, color }}>
          <Icon size={14} />
          {label}
        </span>
        {isReady && (
          <MessageSquare size={15} color={active ? '#3b82f6' : '#475569'} />
        )}
        <button style={styles.deleteBtn} onClick={handleDelete} title="Delete">
          <Trash2 size={16} color="#64748b" />
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: { background: '#1e293b', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #334155', transition: 'border-color 0.15s' },
  cardActive: { borderColor: '#3b82f6', background: '#1e3a5f' },
  cardClickable: { cursor: 'pointer' },
  left: { display: 'flex', gap: 12, alignItems: 'center' },
  name: { color: '#f1f5f9', margin: 0, fontWeight: 500, fontSize: 14 },
  meta: { color: '#64748b', margin: 0, fontSize: 12, marginTop: 2 },
  right: { display: 'flex', alignItems: 'center', gap: 12 },
  status: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 500 },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6 },
};