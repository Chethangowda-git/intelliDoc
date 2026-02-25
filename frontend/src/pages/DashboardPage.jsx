import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import client from '../api/client';
import UploadZone from '../components/UploadZone';
import DocumentCard from '../components/DocumentCard';
import ChatPanel from '../components/ChatPanel';

export default function DashboardPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDoc, setActiveDoc] = useState(null);
  const navigate = useNavigate();

useEffect(() => {
  fetchDocuments();
  const interval = setInterval(() => {
    // Stop polling if all docs are in a terminal state
    setDocuments(prev => {
      const stillProcessing = prev.some(d => 
        d.status === 'queued' || d.status === 'extracting' || d.status === 'embedding'
      );
      if (!stillProcessing && prev.length > 0) {
        clearInterval(interval);
      }
      return prev;
    });
    fetchDocuments();
  }, 3000);

  return () => clearInterval(interval);
}, []);

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
    setDocuments((prev) => [doc, ...prev]);
  }

  function handleDelete(id) {
    setDocuments((prev) => prev.filter((d) => d._id !== id));
    if (activeDoc?._id === id) setActiveDoc(null);
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
        <span style={styles.logo}>IntelliDoc</span>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={16} /> Log out
        </button>
      </header>

      <div style={styles.body}>
        {/* Left panel */}
        <div style={styles.left}>
          <h2 style={styles.heading}>Upload a Document</h2>
          <UploadZone onUploadComplete={handleUploadComplete} />

          <h2 style={{ ...styles.heading, marginTop: 32 }}>Your Documents</h2>
          {loading ? (
            <p style={styles.empty}>Loading...</p>
          ) : documents.length === 0 ? (
            <p style={styles.empty}>No documents yet. Upload one above.</p>
          ) : (
            <div style={styles.list}>
              {documents.map((doc) => (
                <DocumentCard
                  key={doc._id}
                  doc={doc}
                  onDelete={handleDelete}
                  onOpen={handleOpenChat}
                  active={activeDoc?._id === doc._id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right panel — Chat */}
        {activeDoc && (
          <div style={styles.right}>
            <ChatPanel
              document={activeDoc}
              onClose={() => setActiveDoc(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid #1e293b', flexShrink: 0 },
  logo: { color: '#f8fafc', fontWeight: 700, fontSize: 20 },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #334155', color: '#94a3b8', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  body: { display: 'flex', flex: 1, gap: 0, overflow: 'hidden' },
  left: { width: 420, flexShrink: 0, padding: '32px 24px', overflowY: 'auto', borderRight: '1px solid #1e293b' },
  right: { flex: 1, padding: 24, overflow: 'hidden' },
  heading: { color: '#f1f5f9', fontSize: 18, fontWeight: 600, marginBottom: 16, marginTop: 0 },
  empty: { color: '#475569', fontSize: 14 },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
};