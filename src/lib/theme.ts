// Shared Contract brand style helpers

export const card = {
  background: 'var(--card)',
  border: '1px solid var(--card-border)',
  borderRadius: 12,
} as React.CSSProperties;

export const cardInner = {
  background: 'var(--card-2)',
  border: '1px solid var(--card-border)',
  borderRadius: 10,
} as React.CSSProperties;

export const input = {
  background: '#0a0a0a',
  border: '1px solid var(--card-border-2)',
  borderRadius: 8,
  padding: '9px 12px',
  color: 'var(--foreground)',
  fontSize: 14,
  outline: 'none',
  width: '100%',
} as React.CSSProperties;

export const btnPrimary = {
  background: 'linear-gradient(135deg, hsl(155,84%,35%) 0%, hsl(165,80%,30%) 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '10px 22px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  letterSpacing: '0.02em',
} as React.CSSProperties;

export const btnSecondary = {
  background: 'transparent',
  color: 'var(--muted-2)',
  border: '1px solid var(--card-border-2)',
  borderRadius: 8,
  padding: '10px 18px',
  fontSize: 14,
  cursor: 'pointer',
} as React.CSSProperties;

export const badge = (color: string) => ({
  background: `${color}20`,
  color,
  padding: '3px 10px',
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  display: 'inline-block',
} as React.CSSProperties);

export const sectionTitle = {
  fontFamily: "'Bebas Neue', 'Space Grotesk', sans-serif",
  letterSpacing: '0.06em',
  fontSize: 26,
  color: '#fff',
  marginBottom: 6,
} as React.CSSProperties;

export const tableHeader = {
  padding: '10px 16px',
  textAlign: 'left' as const,
  color: 'var(--muted)',
  fontWeight: 600,
  fontSize: 10,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
};

export const statCard = (accentColor: string) => ({
  background: 'var(--card)',
  border: `1px solid ${accentColor}30`,
  borderRadius: 12,
  padding: '20px 22px',
  position: 'relative' as const,
  overflow: 'hidden',
});
