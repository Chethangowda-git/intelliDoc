import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
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
  const [provider, setProvider] = useState('huggingface');
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
        if (stillProcessing || prev.length === 0) fetchDocuments();
        else clearInterval(intervalRef.current);
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
    addToast(`Processing "${doc.originalName}"`);
    clearInterval(intervalRef.current);
    startPolling();
  }

  function handleUploadError(msg) {
    addToast(msg, 'error');
  }

  function handleDelete(id, name) {
    setDocuments(prev => prev.filter(d => d._id !== id));
    if (activeDoc?._id === id) setActiveDoc(null);
    addToast(`Deleted "${name}"`);
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

  const readyCount = documents.filter(d => d.status === 'ready').length;

  return (
    <div style={s.page}>
      <div style={s.ambient1} />
      <div style={s.ambient2} />

      {/* Header */}
      <header style={s.header}>
        <div style={s.headerInner}>
          {/* Logo */}
          <div style={s.logoWrap}>
            <div style={s.logoIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="14 2 14 8 20 8" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="16" y1="13" x2="8" y2="13" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
                <line x1="16" y1="17" x2="8" y2="17" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={s.logoText}>IntelliDoc</span>
            <span style={s.logoBadge}>AI</span>
          </div>

          {/* Center — provider toggle */}
          <div style={s.providerToggle}>
            <button
              style={{ ...s.providerBtn, ...(provider === 'huggingface' ? s.providerBtnActive : {}) }}
              onClick={() => setProvider('huggingface')}
            >
              🤗 HuggingFace
            </button>
            <button
              style={{ ...s.providerBtn, ...(provider === 'gemini' ? s.providerBtnActive : {}) }}
              onClick={() => setProvider('gemini')}
            >
              ✨ Gemini
            </button>
          </div>

          {/* Right */}
          <div style={s.headerRight}>
            {readyCount > 0 && (
              <div style={s.statsChip}>
                <span style={s.statsGreen} />
                {readyCount} doc{readyCount !== 1 ? 's' : ''} ready
              </div>
            )}
            <button style={s.logoutBtn} onClick={handleLogout}>
              <LogOut size={14} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div style={s.body}>
        {/* Sidebar */}
        <aside style={s.sidebar}>
          <div style={s.sidebarInner}>
            <div style={s.uploadSection}>
              <div style={s.sectionLabel}>Upload</div>
              <UploadZone
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
            </div>

            <div style={s.docsSection}>
              <div style={s.docsSectionHeader}>
                <span style={s.sectionLabel}>Documents</span>
                {documents.length > 0 && (
                  <span style={s.countBadge}>{documents.length}</span>
                )}
              </div>
              <div style={s.docsList}>
                {loading ? (
                  <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
                ) : documents.length === 0 ? (
                  <EmptyState />
                ) : (
                  documents.map((doc, i) => (
                    <div key={doc._id} style={{ animationDelay: `${i * 0.05}s` }} className="fade-up">
                      <DocumentCard
                        doc={doc}
                        onDelete={handleDelete}
                        onDeleteError={handleDeleteError}
                        onOpen={handleOpenChat}
                        active={activeDoc?._id === doc._id}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={s.main}>
          {activeDoc ? (
            <div style={s.chatWrap} className="fade-up">
              <ChatPanel
                document={activeDoc}
                provider={provider}
                onClose={() => setActiveDoc(null)}
              />
            </div>
          ) : (
            <div style={s.placeholder}>
              <div style={s.placeholderGlow} />
              <div style={s.placeholderIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="rgba(59,130,246,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p style={s.placeholderTitle}>Start a conversation</p>
              <p style={s.placeholderSub}>Select a ready document from the sidebar to begin</p>

              {/* Provider cards */}
              <div style={s.providerCards}>
                <div style={{ ...s.providerCard, ...(provider === 'huggingface' ? s.providerCardActive : {}) }}>
                  <span style={s.providerCardIcon}>🤗</span>
                  <div>
                    <p style={s.providerCardName}>HuggingFace</p>
                    <p style={s.providerCardDesc}>Open-source · Free · Mistral 7B</p>
                  </div>
                  {provider === 'huggingface' && <span style={s.activeDot} />}
                </div>
                <div style={{ ...s.providerCard, ...(provider === 'gemini' ? s.providerCardActive : {}) }}>
                  <span style={s.providerCardIcon}>✨</span>
                  <div>
                    <p style={s.providerCardName}>Gemini</p>
                    <p style={s.providerCardDesc}>Google API · Fast · 2.5 Flash</p>
                  </div>
                  {provider === 'gemini' && <span style={s.activeDot} />}
                </div>
              </div>

              <div style={s.hintRow}>
                {['Summarize the key points', 'What are the main conclusions?', 'Extract important dates'].map(h => (
                  <span key={h} style={s.hint}>{h}</span>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' },
  ambient1: { position: 'fixed', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)', top: -200, right: -100, pointerEvents: 'none', zIndex: 0 },
  ambient2: { position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)', bottom: -150, left: -100, pointerEvents: 'none', zIndex: 0 },
  header: { borderBottom: '1px solid var(--border)', flexShrink: 0, position: 'relative', zIndex: 10, background: 'rgba(6,9,18,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' },
  headerInner: { maxWidth: 1400, margin: '0 auto', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  logoIcon: { width: 30, height: 30, background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' },
  logoBadge: { background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.08em' },
  providerToggle: { display: 'flex', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 9, padding: 3, gap: 3 },
  providerBtn: { background: 'none', border: '1px solid transparent', color: 'var(--text-3)', padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-body)', transition: 'all 0.15s', whiteSpace: 'nowrap' },
  providerBtnActive: { background: 'var(--bg-4)', color: 'var(--text-1)', borderColor: 'var(--border-2)' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  statsChip: { display: 'flex', alignItems: 'center', gap: 7, background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#34d399', fontWeight: 500 },
  statsGreen: { width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse-dot 2s ease-in-out infinite', display: 'inline-block' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid var(--border-2)', color: 'var(--text-2)', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)' },
  body: { display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1, maxWidth: 1400, width: '100%', margin: '0 auto', alignSelf: 'stretch' },
  sidebar: { width: 360, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', background: 'rgba(13,17,23,0.6)' },
  sidebarInner: { padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 28 },
  uploadSection: { display: 'flex', flexDirection: 'column', gap: 10 },
  docsSection: { display: 'flex', flexDirection: 'column', gap: 10 },
  docsSectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: { fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' },
  countBadge: { background: 'var(--bg-4)', color: 'var(--text-2)', fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 10, border: '1px solid var(--border)' },
  docsList: { display: 'flex', flexDirection: 'column', gap: 6 },
  main: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 24 , minHeight: 0 },
  chatWrap: { flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 },
  placeholder: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative' },
  placeholderGlow: { position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)', pointerEvents: 'none' },
  placeholderIcon: { width: 64, height: 64, background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  placeholderTitle: { fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.02em' },
  placeholderSub: { color: 'var(--text-3)', fontSize: 13, textAlign: 'center', maxWidth: 300 },
  providerCards: { display: 'flex', gap: 10, marginTop: 8 },
  providerCard: { display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', position: 'relative', transition: 'border-color 0.2s', minWidth: 160 },
  providerCardActive: { borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.05)' },
  providerCardIcon: { fontSize: 20 },
  providerCardName: { color: 'var(--text-1)', fontSize: 13, fontWeight: 600, margin: 0 },
  providerCardDesc: { color: 'var(--text-3)', fontSize: 11, margin: 0, marginTop: 2 },
  activeDot: { position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', animation: 'pulse-dot 2s ease-in-out infinite' },
  hintRow: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 },
  hint: { background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 14px', fontSize: 12, color: 'var(--text-2)' },
  page: { 
  height: '100vh', 
  background: 'var(--bg)', 
  display: 'flex', 
  flexDirection: 'column', 
  position: 'relative', 
  overflow: 'hidden' 
},
body: { 
  display: 'flex', 
  flex: 1, 
  overflow: 'hidden', 
  position: 'relative', 
  zIndex: 1, 
  maxWidth: 1400, 
  width: '100%', 
  margin: '0 auto', 
  alignSelf: 'stretch',
  minHeight: 0,
},
sidebar: { 
  width: 360, 
  flexShrink: 0, 
  borderRight: '1px solid var(--border)', 
  overflowY: 'auto', 
  background: 'rgba(13,17,23,0.6)',
  minHeight: 0,
},
main: { 
  flex: 1, 
  display: 'flex', 
  flexDirection: 'column', 
  padding: 24, 
  overflow: 'hidden',
  minHeight: 0,
},
chatWrap: { 
  flex: 1, 
  display: 'flex', 
  flexDirection: 'column',
  overflow: 'hidden',
  minHeight: 0,
},
};