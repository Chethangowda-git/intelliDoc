import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, FileText } from 'lucide-react';
import client from '../api/client';
import UploadZone from '../components/UploadZone';
import DocumentCard from '../components/DocumentCard';
import ChatPanel from '../components/ChatPanel';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

export default function DashboardPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDoc, setActiveDoc] = useState(null);
  const { toasts, addToast, removeToast } = useToast();
  const intervalRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
    startPolling();
    return () => clearInterval(intervalRef.current);
  }, []);

  function startPolling() {
    intervalRef.current = setInterval(() => {
      setDocuments(prev => {
        const stillProcessing = prev.some(d =>
          d.status === 'queued' || d.status === 'extracting' || d.status === 'embedding'
        );
        if (stillProcessing || prev.length === 0) {
          fetchDocuments();
        } else {
          clearInterval(intervalRef.current);
        }
        return prev;
      });
    }, 3000);
  }

  async function fetchDocuments() {
    try {
      const { data } = await client.get('/api/documents');
      setDocuments(data.documents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleUploadComplete(doc) {
    setDocuments(prev => [doc, ...prev]);
    addToast(`"${doc.originalName}" uploaded — processing started`);
    // Restart polling since we have a new doc processing
    clearInterval(intervalRef.current);
    startPolling();
  }

  function handleUploadError(msg) {
    addToast(msg, 'error');
  }

  function handleDelete(id, name) {
    setDocuments(prev => prev.filter(d => d._id !== id));
    if (activeDoc?._id === id) setActiveDoc(null);
    addToast(`"${name}" deleted`);
  }

  function handleDeleteError() {
    addToast('Failed to delete document', 'error');
  }

  function handleOpenChat(doc) {
    if (doc.status !== 'ready') return;
    setActiveDoc(doc);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.logoWrap}>
          <FileText size={20} color="#3b82f6" />
          <span style={styles.logo}>IntelliDoc</span>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={15} /> Log out
        </button>
      </header>

      <div style={styles.body}>
        {/* Left panel */}
        <div style={styles.left}>
          <section style={styles.section}>
            <h2 style={styles.heading}>Upload a Document</h2>
            <UploadZone
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />
          </section>

          <section style={styles.section}>
            <h2 style={styles.heading}>
              Your Documents
              {documents.length > 0 && (
                <span style={styles.count}>{documents.length}</span>
              )}
            </h2>
            {loading ? (
              <div style={styles.list}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : documents.length === 0 ? (
              <EmptyState />
            ) : (
              <div style={styles.list}>
                {documents.map((doc) => (
                  <DocumentCard
                    key={doc._id}
                    doc={doc}
                    onDelete={handleDelete}
                    onDeleteError={handleDeleteError}
                    onOpen={handleOpenChat}
                    active={activeDoc?._id === doc._id}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right panel — Chat */}
        <div style={styles.right}>
          {activeDoc ? (
            <ChatPanel
              document={activeDoc}
              onClose={() => setActiveDoc(null)}
            />
          ) : (
            <div style={styles.chatPlaceholder}>
              <FileText size={40} color="#1e293b" />
              <p style={styles.placeholderText}>
                Select a ready document to start chatting
              </p>
            </div>
          )}
        </div>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 32px', borderBottom: '1px solid #1e293b', flexShrink: 0 },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 10 },
  logo: { color: '#f8fafc', fontWeight: 700, fontSize: 20 },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #334155', color: '#94a3b8', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  left: { width: 420, flexShrink: 0, padding: '28px 24px', overflowY: 'auto', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: 0 },
  right: { flex: 1, padding: 24, overflow: 'hidden', display: 'flex' },
  section: { marginBottom: 32 },
  heading: { color: '#f1f5f9', fontSize: 16, fontWeight: 600, marginBottom: 14, marginTop: 0, display: 'flex', alignItems: 'center', gap: 10 },
  count: { background: '#1e3a5f', color: '#60a5fa', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20 },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  chatPlaceholder: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 },
  placeholderText: { color: '#334155', fontSize: 15, textAlign: 'center', maxWidth: 280 },
};