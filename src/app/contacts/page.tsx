'use client';

import { useEffect, useState } from 'react';
import * as T from '@/lib/theme';

type Contact = {
  id: number; name: string; email: string; tags: string; created_at: string;
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkText, setBulkText] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTags, setNewTags] = useState('');
  const [tab, setTab] = useState<'list' | 'add' | 'import'>('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');

  async function load() { const r = await fetch('/api/contacts'); setContacts(await r.json()); }
  useEffect(() => { load(); }, []);

  function notify(text: string) { setMsg(text); setTimeout(() => setMsg(''), 3000); }

  async function addContact(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    const r = await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName, email: newEmail, tags: newTags }) });
    if (r.ok) { notify('Contacto agregado'); setNewName(''); setNewEmail(''); setNewTags(''); load(); }
    else { const d = await r.json(); notify(d.error || 'Error'); }
    setLoading(false);
  }

  async function bulkImport() {
    setLoading(true);
    const r = await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bulk: bulkText }) });
    const d = await r.json();
    notify(`${d.imported} contactos importados`);
    setBulkText(''); load(); setLoading(false);
  }

  async function deleteSelected() {
    await fetch('/api/contacts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selected) }) });
    setSelected(new Set()); load();
  }

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.tags.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 36, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.16em', fontWeight: 700, marginBottom: 8 }}>CONTRACT — DATOS</div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: '0.06em', color: '#fff', lineHeight: 1, marginBottom: 6 }}>CONTACTOS</h1>
          <p style={{ color: 'var(--muted-2)', fontSize: 14 }}>{contacts.length} contactos · {filtered.length} mostrados</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {selected.size > 0 && (
            <button onClick={deleteSelected} style={{ padding: '8px 14px', borderRadius: 7, background: 'rgba(220,38,38,0.15)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.3)', cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
              ELIMINAR ({selected.size})
            </button>
          )}
          {(['list', 'add', 'import'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 14px', borderRadius: 7, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer',
              background: tab === t ? 'var(--accent)' : 'var(--card)',
              color: tab === t ? '#fff' : 'var(--muted-2)',
              border: tab === t ? 'none' : '1px solid var(--card-border)',
            }}>
              {t === 'list' ? 'LISTA' : t === 'add' ? '+ AGREGAR' : '⬆ IMPORTAR'}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: 13 }}>
          {msg}
        </div>
      )}

      {tab === 'add' && (
        <div style={{ ...T.card, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: '0.06em', marginBottom: 18 }}>AGREGAR CONTACTO</h3>
          <form onSubmit={addContact} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 5 }}>NOMBRE</label>
              <input style={T.input} value={newName} onChange={e => setNewName(e.target.value)} placeholder="Juan García" required />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 5 }}>EMAIL</label>
              <input style={T.input} type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="juan@email.com" required />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 5 }}>TAGS</label>
              <input style={T.input} value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="vip, beta" />
            </div>
            <button type="submit" disabled={loading} style={{ ...T.btnPrimary, fontSize: 12, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>AGREGAR</button>
          </form>
        </div>
      )}

      {tab === 'import' && (
        <div style={{ ...T.card, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: '0.06em', marginBottom: 8 }}>IMPORTAR CSV</h3>
          <p style={{ fontSize: 12, color: 'var(--muted-2)', marginBottom: 14 }}>
            Formato: <code style={{ background: '#111', padding: '2px 7px', borderRadius: 4, color: 'var(--accent)' }}>email, nombre, tags</code> — una línea por contacto.
          </p>
          <textarea
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            rows={8}
            placeholder={'juan@email.com, Juan García, vip\nmaria@email.com, María López, beta\npedro@email.com'}
            style={{ ...T.input, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
          />
          <button onClick={bulkImport} disabled={loading || !bulkText.trim()} style={{ ...T.btnPrimary, marginTop: 12, fontSize: 12, letterSpacing: '0.08em' }}>
            {loading ? 'IMPORTANDO...' : 'IMPORTAR'}
          </button>
        </div>
      )}

      {tab === 'list' && (
        <div style={{ ...T.card, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-border)' }}>
            <input
              type="text"
              placeholder="Buscar por nombre, email o tag..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...T.input, width: 320 }}
            />
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-2)', fontSize: 14 }}>
              {contacts.length === 0 ? 'No hay contactos. Agregá o importá algunos.' : 'Sin resultados.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <th style={{ ...T.tableHeader, width: 40 }}>
                    <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={e => { if (e.target.checked) setSelected(new Set(filtered.map(c => c.id))); else setSelected(new Set()); }}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                  </th>
                  {['NOMBRE', 'EMAIL', 'TAGS', 'FECHA'].map(h => <th key={h} style={T.tableHeader}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--card-border)', background: selected.has(c.id) ? 'rgba(15,158,94,0.05)' : 'transparent' }}>
                    <td style={{ padding: '10px 16px' }}>
                      <input type="checkbox" checked={selected.has(c.id)} style={{ accentColor: 'var(--accent)' }}
                        onChange={e => { const s = new Set(selected); if (e.target.checked) s.add(c.id); else s.delete(c.id); setSelected(s); }}
                      />
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--muted-2)' }}>{c.email}</td>
                    <td style={{ padding: '10px 16px' }}>
                      {c.tags.split(',').filter(Boolean).map(t => (
                        <span key={t} style={{ background: 'var(--accent-dim)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 12, fontSize: 11, marginRight: 4, fontWeight: 600 }}>
                          {t.trim()}
                        </span>
                      ))}
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--muted)', fontSize: 12 }}>
                      {new Date(c.created_at).toLocaleDateString('es')}
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
