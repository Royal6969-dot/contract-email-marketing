'use client';

import { useEffect, useState } from 'react';
import * as T from '@/lib/theme';

type VideoItem = {
  id: number;
  title: string;
  concept: string;
  hook: string;
  script_notes: string;
  hashtags: string;
  format: string;
  platform: string;
  status: string;
  planned_date: string | null;
  duration_sec: number | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  created_at: string;
};

const statusOrder = ['idea', 'scripting', 'filming', 'editing', 'ready', 'published'] as const;
const statusLabel: Record<string, string> = {
  idea: 'Idea', scripting: 'Guión', filming: 'Grabando',
  editing: 'Editando', ready: 'Listo', published: 'Publicado',
};
const statusColor: Record<string, string> = {
  idea: '#555', scripting: '#3b82f6', filming: '#f59e0b',
  editing: '#a855f7', ready: '#0f9e5e', published: '#10b981',
};

const formatLabel: Record<string, string> = { vertical: '↕ Vertical (9:16)', horizontal: '↔ Horizontal (16:9)', square: '⬜ Cuadrado (1:1)' };
const platformColors: Record<string, string> = { tiktok: '#ee1d52', instagram: '#e1306c', youtube: '#ff0000', twitter: '#1da1f2' };

export default function VideoPlanPage() {
  const [items, setItems] = useState<VideoItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<VideoItem | null>(null);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [form, setForm] = useState({
    title: '', concept: '', hook: '', script_notes: '',
    hashtags: '', format: 'vertical', platform: 'instagram',
    status: 'idea', planned_date: '', duration_sec: '',
  });

  async function load() {
    const r = await fetch('/api/video-plan');
    setItems(await r.json());
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/video-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, duration_sec: form.duration_sec ? parseInt(form.duration_sec) : null }),
    });
    setCreating(false);
    setForm({ title: '', concept: '', hook: '', script_notes: '', hashtags: '', format: 'vertical', platform: 'instagram', status: 'idea', planned_date: '', duration_sec: '' });
    load();
  }

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/video-plan/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function deleteItem(id: number) {
    await fetch(`/api/video-plan/${id}`, { method: 'DELETE' });
    setSelected(null);
    load();
  }

  const grouped = statusOrder.reduce((acc, s) => {
    acc[s] = items.filter((i) => i.status === s);
    return acc;
  }, {} as Record<string, VideoItem[]>);

  const published = items.filter(i => i.status === 'published');
  const totalViews = published.reduce((s, i) => s + i.views, 0);
  const totalLikes = published.reduce((s, i) => s + i.likes, 0);

  return (
    <div style={{ padding: 36, maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.16em', fontWeight: 700, marginBottom: 8 }}>
          CONTRACT — CONTENT
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: '0.06em', color: '#fff', lineHeight: 1, marginBottom: 6 }}>
              VIDEO PLAN
            </h1>
            <p style={{ color: 'var(--muted-2)', fontSize: 14 }}>{items.length} videos en total · {published.length} publicados</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setView(v => v === 'kanban' ? 'list' : 'kanban')}
              style={{ ...T.btnSecondary, fontSize: 12, letterSpacing: '0.06em' }}
            >
              {view === 'kanban' ? '☰ LISTA' : '⊞ KANBAN'}
            </button>
            <button
              onClick={() => setCreating(true)}
              style={{ ...T.btnPrimary, fontSize: 12, letterSpacing: '0.08em' }}
            >
              + NUEVO VIDEO
            </button>
          </div>
        </div>
      </div>

      {/* Mini stats bar */}
      {published.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'PUBLICADOS', value: published.length, color: '#10b981' },
            { label: 'VIEWS TOTALES', value: totalViews.toLocaleString(), color: '#3b82f6' },
            { label: 'LIKES TOTALES', value: totalLikes.toLocaleString(), color: '#e1306c' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ ...T.card, padding: '12px 18px', flex: 1 }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Create form */}
      {creating && (
        <div style={{ ...T.card, border: '1px solid var(--accent)', padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: '0.06em', marginBottom: 20 }}>
            NUEVO VIDEO
          </h3>
          <form onSubmit={create}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>TÍTULO *</label>
                <input style={T.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Reto del gimnasio — semana 1" required />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>PLATAFORMA</label>
                <select style={T.input} value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="twitter">Twitter/X</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>FORMATO</label>
                <select style={T.input} value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))}>
                  <option value="vertical">Vertical 9:16</option>
                  <option value="horizontal">Horizontal 16:9</option>
                  <option value="square">Cuadrado 1:1</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>DURACIÓN (seg)</label>
                <input style={T.input} type="number" value={form.duration_sec} onChange={e => setForm(f => ({ ...f, duration_sec: e.target.value }))} placeholder="60" />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>HOOK — Primeros 3 segundos</label>
              <input
                style={T.input}
                value={form.hook}
                onChange={e => setForm(f => ({ ...f, hook: e.target.value }))}
                placeholder="'¿Sabías que el 92% de la gente abandona sus metas en la primera semana? Nosotros lo cambiamos...'"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>CONCEPTO / IDEA</label>
                <textarea rows={3} style={{ ...T.input, resize: 'none' }} value={form.concept} onChange={e => setForm(f => ({ ...f, concept: e.target.value }))} placeholder="Mostrar cómo funciona el reto entre amigos con penalización económica..." />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>NOTAS DE GUIÓN</label>
                <textarea rows={3} style={{ ...T.input, resize: 'none' }} value={form.script_notes} onChange={e => setForm(f => ({ ...f, script_notes: e.target.value }))} placeholder="Escena 1: Intro app / Escena 2: Demo reto / CTA: Descargá Contract..." />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 18 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>HASHTAGS</label>
                <input style={T.input} value={form.hashtags} onChange={e => setForm(f => ({ ...f, hashtags: e.target.value }))} placeholder="#contract #habitos #challenge #web3 #gym" />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>ESTADO</label>
                <select style={T.input} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {statusOrder.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>FECHA PLANIFICADA</label>
                <input style={T.input} type="date" value={form.planned_date} onChange={e => setForm(f => ({ ...f, planned_date: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={{ ...T.btnPrimary, fontSize: 12, letterSpacing: '0.08em' }}>GUARDAR VIDEO</button>
              <button type="button" onClick={() => setCreating(false)} style={T.btnSecondary}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban view */}
      {view === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${statusOrder.length}, 1fr)`, gap: 12, minWidth: 0 }}>
          {statusOrder.map(status => (
            <div key={status} style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor[status] }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--muted-2)' }}>
                  {statusLabel[status].toUpperCase()}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted)', background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '1px 7px' }}>
                  {grouped[status].length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {grouped[status].map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelected(selected?.id === item.id ? null : item)}
                    style={{
                      background: selected?.id === item.id ? 'var(--card-2)' : 'var(--card)',
                      border: `1px solid ${selected?.id === item.id ? 'var(--accent)' : 'var(--card-border)'}`,
                      borderRadius: 10,
                      padding: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {/* Platform badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: platformColors[item.platform] || '#666', fontWeight: 700, letterSpacing: '0.06em' }}>
                        {item.platform.toUpperCase()}
                      </span>
                      {item.duration_sec && (
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>{item.duration_sec}s</span>
                      )}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3, marginBottom: 6 }}>{item.title}</div>
                    {item.hook && (
                      <div style={{ fontSize: 11, color: 'var(--accent)', lineHeight: 1.4, marginBottom: 6, fontStyle: 'italic' }}>
                        "{item.hook.substring(0, 70)}{item.hook.length > 70 ? '...' : ''}"
                      </div>
                    )}
                    {item.planned_date && (
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 8 }}>
                        📅 {new Date(item.planned_date + 'T00:00:00').toLocaleDateString('es')}
                      </div>
                    )}
                    {/* Published stats */}
                    {item.status === 'published' && (item.views > 0 || item.likes > 0) && (
                      <div style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 11, color: 'var(--muted-2)' }}>
                        <span>👁 {item.views.toLocaleString()}</span>
                        <span>♥ {item.likes.toLocaleString()}</span>
                        <span>💬 {item.comments}</span>
                      </div>
                    )}
                    {/* Quick status move */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                      {statusOrder.filter(s => s !== status).slice(0, 2).map(s => (
                        <button
                          key={s}
                          onClick={() => updateStatus(item.id, s)}
                          style={{ padding: '2px 7px', fontSize: 10, background: `${statusColor[s]}15`, color: statusColor[s], border: 'none', borderRadius: 5, cursor: 'pointer', letterSpacing: '0.04em', fontWeight: 600 }}
                        >
                          → {statusLabel[s]}
                        </button>
                      ))}
                      <button
                        onClick={() => deleteItem(item.id)}
                        style={{ padding: '2px 7px', fontSize: 10, background: 'rgba(220,38,38,0.1)', color: '#dc2626', border: 'none', borderRadius: 5, cursor: 'pointer', marginLeft: 'auto' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                {grouped[status].length === 0 && (
                  <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: 11, color: 'var(--muted)', border: '1px dashed var(--card-border)', borderRadius: 10 }}>
                    —
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div style={{ ...T.card, overflow: 'hidden' }}>
          {items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-2)', fontSize: 14 }}>
              No hay videos planeados. Creá el primero.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                  {['TÍTULO', 'PLATAFORMA', 'ESTADO', 'FORMATO', 'FECHA', 'VIEWS', ''].map(h => (
                    <th key={h} style={T.tableHeader}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr
                    key={item.id}
                    onClick={() => setSelected(selected?.id === item.id ? null : item)}
                    style={{ borderBottom: '1px solid var(--card-border)', cursor: 'pointer', background: selected?.id === item.id ? 'rgba(15,158,94,0.05)' : 'transparent' }}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                      <div>{item.title}</div>
                      {item.hook && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{item.hook.substring(0, 50)}...</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, color: platformColors[item.platform] || '#666', fontWeight: 700 }}>
                        {item.platform.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={T.badge(statusColor[item.status])}>{statusLabel[item.status].toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 12 }}>
                      {formatLabel[item.format] || item.format}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 12 }}>
                      {item.planned_date ? new Date(item.planned_date + 'T00:00:00').toLocaleDateString('es') : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted-2)', fontSize: 12, fontFamily: "'Space Grotesk', monospace" }}>
                      {item.views > 0 ? item.views.toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Side panel — detail */}
      {selected && (
        <div style={{
          position: 'fixed', right: 0, top: 0, bottom: 0, width: 380,
          background: 'var(--card)',
          borderLeft: '1px solid var(--card-border)',
          display: 'flex', flexDirection: 'column',
          zIndex: 100,
          overflowY: 'auto',
        }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.1em' }}>DETALLE</div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 20 }}>×</button>
          </div>

          <div style={{ padding: 20, flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <span style={T.badge(platformColors[selected.platform] || '#666')}>{selected.platform.toUpperCase()}</span>
              <span style={T.badge(statusColor[selected.status])}>{statusLabel[selected.status].toUpperCase()}</span>
              <span style={T.badge('#555')}>{formatLabel[selected.format]}</span>
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, lineHeight: 1.3 }}>{selected.title}</h2>

            {selected.hook && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>🎣 HOOK</div>
                <div style={{ background: '#0a0a0a', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--foreground)', lineHeight: 1.6, borderLeft: '2px solid var(--accent)', fontStyle: 'italic' }}>
                  "{selected.hook}"
                </div>
              </div>
            )}

            {selected.concept && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>CONCEPTO</div>
                <div style={{ fontSize: 13, color: 'var(--muted-2)', lineHeight: 1.6 }}>{selected.concept}</div>
              </div>
            )}

            {selected.script_notes && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>NOTAS DE GUIÓN</div>
                <div style={{ background: '#0a0a0a', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--muted-2)', lineHeight: 1.7, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {selected.script_notes}
                </div>
              </div>
            )}

            {selected.hashtags && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>HASHTAGS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selected.hashtags.split(/[\s,]+/).filter(Boolean).map(h => (
                    <span key={h} style={{ background: 'var(--accent-dim)', color: 'var(--accent)', padding: '3px 9px', borderRadius: 12, fontSize: 12, fontWeight: 500 }}>{h}</span>
                  ))}
                </div>
              </div>
            )}

            {selected.planned_date && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>FECHA PLANIFICADA</div>
                <div style={{ fontSize: 13, color: 'var(--muted-2)' }}>
                  {new Date(selected.planned_date + 'T00:00:00').toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            )}

            {selected.duration_sec && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>DURACIÓN</div>
                <div style={{ fontSize: 13, color: 'var(--muted-2)' }}>{selected.duration_sec} segundos ({Math.floor(selected.duration_sec / 60)}:{String(selected.duration_sec % 60).padStart(2, '0')} min)</div>
              </div>
            )}

            {/* Move to next status */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 10 }}>MOVER A</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {statusOrder.filter(s => s !== selected.status).map(s => (
                  <button
                    key={s}
                    onClick={() => { updateStatus(selected.id, s); setSelected({ ...selected, status: s }); }}
                    style={{ padding: '7px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', background: `${statusColor[s]}18`, color: statusColor[s], border: `1px solid ${statusColor[s]}30`, borderRadius: 7, cursor: 'pointer' }}
                  >
                    {statusLabel[s].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
