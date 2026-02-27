
// SkeletonCard.jsx — paste this in a separate file
export default function SkeletonCard() {
  return (
    <div style={sk.card}>
      <div style={{ ...sk.shimmer, width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
      <div style={sk.info}>
        <div style={{ ...sk.shimmer, width: '65%', height: 12, borderRadius: 4 }} />
        <div style={{ ...sk.shimmer, width: '40%', height: 10, borderRadius: 4, marginTop: 6 }} />
      </div>
      <div style={{ ...sk.shimmer, width: 52, height: 20, borderRadius: 20 }} />
    </div>
  );
}

const sk = {
  card: {
    background: 'var(--bg-3)',
    borderRadius: 10,
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    border: '1px solid var(--border)',
  },
  info: { flex: 1 },
  shimmer: {
    background: 'linear-gradient(90deg, var(--bg-3) 25%, var(--bg-4) 50%, var(--bg-3) 75%)',
    backgroundSize: '600px 100%',
    animation: 'shimmer 1.6s infinite',
  },
};
