'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  draft: '#6b7280',
  pending_approval: '#f59e0b',
  approved: '#6c63ff',
  sending: '#3b82f6',
  sent: '#22c55e',
  failed: '#ef4444',
};

const statusLabel: Record<string, string> = {
  draft: 'Borrador',
  pending_approval: 'Pendiente',
  approved: 'Aprobado',
  sending: 'Enviando',
  sent: 'Enviado',
  failed: 'Error',
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats').then((r) => r.json()).then(setStats);
  }, []);

  const cards = stats
    ? [
        { label: 'Contactos', value: stats.totalContacts, icon: '👥', href: '/contacts', color: '#6c63ff' },
        { label: 'Campañas', value: stats.totalCampaigns, icon: '📨', href: '/campaigns', color: '#22c55e' },
        { label: 'Emails Enviados', value: stats.totalSent, icon: '✉', href: '/campaigns', color: '#3b82f6' },
        { label: 'Pendiente Aprobación', value: stats.pendingApproval, icon: '✦', href: '/ai-generator', color: '#f59e0b' },
        { label: 'Ideas de Contenido', value: stats.contentIdeas, icon: '📅', href: '/content-plan', color: '#ec4899' },
      ]
    : [];

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Dashboard</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Bienvenido a tu plataforma de email marketing.
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        {[
          { href: '/campaigns', label: '+ Nueva Campaña', primary: true },
          { href: '/ai-generator', label: '✦ Generar con IA' },
          { href: '/contacts', label: '+ Importar Contactos' },
          { href: '/content-plan', label: '+ Agregar Idea' },
        ].map(({ href, label, primary }) => (
          <Link
            key={href}
            href={href}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
              background: primary ? 'var(--accent)' : 'var(--card)',
              color: primary ? '#fff' : 'var(--foreground)',
              border: primary ? 'none' : '1px solid var(--card-border)',
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16, marginBottom: 32 }}>
        {cards.map(({ label, value, icon, href, color }) => (
          <Link
            key={label}
            href={href}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--card-border)',
              borderRadius: 12,
              padding: 20,
              textDecoration: 'none',
              display: 'block',
              transition: 'border-color 0.15s',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color }}>{value ?? '—'}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{label}</div>
          </Link>
        ))}
      </div>

      {/* Recent campaigns */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--card-border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--card-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 600 }}>Últimas Campañas</span>
          <Link href="/campaigns" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>
            Ver todas →
          </Link>
        </div>
        {!stats || stats.recentCampaigns.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
            Aún no hay campañas.{' '}
            <Link href="/campaigns" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              Crear primera
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                {['Nombre', 'Asunto', 'Estado', 'Enviados', 'Fecha'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 20px',
                      textAlign: 'left',
                      color: 'var(--muted)',
                      fontWeight: 500,
                      fontSize: 12,
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recentCampaigns.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '12px 20px', fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--muted)' }}>{c.subject}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span
                      style={{
                        background: `${statusColor[c.status]}22`,
                        color: statusColor[c.status],
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {statusLabel[c.status] || c.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--muted)' }}>{c.total_sent}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--muted)' }}>
                    {new Date(c.created_at).toLocaleDateString('es')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
