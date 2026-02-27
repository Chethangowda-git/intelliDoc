import { useState, useEffect, useRef } from 'react';
import { Send, X, ChevronDown } from 'lucide-react';
import client from '../api/client';

export default function ChatPanel({ document, provider = 'huggingface', onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [atBottom, setAtBottom] = useState(true);
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    loadHistory();
  }, [document._id]);

  useEffect(() => {
    if (atBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, atBottom]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  }

  async function loadHistory() {
    try {
      const { data } = await client.get(`/api/chat/${document._id}`);
      setMessages(data.conversation.messages || []);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  }

  async function handleSend(prefill) {
    const question = (prefill || input).trim();
    if (!question || streaming) return;

    setInput('');
    setStreaming(true);
    setStatusMsg('');
    setAtBottom(true);

    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setMessages(prev => [...prev, { role: 'assistant', content: '', _streaming: true, provider }]);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/chat/${document._id}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question, provider }),
      });

      if (!response.ok) throw new Error(`Request failed: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop();

        for (const part of parts) {
          const lines = part.split('\n');
          let event = 'token';
          let data = null;

          for (const line of lines) {
            if (line.startsWith('event: ')) event = line.slice(7).trim();
            if (line.startsWith('data: ')) {
              try { data = JSON.parse(line.slice(6)); } catch {}
            }
          }

          if (!data) continue;

          if (event === 'token' && data.text) {
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?._streaming) last.content += data.text;
              return [...updated];
            });
          } else if (event === 'status' && data.message) {
            setStatusMsg(data.message);
          } else if (event === 'done') {
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?._streaming) {
                delete last._streaming;
                last.sources = data.sources || [];
                last.provider = data.provider || provider;
              }
              return [...updated];
            });
            setStreaming(false);
            setStatusMsg('');
          } else if (event === 'error') {
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?._streaming) {
                last.content = data.message || 'Something went wrong.';
                last._error = true;
                delete last._streaming;
              }
              return [...updated];
            });
            setStreaming(false);
            setStatusMsg('');
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?._streaming) {
          last.content = 'Something went wrong. Please try again.';
          last._error = true;
          delete last._streaming;
        }
        return [...updated];
      });
      setStreaming(false);
      setStatusMsg('');
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const SUGGESTIONS = [
    'What is this document about?',
    'Summarize the key points',
    'What are the main conclusions?',
  ];

  const providerLabel = provider === 'gemini' ? '✨ Gemini' : '🤗 HuggingFace';

  return (
    <div style={s.panel}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.docIconWrap}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="14 2 14 8 20 8" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p style={s.docName}>{document.originalName}</p>
            <p style={s.docMeta}>
              {document.chunkCount > 0 && `${document.chunkCount} chunks · `}
              <span style={{ color: provider === 'gemini' ? '#60a5fa' : '#f59e0b' }}>
                {providerLabel}
              </span>
            </p>
          </div>
        </div>
        <button style={s.closeBtn} onClick={onClose}>
          <X size={16} color="var(--text-3)" />
        </button>
      </div>

      {/* Messages */}
      <div style={s.messages} ref={scrollRef} onScroll={handleScroll}>
        {messages.length === 0 && !streaming && (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="rgba(59,130,246,0.4)" strokeWidth="1.5"/>
                <path d="M21 21l-4.35-4.35" stroke="rgba(59,130,246,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={s.emptyTitle}>Ask anything about this document</p>
            <p style={s.emptyUsing}>
              Using <span style={{ color: provider === 'gemini' ? '#60a5fa' : '#f59e0b' }}>{providerLabel}</span>
            </p>
            <div style={s.suggestions}>
              {SUGGESTIONS.map(sg => (
                <button key={sg} style={s.suggestionBtn} onClick={() => handleSend(sg)}>
                  {sg}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ ...s.msgRow, ...(msg.role === 'user' ? s.msgRowUser : {}) }}>
            {msg.role === 'assistant' && (
              <div style={s.avatar}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
            <div style={{
              ...s.bubble,
              ...(msg.role === 'user' ? s.bubbleUser : s.bubbleAssistant),
              ...(msg._error ? s.bubbleError : {}),
            }}>
              <p style={s.bubbleText}>
                {msg.content || <span style={s.cursor}>▋</span>}
              </p>

              {/* Provider tag — shown on completed assistant messages */}
              {msg.role === 'assistant' && !msg._streaming && msg.provider && (
                <span style={{
                  ...s.providerTag,
                  ...(msg.provider === 'gemini' ? s.providerTagGemini : s.providerTagHF),
                }}>
                  {msg.provider === 'gemini' ? '✨ Gemini' : '🤗 HuggingFace'}
                </span>
              )}

              {/* Sources */}
              {msg.sources?.length > 0 && (
                <div style={s.sources}>
                  <p style={s.sourcesLabel}>Sources referenced</p>
                  {msg.sources.map((src, j) => (
                    <div key={j} style={s.source}>
                      <span style={s.sourceNum}>{j + 1}</span>
                      <p style={s.sourceText}>{src.text}…</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {statusMsg && (
          <div style={s.statusRow}>
            <div style={s.statusDot} />
            <span style={s.statusText}>{statusMsg}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom */}
      {!atBottom && (
        <div style={s.scrollBtnWrap}>
          <button
            style={s.scrollBtn}
            onClick={() => { setAtBottom(true); bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
          >
            <ChevronDown size={14} color="var(--text-2)" />
          </button>
        </div>
      )}

      {/* Input */}
      <div style={s.inputWrap}>
        <div style={{ ...s.inputBox, ...(streaming ? s.inputBoxDisabled : {}) }}>
          <textarea
            style={s.textarea}
            placeholder={`Ask a question · ${providerLabel}`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={streaming}
          />
          <button
            style={{ ...s.sendBtn, ...((!input.trim() || streaming) ? s.sendBtnDisabled : s.sendBtnActive) }}
            onClick={() => handleSend()}
            disabled={!input.trim() || streaming}
          >
            {streaming
              ? <div style={s.miniSpinner} />
              : <Send size={14} color="white" />
            }
          </button>
        </div>
        <p style={s.inputHint}>Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

const s = {
  panel: { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-2)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', position: 'relative' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'rgba(17,24,39,0.8)' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  docIconWrap: { width: 28, height: 28, background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  docName: { color: 'var(--text-1)', fontSize: 13, fontWeight: 500, margin: 0, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  docMeta: { color: 'var(--text-3)', fontSize: 11, margin: 0, marginTop: 2 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' },
  messages: { flex: 1, overflowY: 'auto', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 16 },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 10, paddingTop: 40 },
  emptyIcon: { width: 52, height: 52, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: 'var(--text-2)', fontSize: 14, fontWeight: 500, margin: 0 },
  emptyUsing: { color: 'var(--text-3)', fontSize: 12, margin: 0 },
  suggestions: { display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 400, marginTop: 4 },
  suggestionBtn: { background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-2)', fontSize: 13, padding: '9px 14px', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' },
  msgRow: { display: 'flex', gap: 10, alignItems: 'flex-start', animation: 'fadeUp 0.3s cubic-bezier(0.16,1,0.3,1) both' },
  msgRowUser: { flexDirection: 'row-reverse' },
  avatar: { width: 26, height: 26, background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  bubble: { maxWidth: '75%', borderRadius: 12, padding: '10px 14px' },
  bubbleUser: { background: 'var(--blue)', borderBottomRightRadius: 4 },
  bubbleAssistant: { background: 'var(--bg-3)', border: '1px solid var(--border)', borderBottomLeftRadius: 4 },
  bubbleError: { background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.15)' },
  bubbleText: { color: 'var(--text-1)', fontSize: 14, lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' },
  cursor: { color: 'var(--text-3)', animation: 'pulse-dot 1s ease-in-out infinite' },
  providerTag: { display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, marginTop: 8, letterSpacing: '0.04em' },
  providerTagHF: { background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.15)' },
  providerTagGemini: { background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.15)' },
  sources: { marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 },
  sourcesLabel: { fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' },
  source: { display: 'flex', gap: 8, alignItems: 'flex-start' },
  sourceNum: { fontSize: 10, fontWeight: 700, color: 'var(--blue)', background: 'var(--blue-dim)', width: 16, height: 16, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  sourceText: { fontSize: 12, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 },
  statusRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' },
  statusDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', animation: 'pulse-dot 1s ease-in-out infinite', flexShrink: 0 },
  statusText: { color: 'var(--blue)', fontSize: 12, fontStyle: 'italic' },
  scrollBtnWrap: { position: 'absolute', bottom: 90, right: 18, zIndex: 10 },
  scrollBtn: { width: 30, height: 30, background: 'var(--bg-4)', border: '1px solid var(--border-2)', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
  inputWrap: { padding: '14px 18px 12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 },
  inputBox: { display: 'flex', gap: 10, alignItems: 'flex-end', background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 12, padding: '10px 12px' },
  inputBoxDisabled: { opacity: 0.7 },
  textarea: { flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-1)', fontSize: 14, resize: 'none', fontFamily: 'var(--font-body)', lineHeight: 1.5, maxHeight: 120, overflowY: 'auto' },
  sendBtn: { width: 30, height: 30, border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' },
  sendBtnActive: { background: 'var(--blue)' },
  sendBtnDisabled: { background: 'var(--bg-4)', cursor: 'not-allowed' },
  miniSpinner: { width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  inputHint: { color: 'var(--text-3)', fontSize: 11, textAlign: 'center', margin: 0 },
};