'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as T from '@/lib/theme';

type Stats = {
  totalContacts: number;
  totalCampaigns: number;
  totalSent: number;
  pendingApproval: number;
  contentIdeas: number;
  recentCampaigns: Campaign[];
};

type Campaign = {
  id: number;
  name: string;
  subject: string;
  status: string;
  total_sent: number;
  created_at: string;
};

const statusColor: Record<string, string> = {
  draft: '#555',
  pending_approval: '#eab308',
  approved: '#0f9e5e',
  sending: '#3b82f6',
  sent: '#10b981',
  failed: '#dc2626',
};
const statusLabel: Record<string, string> = {
  draft: 'BORRADOR', pending_approval: 'PENDIENTE', approved: 'APROBADO',
  sending: 'ENVIANDO', sent: 'ENVIADO', failed: 'ERROR',
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats').then((r) => r.json()).then(setStats);
  }, []);

  const cards = stats ? [
    { label: 'CONTACTOS', value: stats.totalContacts, href: '/contacts', color: '#0f9e5e', icon: '◆' },
    { label: 'CAMPAÑAS', value: stats.totalCampaigns, href: '/campaigns', color: '#3b82f6', icon: '◉' },
    { label: 'EMAILS ENVIADOS', value: stats.totalSent, href: '/campaigns', color: '#10b981', icon: '✉' },
    { label: 'PARA APROBAR', value: stats.pendingApproval, href: '/ai-generator', color: '#eab308', icon: '✦' },
    { label: 'IDEAS CONTENIDO', value: stats.contentIdeas, href: '/content-plan', color: '#a855f7', icon: '◎' },
  ] : [];

  const quickActions = [
    { href: '/tutorial', label: '⬡ SETUP GUIDE', primary: true },
    { href: '/ai-generator', label: '✦ GENERAR IA' },
    { href: '/campaigns', label: '+ CAMPAÑA' },
    { href: '/contacts', label: '+ CONTACTOS' },
  ];

  return (
    <div style={{ padding: 36, maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.16em', fontWeight: 700, marginBottom: 8 }}>
          CONTRACT — MARKETING HUB
        </div>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 42, letterSpacing: '0.06em', color: '#fff',
          lineHeight: 1, marginBottom: 8,
        }}>
          DASHBOARD
        </h1>
        <p style={{ color: 'var(--muted-2)', fontSize: 14 }}>
          Commitment made real — monitoreá tus métricas y lanzá campañas.
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
        {quickActions.map(({ href, label, primary }) => (
          <Link
            key={href}
            href={href}
            style={{
              padding: '9px 18px',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textDecoration: 'none',
              background: primary
                ? 'linear-gradient(135deg, hsl(155,84%,35%) 0%, hsl(165,80%,30%) 100%)'
                : 'var(--card)',
              color: '#fff',
              border: primary ? 'none' : '1px solid var(--card-border-2)',
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 14, marginBottom: 32 }}>
        {cards.map(({ label, value, href, color, icon }) => (
          <Link
            key={label}
            href={href}
            style={{
              ...T.statCard(color),
              textDecoration: 'none',
              display: 'block',
            }}
          >
            {/* Glow accent corner */}
            <div style={{
              position: 'absolute', top: 0, right: 0, width: 60, height: 60,
              background: `radial-gradient(circle at top right, ${color}25 0%, transparent 70%)`,
              borderRadius: '0 12px 0 60px',
            }} />
            <div style={{ fontSize: 18, color, marginBottom: 10 }}>{icon}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif" }}>
              {value ?? '—'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6, fontWeight: 600, letterSpacing: '0.1em' }}>
              {label}
            </div>
          </Link>
        ))}
      </div>

      {/* Divider with Contract tagline */}
      <div style={{
        borderTop: '1px solid var(--card-border)',
        marginBottom: 28,
        paddingTop: 28,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.14em', fontWeight: 700 }}>
          ÚLTIMAS CAMPAÑAS
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--card-border)' }} />
        <Link href="/campaigns" style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.06em' }}>
          VER TODAS →
        </Link>
      </div>

      {/* Recent campaigns table */}
      <div style={{ ...T.card, overflow: 'hidden' }}>
        {!stats || stats.recentCampaigns.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 12, color: 'var(--muted)' }}>◈</div>
            <div style={{ color: 'var(--muted-2)', fontSize: 14, marginBottom: 16 }}>No hay campañas todavía.</div>
            <Link
              href="/campaigns"
              style={{ ...T.btnPrimary, display: 'inline-block', textDecoration: 'none', fontSize: 12, letterSpacing: '0.08em' }}
            >
              CREAR PRIMERA CAMPAÑA
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                {['NOMBRE', 'ASUNTO', 'ESTADO', 'ENVIADOS', 'FECHA'].map((h) => (
                  <th key={h} style={T.tableHeader}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recentCampaigns.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '13px 16px', fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '13px 16px', color: 'var(--muted-2)', fontSize: 12 }}>{c.subject}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={T.badge(statusColor[c.status] || '#555')}>
                      {statusLabel[c.status] || c.status}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', color: 'var(--muted-2)', fontFamily: "'Space Grotesk', monospace" }}>
                    {c.total_sent.toLocaleString()}
                  </td>
                  <td style={{ padding: '13px 16px', color: 'var(--muted)', fontSize: 12 }}>
                    {new Date(c.created_at).toLocaleDateString('es')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bottom tagline */}
      <div style={{ marginTop: 40, textAlign: 'center', fontSize: 11, color: 'var(--card-border-2)', letterSpacing: '0.12em' }}>
        CONTRACT · COMMITMENT MADE REAL · contractapp.net
      </div>
    </div>
  );
}
