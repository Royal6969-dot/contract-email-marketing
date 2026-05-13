'use client';

import { useEffect, useState } from 'react';

type ContentItem = {
  id: number;
  title: string;
  description: string;
  planned_date: string | null;
  status: 'idea' | 'in_progress' | 'ready' | 'sent';
  campaign_id: number | null;
  created_at: string;
};

const statusOrder = ['idea', 'in_progress', 'ready', 'sent'] as const;
const statusLabel: Record<string, string> = { idea: 'Idea', in_progress: 'En progreso', ready: 'Listo', sent: 'Enviado' };
const statusColor: Record<string, string> = { idea: '#6b7280', in_progress: '#f59e0b', ready: '#6c63ff', sent: '#22c55e' };

const inputStyle = {
  background: 'var(--background)', border: '1px solid var(--card-border)',
  borderRadius: 8, padding: '9px 12px', color: 'var(--foreground)', fontSize: 14, outline: 'none', width: '100%',
};

export default function ContentPlanPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', planned_date: '', status: 'idea' as ContentItem['status'] });
  const [editId, setEditId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  async function load() {
    const r = await fetch('/api/content-plan');
    setItems(await r.json());
  }
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
    setEditId(null);
    load();
  }

  async function deleteItem(id: number) {
    await fetch(`/api/content-plan/${id}`, { method: 'DELETE' });
    load();
  }

  const grouped = statusOrder.reduce((acc, s) => {
    acc[s] = items.filter((i) => i.status === s);
    return acc;
  }, {} as Record<string, ContentItem[]>);

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Plan de Contenido</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Organiza tus ideas de email antes de producirlas</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setView(view === 'kanban' ? 'list' : 'kanban')} style={{ padding: '8px 14px', background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--foreground)', cursor: 'pointer', fontSize: 13 }}>
            {view === 'kanban' ? '☰ Lista' : '⊞ Kanban'}
          </button>
          <button onClick={() => setCreating(true)} style={{ padding: '8px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            + Nueva Idea
          </button>
        </div>
      </div>

      {creating && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--accent)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 18 }}>Nueva idea de contenido</h3>
          <form onSubmit={create}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Título *</label>
                <input style={inputStyle} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Email de bienvenida a nuevos usuarios" required />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Fecha planificada</label>
                <input style={inputStyle} type="date" value={form.planned_date} onChange={(e) => setForm((f) => ({ ...f, planned_date: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Estado</label>
                <select style={inputStyle} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ContentItem['status'] }))}>
                  {statusOrder.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Descripción / notas</label>
              <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief del email, tono, objetivo..." />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={{ padding: '8px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Guardar</button>
              <button type="button" onClick={() => setCreating(false)} style={{ padding: '8px 16px', background: 'transparent', color: 'var(--muted)', border: '1px solid var(--card-border)', borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {view === 'kanban' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {statusOrder.map((status) => (
            <div key={status}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor[status], display: 'inline-block' }} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>{statusLabel[status]}</span>
                <span style={{ marginLeft: 'auto', background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '1px 8px', fontSize: 11, color: 'var(--muted)' }}>
                  {grouped[status].length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 80 }}>
                {grouped[status].map((item) => (
                  <div key={item.id} style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 6, lineHeight: 1.4 }}>{item.title}</div>
                    {item.description && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, lineHeight: 1.5 }}>{item.description}</div>}
                    {item.planned_date && (
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                        📅 {new Date(item.planned_date + 'T00:00:00').toLocaleDateString('es')}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {statusOrder.filter((s) => s !== status).map((s) => (
                        <button key={s} onClick={() => updateStatus(item.id, s)} style={{ padding: '2px 8px', fontSize: 11, background: `${statusColor[s]}18`, color: statusColor[s], border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                          → {statusLabel[s]}
                        </button>
                      ))}
                      <button onClick={() => deleteItem(item.id)} style={{ padding: '2px 8px', fontSize: 11, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 6, cursor: 'pointer', marginLeft: 'auto' }}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 12, overflow: 'hidden' }}>
          {items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>No hay ideas aún.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                  {['Título', 'Estado', 'Fecha', 'Descripción', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--muted)', fontWeight: 500, fontSize: 12, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{item.title}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {editId === item.id ? (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          onBlur={() => updateStatus(item.id, editStatus)}
                          autoFocus
                          style={{ background: 'var(--background)', border: '1px solid var(--card-border)', borderRadius: 6, padding: '3px 6px', color: 'var(--foreground)', fontSize: 13 }}
                        >
                          {statusOrder.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
                        </select>
                      ) : (
                        <span
                          onClick={() => { setEditId(item.id); setEditStatus(item.status); }}
                          style={{ background: `${statusColor[item.status]}22`, color: statusColor[item.status], padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                        >
                          {statusLabel[item.status]}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 12 }}>
                      {item.planned_date ? new Date(item.planned_date + 'T00:00:00').toLocaleDateString('es') : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', maxWidth: 300 }}>{item.description}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}>✕</button>
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
