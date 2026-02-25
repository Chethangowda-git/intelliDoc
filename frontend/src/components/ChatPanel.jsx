import { useState, useEffect, useRef } from 'react';
import { Send, X, FileText } from 'lucide-react';
import client from '../api/client';

export default function ChatPanel({ document, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    loadHistory();
  }, [document._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadHistory() {
    try {
      const { data } = await client.get(`/api/chat/${document._id}`);
      setMessages(data.conversation.messages || []);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  }

  async function handleSend() {
    const question = input.trim();
    if (!question || streaming) return;

    setInput('');
    setStreaming(true);
    setStatusMsg('Searching document...');

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    // Add empty assistant placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: '', _streaming: true }]);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/chat/${document._id}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (separated by double newline)
        const parts = buffer.split('\n\n');
        buffer = parts.pop(); // keep incomplete part

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

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <FileText size={16} color="#3b82f6" />
          <span style={styles.docName}>{document.originalName}</span>
        </div>
        <button style={styles.closeBtn} onClick={onClose}>
          <X size={18} color="#94a3b8" />
        </button>
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.empty}>
            <p style={styles.emptyText}>Ask anything about this document</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ ...styles.message, ...(msg.role === 'user' ? styles.userMsg : styles.assistantMsg) }}>
            <p style={styles.msgText}>
              {msg.content || <span style={{ color: '#475569' }}>▋</span>}
            </p>
            {msg.sources?.length > 0 && (
              <div style={styles.sources}>
                <p style={styles.sourcesLabel}>Sources used:</p>
                {msg.sources.map((s, j) => (
                  <p key={j} style={styles.sourceItem}>[{j + 1}] {s.text}...</p>
                ))}
              </div>
            )}
          </div>
        ))}
        {statusMsg && <p style={styles.statusMsg}>{statusMsg}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <textarea
          style={styles.textarea}
          placeholder="Ask a question about this document..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={streaming}
        />
        <button
          style={{ ...styles.sendBtn, opacity: !input.trim() || streaming ? 0.5 : 1 }}
          onClick={handleSend}
          disabled={!input.trim() || streaming}
        >
          <Send size={18} color="#fff" />
        </button>
      </div>
    </div>
  );
}

const styles = {
  panel: { display: 'flex', flexDirection: 'column', height: '100%', background: '#0f172a', borderRadius: 12, border: '1px solid #1e293b' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #1e293b' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  docName: { color: '#f1f5f9', fontSize: 14, fontWeight: 500, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6 },
  messages: { flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 },
  empty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { color: '#475569', fontSize: 14, textAlign: 'center' },
  message: { padding: '10px 14px', borderRadius: 10, maxWidth: '85%' },
  userMsg: { background: '#1e3a5f', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  assistantMsg: { background: '#1e293b', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  msgText: { color: '#f1f5f9', fontSize: 14, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' },
  sources: { marginTop: 10, paddingTop: 10, borderTop: '1px solid #334155' },
  sourcesLabel: { color: '#64748b', fontSize: 12, fontWeight: 600, margin: '0 0 6px' },
  sourceItem: { color: '#475569', fontSize: 12, margin: '2px 0', lineHeight: 1.5 },
  statusMsg: { color: '#3b82f6', fontSize: 13, alignSelf: 'flex-start', padding: '4px 10px', fontStyle: 'italic' },
  inputArea: { display: 'flex', gap: 10, padding: '14px 18px', borderTop: '1px solid #1e293b', alignItems: 'flex-end' },
  textarea: { flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', padding: '10px 12px', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5 },
  sendBtn: { background: '#3b82f6', border: 'none', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
};