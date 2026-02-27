
// EmptyState.jsx — paste this in a separate file
export default function EmptyState() {
  return (
    <div style={es.wrap}>
      <div style={es.icon}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="14 2 14 8 20 8" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="16" y1="13" x2="8" y2="13" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="16" y1="17" x2="8" y2="17" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <p style={es.text}>No documents yet</p>
      <p style={es.sub}>Upload a PDF or DOCX above</p>
    </div>
  );
}

const es = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '28px 16px',
    gap: 8,
  },
  icon: {
    width: 44,
    height: 44,
    background: 'var(--bg-4)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  text: {
    color: 'var(--text-2)',
    fontSize: 13,
    fontWeight: 500,
    margin: 0,
  },
  sub: {
    color: 'var(--text-3)',
    fontSize: 12,
    margin: 0,
  },
};




