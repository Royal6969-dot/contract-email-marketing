'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as T from '@/lib/theme';

type Campaign = {
  id: number;
  name: string;
  subject: string;
  body: string;
  status: string;
  contact_filter: string;
  scheduled_at: string | null;
  sent_at: string | null;
  total_sent: number;
  created_at: string;
};

const statusColor: Record<string, string> = {
  draft: '#444', pending_approval: '#eab308', approved: '#0f9e5e',
  sending: '#3b82f6', sent: '#10b981', failed: '#dc2626',
};
const statusLabel: Record<string, string> = {
  draft: 'BORRADOR', pending_approval: 'PENDIENTE', approved: 'APROBADO',
  sending: 'ENVIANDO', sent: 'ENVIADO', failed: 'ERROR',
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<Campaign | null>(null);
  const [form, setForm] = useState({ name: '', subject: '', body: '', contact_filter: '', scheduled_at: '' });
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState(true);
  const [loading, setLoading] = useState(false);

  async function load() {
    const r = await fetch('/api/campaigns');
    setCampaigns(await r.json());
  }
  useEffect(() => { load(); }, []);

  function notify(text: string, ok = true) {
    setMsg(text); setMsgOk(ok);
    setTimeout(() => setMsg(''), 4000);
  }

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await fetch('/api/campaigns', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    if (r.ok) { setCreating(false); setForm({ name: '', subject: '', body: '', contact_filter: '', scheduled_at: '' }); load(); notify('Campaña creada'); }
    setLoading(false);
  }

  async function approve(id: number) {
    await fetch(`/api/campaigns/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'approved' }) });
    load();
  }

  async function sendCampaign(id: number) {
    notify('Enviando...', true);
    const r = await fetch(`/api/campaigns/${id}/send`, { method: 'POST' });
    const d = await r.json();
    if (r.ok) notify(`✓ Enviado a ${d.sent} contactos${d.failed > 0 ? ` (${d.failed} fallidos)` : ''}`, true);
    else notify(`Error: ${d.error}`, false);
    load();
  }

  async function deleteCampaign(id: number) {
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
    setPreview(null); load();
  }

  return (
    <div style={{ padding: 36, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.16em', fontWeight: 700, marginBottom: 8 }}>CONTRACT — EMAIL</div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: '0.06em', color: '#fff', lineHeight: 1, marginBottom: 6 }}>CAMPAÑAS</h1>
          <p style={{ color: 'var(--muted-2)', fontSize: 14 }}>{campaigns.length} campañas en total</p>
        </div>
        <button onClick={() => setCreating(true)} style={{ ...T.btnPrimary, fontSize: 12, letterSpacing: '0.08em' }}>
          + NUEVA CAMPAÑA
        </button>
      </div>

      {msg && (
        <div style={{ marginBottom: 16, padding: '11px 18px', borderRadius: 8, fontSize: 14,
          background: msgOk ? 'rgba(16,185,129,0.1)' : 'rgba(220,38,38,0.1)',
          border: `1px solid ${msgOk ? '#10b981' : '#dc2626'}`,
          color: msgOk ? '#10b981' : '#dc2626',
        }}>{msg}</div>
      )}

      {/* Create form */}
      {creating && (
        <div style={{ ...T.card, border: '1px solid var(--accent)', padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: '0.06em', marginBottom: 20 }}>NUEVA CAMPAÑA</h3>
          <form onSubmit={createCampaign}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 5 }}>NOMBRE INTERNO *</label>
                <input style={T.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Lanzamiento Semana 1" required />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 5 }}>ASUNTO DEL EMAIL *</label>
                <input style={T.input} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="¿Listo para el reto?" required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 5 }}>FILTRAR POR TAG (vacío = todos)</label>
                <input style={T.input} value={form.contact_filter} onChange={e => setForm(f => ({ ...f, contact_filter: e.target.value }))} placeholder="vip" />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 5 }}>PROGRAMAR ENVÍO (opcional)</label>
                <input style={T.input} type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 5 }}>
                CUERPO HTML — usá <code style={{ background: '#111', padding: '1px 5px', borderRadius: 3 }}>{'{{name}}'}</code> para personalizar
              </label>
              <textarea
                rows={10}
                style={{ ...T.input, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="<h2>Hola {{name}}!</h2><p>Te escribimos desde Contract...</p>"
                required
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={loading} style={{ ...T.btnPrimary, fontSize: 12, letterSpacing: '0.08em' }}>
                {loading ? 'CREANDO...' : 'CREAR CAMPAÑA'}
              </button>
              <button type="button" onClick={() => setCreating(false)} style={T.btnSecondary}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Two-column: list + preview */}
      <div style={{ display: 'grid', gridTemplateColumns: preview ? '1fr 400px' : '1fr', gap: 20 }}>
        <div style={{ ...T.card, overflow: 'hidden' }}>
          {campaigns.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 28, color: 'var(--muted)', marginBottom: 12 }}>◉</div>
              <div style={{ color: 'var(--muted-2)', fontSize: 14, marginBottom: 16 }}>No hay campañas. Creá la primera o generá con IA.</div>
              <Link href="/ai-generator" style={{ ...T.btnPrimary, display: 'inline-block', textDecoration: 'none', fontSize: 12, letterSpacing: '0.08em' }}>
                ✦ GENERAR CON IA
              </Link>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                  {['NOMBRE', 'ASUNTO', 'ESTADO', 'ENVIADOS', 'ACCIONES'].map(h => (
                    <th key={h} style={T.tableHeader}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => setPreview(preview?.id === c.id ? null : c)}
                    style={{ borderBottom: '1px solid var(--card-border)', cursor: 'pointer', background: preview?.id === c.id ? 'rgba(15,158,94,0.06)' : 'transparent' }}
                  >
                    <td style={{ padding: '13px 16px', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '13px 16px', color: 'var(--muted-2)', fontSize: 12 }}>{c.subject}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={T.badge(statusColor[c.status] || '#444')}>{statusLabel[c.status] || c.status}</span>
                    </td>
                    <td style={{ padding: '13px 16px', color: 'var(--muted-2)', fontFamily: "'Space Grotesk', monospace" }}>{c.total_sent}</td>
                    <td style={{ padding: '13px 16px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {c.status === 'draft' && (
                          <button onClick={() => approve(c.id)} style={{ padding: '4px 10px', background: 'var(--accent-dim)', color: 'var(--accent)', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                            APROBAR
                          </button>
                        )}
                        {(c.status === 'approved' || c.status === 'draft') && (
                          <button onClick={() => sendCampaign(c.id)} style={{ padding: '4px 10px', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                            ENVIAR
                          </button>
                        )}
                        <button onClick={() => deleteCampaign(c.id)} style={{ padding: '4px 10px', background: 'rgba(220,38,38,0.1)', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Preview panel */}
        {preview && (
          <div style={{ ...T.card, overflow: 'hidden', position: 'sticky', top: 20, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.1em' }}>VISTA PREVIA</span>
              <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 4 }}>ASUNTO</div>
              <div style={{ fontWeight: 600 }}>{preview.subject}</div>
              {preview.contact_filter && (
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                  Tag: <span style={{ color: 'var(--accent)' }}>{preview.contact_filter}</span>
                </div>
              )}
            </div>
            <div
              style={{ flex: 1, overflow: 'auto', padding: 16, background: '#fff', color: '#111' }}
              dangerouslySetInnerHTML={{ __html: preview.body.replace(/\{\{name\}\}/g, 'Usuario') }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
