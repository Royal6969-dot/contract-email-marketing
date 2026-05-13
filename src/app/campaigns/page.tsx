'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  draft: '#6b7280', pending_approval: '#f59e0b', approved: '#6c63ff',
  sending: '#3b82f6', sent: '#22c55e', failed: '#ef4444',
};
const statusLabel: Record<string, string> = {
  draft: 'Borrador', pending_approval: 'Pendiente', approved: 'Aprobado',
  sending: 'Enviando...', sent: 'Enviado', failed: 'Error',
};

const inputStyle = {
  background: 'var(--background)', border: '1px solid var(--card-border)',
  borderRadius: 8, padding: '9px 12px', color: 'var(--foreground)', fontSize: 14, outline: 'none', width: '100%',
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<Campaign | null>(null);
  const [form, setForm] = useState({ name: '', subject: '', body: '', contact_filter: '', scheduled_at: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    const r = await fetch('/api/campaigns');
    setCampaigns(await r.json());
  }
  useEffect(() => { load(); }, []);

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await fetch('/api/campaigns', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    if (r.ok) {
      setCreating(false);
      setForm({ name: '', subject: '', body: '', contact_filter: '', scheduled_at: '' });
      load();
      setMsg('Campaña creada');
    }
    setLoading(false);
    setTimeout(() => setMsg(''), 2500);
  }

  async function approve(id: number) {
    await fetch(`/api/campaigns/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'approved' }) });
    load();
  }

  async function sendCampaign(id: number) {
    setMsg('Enviando...');
    const r = await fetch(`/api/campaigns/${id}/send`, { method: 'POST' });
    const d = await r.json();
    if (r.ok) setMsg(`✓ Enviado a ${d.sent} contactos${d.failed > 0 ? ` (${d.failed} fallidos)` : ''}`);
    else setMsg(`Error: ${d.error}`);
    load();
    setTimeout(() => setMsg(''), 5000);
  }

  async function deleteCampaign(id: number) {
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
    setPreview(null);
    load();
  }

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Campañas</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>{campaigns.length} campañas en total</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          style={{ padding: '10px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          + Nueva Campaña
        </button>
      </div>

      {msg && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, background: 'rgba(108,99,255,0.1)', border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: 14 }}>
          {msg}
        </div>
      )}

      {/* Create form */}
      {creating && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--accent)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 20 }}>Nueva Campaña</h3>
          <form onSubmit={createCampaign}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Nombre interno *</label>
                <input style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Lanzamiento Semana 1" required />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Asunto del email *</label>
                <input style={inputStyle} value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="¿Listo para el reto?" required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Filtrar por tag (vacío = todos)</label>
                <input style={inputStyle} value={form.contact_filter} onChange={(e) => setForm((f) => ({ ...f, contact_filter: e.target.value }))} placeholder="vip" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Programar envío (opcional)</label>
                <input style={inputStyle} type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                Cuerpo del email (HTML). Usa <code style={{ background: 'var(--background)', padding: '1px 4px', borderRadius: 3 }}>{'{{name}}'}</code> para personalizar.
              </label>
              <textarea
                rows={10}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="<h2>Hola {{name}}!</h2><p>Te escribimos desde Contract...</p>"
                required
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={loading} style={{ padding: '9px 24px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                {loading ? 'Creando...' : 'Crear campaña'}
              </button>
              <button type="button" onClick={() => setCreating(false)} style={{ padding: '9px 16px', background: 'transparent', color: 'var(--muted)', border: '1px solid var(--card-border)', borderRadius: 8, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Two-column: list + preview */}
      <div style={{ display: 'grid', gridTemplateColumns: preview ? '1fr 420px' : '1fr', gap: 20 }}>
        {/* List */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 12, overflow: 'hidden' }}>
          {campaigns.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
              No hay campañas aún. Crea la primera arriba.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                  {['Nombre', 'Asunto', 'Estado', 'Enviados', 'Acciones'].map((h) => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--muted)', fontWeight: 500, fontSize: 12, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setPreview(preview?.id === c.id ? null : c)}
                    style={{ borderBottom: '1px solid var(--card-border)', cursor: 'pointer', background: preview?.id === c.id ? 'rgba(108,99,255,0.07)' : 'transparent' }}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{c.subject}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: `${statusColor[c.status]}22`, color: statusColor[c.status], padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                        {statusLabel[c.status] || c.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{c.total_sent}</td>
                    <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(c.status === 'draft') && (
                          <button onClick={() => approve(c.id)} style={{ padding: '4px 10px', background: 'rgba(108,99,255,0.15)', color: 'var(--accent)', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                            Aprobar
                          </button>
                        )}
                        {(c.status === 'approved' || c.status === 'draft') && (
                          <button onClick={() => sendCampaign(c.id)} style={{ padding: '4px 10px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                            Enviar
                          </button>
                        )}
                        <button onClick={() => deleteCampaign(c.id)} style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
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
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 12, overflow: 'hidden', position: 'sticky', top: 20, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Vista previa</span>
              <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Asunto</div>
              <div style={{ fontWeight: 500, marginTop: 2 }}>{preview.subject}</div>
              {preview.contact_filter && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Tag: <span style={{ color: 'var(--accent)' }}>{preview.contact_filter}</span></div>}
            </div>
            <div
              style={{ flex: 1, overflow: 'auto', padding: 18 }}
              dangerouslySetInnerHTML={{ __html: preview.body.replace(/\{\{name\}\}/g, 'Usuario') }}
            />
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, padding: 16, background: 'var(--card)', borderRadius: 10, border: '1px solid var(--card-border)', fontSize: 13, color: 'var(--muted)' }}>
        💡 También podés generar emails con IA desde la sección{' '}
        <Link href="/ai-generator" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Generador IA</Link> — se crearán automáticamente y podrás aprobarlos con un click.
      </div>
    </div>
  );
}
