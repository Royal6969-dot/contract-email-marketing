'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/', label: 'Dashboard', icon: '⬡' },
  { href: '/campaigns', label: 'Campañas', icon: '📨' },
  { href: '/ai-generator', label: 'Generador IA', icon: '✦' },
  { href: '/content-plan', label: 'Plan de Contenido', icon: '📅' },
  { href: '/contacts', label: 'Contactos', icon: '👥' },
  { href: '/settings', label: 'Configuración', icon: '⚙' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 220,
        minHeight: '100vh',
        background: 'var(--card)',
        borderRight: '1px solid var(--card-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '0 20px 28px', borderBottom: '1px solid var(--card-border)' }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--foreground)' }}>
          <span style={{ color: 'var(--accent)' }}>C</span>ontract
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Email Marketing Platform</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 10px' }}>
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--accent)' : 'var(--muted)',
                background: active ? 'rgba(108,99,255,0.12)' : 'transparent',
                textDecoration: 'none',
                marginBottom: 2,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16 }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--card-border)', fontSize: 11, color: 'var(--muted)' }}>
        v1.0 · Contract © 2025
      </div>
    </aside>
  );
}
