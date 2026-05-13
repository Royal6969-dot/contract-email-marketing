'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/', label: 'Dashboard', icon: '◈', section: null },
  { href: '/campaigns', label: 'Campañas Email', icon: '◉', section: 'EMAIL' },
  { href: '/ai-generator', label: 'Generador IA', icon: '✦', section: 'EMAIL' },
  { href: '/content-plan', label: 'Content Email', icon: '◎', section: 'EMAIL' },
  { href: '/video-plan', label: 'Content Video', icon: '▷', section: 'VIDEO & SOCIAL' },
  { href: '/instagram', label: 'Instagram Stats', icon: '◌', section: 'VIDEO & SOCIAL' },
  { href: '/contacts', label: 'Contactos', icon: '◆', section: 'DATOS' },
  { href: '/settings', label: 'Configuración', icon: '◇', section: 'DATOS' },
];

const sections = ['EMAIL', 'VIDEO & SOCIAL', 'DATOS'];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 230,
        minHeight: '100vh',
        background: 'var(--card)',
        borderRight: '1px solid var(--card-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '22px 20px 20px', borderBottom: '1px solid var(--card-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, hsl(155,84%,35%) 0%, hsl(165,80%,30%) 100%)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 900, color: '#fff',
            fontFamily: "'Bebas Neue', sans-serif",
            letterSpacing: '0.05em',
          }}>C</div>
          <div>
            <div style={{
              fontSize: 18, fontWeight: 700, color: '#fff',
              fontFamily: "'Bebas Neue', 'Space Grotesk', sans-serif",
              letterSpacing: '0.08em',
              lineHeight: 1,
            }}>CONTRACT</div>
            <div style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.12em', marginTop: 2, fontWeight: 500 }}>
              MARKETING HUB
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>

        {/* Dashboard solo */}
        {nav.filter(n => !n.section).map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <NavItem key={href} href={href} label={label} icon={icon} active={active} />
          );
        })}

        {sections.map(section => {
          const items = nav.filter(n => n.section === section);
          return (
            <div key={section} style={{ marginTop: 20 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: 'var(--muted)',
                letterSpacing: '0.14em', padding: '0 10px', marginBottom: 6,
              }}>
                {section}
              </div>
              {items.map(({ href, label, icon }) => {
                const active = pathname === href;
                return <NavItem key={href} href={href} label={label} icon={icon} active={active} />;
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--card-border)',
        fontSize: 10,
        color: 'var(--muted)',
        letterSpacing: '0.06em',
      }}>
        CONTRACT v1.0 · MARKETING HUB
      </div>
    </aside>
  );
}

function NavItem({ href, label, icon, active }: { href: string; label: string; icon: string; active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '8px 10px',
        borderRadius: 7,
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? '#fff' : 'var(--muted-2)',
        background: active ? 'var(--accent-dim)' : 'transparent',
        borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
        textDecoration: 'none',
        marginBottom: 1,
        transition: 'all 0.12s',
        letterSpacing: '0.01em',
      }}
    >
      <span style={{ fontSize: 13, color: active ? 'var(--accent)' : 'var(--muted)' }}>{icon}</span>
      {label}
    </Link>
  );
}
