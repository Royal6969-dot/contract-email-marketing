'use client';

import { useEffect, useState } from 'react';
import * as T from '@/lib/theme';

type ContentItem = {
  id: number; title: string; description: string;
  planned_date: string | null;
  status: 'idea' | 'in_progress' | 'ready' | 'sent';
  campaign_id: number | null; created_at: string;
};

const statusOrder = ['idea', 'in_progress', 'ready', 'sent'] as const;
const statusLabel: Record<string, string> = { idea: 'Idea', in_progress: 'En progreso', ready: 'Listo', sent: 'Enviado' };
const statusColor: Record<string, string> = { idea: '#555', in_progress: '#eab308', ready: '#0f9e5e', sent: '#10b981' };

export default function ContentPlanPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [form, setForm] = useState({ title: '', description: '', planned_date: '', status: 'idea' as ContentItem['status'] });
  const [editId, setEditId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState('');

  async function load() { const r = await fetch('/api/content-plan'); setItems(await r.json()); }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/content-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setCreating(false);
    setForm({ title: '', description: '', planned_date: '', status: 'idea' });
    load();
  }

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/content-plan/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    setEditId(null); load();
  }

  async function deleteItem(id: number) {
    await fetch(`/api/content-plan/${id}`, { method: 'DELETE' }); load();
  }

  const grouped = statusOrder.reduce((acc, s) => { acc[s] = items.filter(i => i.status === s); return acc; }, {} as Record<string, ContentItem[]>);

  return (
    <div style={{ padding: 36, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.16em', fontWeight: 700, marginBottom: 8 }}>CONTRACT — CONTENIDO</div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: '0.06em', color: '#fff', lineHeight: 1, marginBottom: 6 }}>CONTENT PLAN EMAIL</h1>
          <p style={{ color: 'var(--muted-2)', fontSize: 14 }}>Planificá tus campañas antes de producirlas</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setView(v => v === 'kanban' ? 'list' : 'kanban')} style={{ ...T.btnSecondary, fontSize: 11, letterSpacing: '0.06em' }}>
            {view === 'kanban' ? '☰ LISTA' : '⊞ KANBAN'}
          </button>
          <button onClick={() => setCreating(true)} style={{ ...T.btnPrimary, fontSize: 12, letterSpacing: '0.08em' }}>+ NUEVA IDEA</button>
        </div>
      </div>

      {creating && (
        <div style={{ ...T.card, border: '1px solid var(--accent)', padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: '0.06em', marginBottom: 18 }}>NUEVA IDEA</h3>
          <form onSubmit={create}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 5 }}>TÍTULO *</label>
                <input style={T.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Email de bienvenida a nuevos usuarios" required />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 5 }}>FECHA</label>
                <input style={T.input} type="date" value={form.planned_date} onChange={e => setForm(f => ({ ...f, planned_date: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 5 }}>ESTADO</label>
                <select style={T.input} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ContentItem['status'] }))}>
                  {statusOrder.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 5 }}>DESCRIPCIÓN / BRIEF</label>
              <textarea rows={3} style={{ ...T.input, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Objetivo del email, tono, CTA principal..." />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={{ ...T.btnPrimary, fontSize: 12, letterSpacing: '0.08em' }}>GUARDAR</button>
              <button type="button" onClick={() => setCreating(false)} style={T.btnSecondary}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {view === 'kanban' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {statusOrder.map(status => (
            <div key={status}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor[status] }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--muted-2)' }}>{statusLabel[status].toUpperCase()}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '1px 7px', color: 'var(--muted)' }}>{grouped[status].length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {grouped[status].map(item => (
                  <div key={item.id} style={{ ...T.card, padding: 14 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.4, marginBottom: 6 }}>{item.title}</div>
                    {item.description && <div style={{ fontSize: 11, color: 'var(--muted-2)', lineHeight: 1.5, marginBottom: 8 }}>{item.description}</div>}
                    {item.planned_date && <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>📅 {new Date(item.planned_date + 'T00:00:00').toLocaleDateString('es')}</div>}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {statusOrder.filter(s => s !== status).map(s => (
                        <button key={s} onClick={() => updateStatus(item.id, s)} style={{ padding: '2px 7px', fontSize: 10, background: `${statusColor[s]}18`, color: statusColor[s], border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 700, letterSpacing: '0.04em' }}>
                          → {statusLabel[s]}
                        </button>
                      ))}
                      <button onClick={() => deleteItem(item.id)} style={{ padding: '2px 7px', fontSize: 10, background: 'rgba(220,38,38,0.1)', color: '#dc2626', border: 'none', borderRadius: 5, cursor: 'pointer', marginLeft: 'auto' }}>✕</button>
                    </div>
                  </div>
                ))}
                {grouped[status].length === 0 && (
                  <div style={{ padding: '18px 12px', textAlign: 'center', fontSize: 11, color: 'var(--muted)', border: '1px dashed var(--card-border)', borderRadius: 10 }}>—</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ ...T.card, overflow: 'hidden' }}>
          {items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-2)', fontSize: 14 }}>No hay ideas todavía.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                  {['TÍTULO', 'ESTADO', 'FECHA', 'DESCRIPCIÓN', ''].map(h => <th key={h} style={T.tableHeader}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{item.title}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {editId === item.id ? (
                        <select value={editStatus} onChange={e => setEditStatus(e.target.value)} onBlur={() => updateStatus(item.id, editStatus)} autoFocus
                          style={{ background: '#111', border: '1px solid var(--card-border)', borderRadius: 6, padding: '3px 6px', color: '#fff', fontSize: 12 }}>
                          {statusOrder.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}
                        </select>
                      ) : (
                        <span onClick={() => { setEditId(item.id); setEditStatus(item.status); }} style={{ ...T.badge(statusColor[item.status]), cursor: 'pointer' }}>
                          {statusLabel[item.status].toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 12 }}>
                      {item.planned_date ? new Date(item.planned_date + 'T00:00:00').toLocaleDateString('es') : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted-2)', maxWidth: 300, fontSize: 12 }}>{item.description}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
