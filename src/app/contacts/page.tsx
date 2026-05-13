'use client';

import { useEffect, useState } from 'react';

type Contact = {
  id: number;
  name: string;
  email: string;
  tags: string;
  created_at: string;
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

  async function load() {
    const r = await fetch('/api/contacts');
    setContacts(await r.json());
  }

  useEffect(() => { load(); }, []);

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, email: newEmail, tags: newTags }),
    });
    if (r.ok) {
      setMsg('Contacto agregado');
      setNewName(''); setNewEmail(''); setNewTags('');
      load();
    } else {
      const d = await r.json();
      setMsg(d.error || 'Error');
    }
    setLoading(false);
    setTimeout(() => setMsg(''), 2500);
  }

  async function bulkImport() {
    setLoading(true);
    const r = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bulk: bulkText }),
    });
    const d = await r.json();
    setMsg(`${d.imported} contactos importados`);
    setBulkText('');
    load();
    setLoading(false);
    setTimeout(() => setMsg(''), 3000);
  }

  async function deleteSelected() {
    await fetch('/api/contacts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    setSelected(new Set());
    load();
  }

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.toLowerCase().includes(search.toLowerCase())
  );

  const inputStyle = {
    background: 'var(--background)',
    border: '1px solid var(--card-border)',
    borderRadius: 8,
    padding: '9px 12px',
    color: 'var(--foreground)',
    fontSize: 14,
    outline: 'none',
    width: '100%',
  };

  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Contactos</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>{contacts.length} contactos en total</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {selected.size > 0 && (
            <button
              onClick={deleteSelected}
              style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', fontSize: 14 }}
            >
              Eliminar ({selected.size})
            </button>
          )}
          {(['list', 'add', 'import'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 14, cursor: 'pointer',
                background: tab === t ? 'var(--accent)' : 'var(--card)',
                color: tab === t ? '#fff' : 'var(--foreground)',
                border: tab === t ? 'none' : '1px solid var(--card-border)',
              }}
            >
              {t === 'list' ? 'Lista' : t === 'add' ? '+ Agregar' : '⬆ Importar CSV'}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, background: 'rgba(108,99,255,0.15)', border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: 14 }}>
          {msg}
        </div>
      )}

      {tab === 'add' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ marginBottom: 20, fontWeight: 600 }}>Agregar contacto</h3>
          <form onSubmit={addContact} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Nombre</label>
              <input style={inputStyle} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Juan García" required />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Email</label>
              <input style={inputStyle} type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="juan@email.com" required />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Tags (opcional)</label>
              <input style={inputStyle} value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="vip, beta" />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '9px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' }}
            >
              Agregar
            </button>
          </form>
        </div>
      )}

      {tab === 'import' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Importar desde CSV</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
            Formato: <code style={{ background: 'var(--background)', padding: '2px 6px', borderRadius: 4 }}>email, nombre, tags</code> — una línea por contacto.
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={8}
            placeholder={'juan@email.com, Juan García, vip\nmaria@email.com, María López, beta\npedro@email.com'}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
          />
          <button
            onClick={bulkImport}
            disabled={loading || !bulkText.trim()}
            style={{ marginTop: 12, padding: '9px 24px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            {loading ? 'Importando...' : 'Importar'}
          </button>
        </div>
      )}

      {tab === 'list' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--card-border)' }}>
            <input
              type="text"
              placeholder="Buscar por nombre, email o tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, width: 320 }}
            />
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
              {contacts.length === 0 ? 'No hay contactos. Agrega o importa algunos.' : 'Sin resultados para esa búsqueda.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <th style={{ padding: '10px 16px', width: 40 }}>
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelected(new Set(filtered.map((c) => c.id)));
                        else setSelected(new Set());
                      }}
                    />
                  </th>
                  {['Nombre', 'Email', 'Tags', 'Fecha'].map((h) => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--muted)', fontWeight: 500, fontSize: 12, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <td style={{ padding: '10px 16px' }}>
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={(e) => {
                          const s = new Set(selected);
                          if (e.target.checked) s.add(c.id); else s.delete(c.id);
                          setSelected(s);
                        }}
                      />
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--muted)' }}>{c.email}</td>
                    <td style={{ padding: '10px 16px' }}>
                      {c.tags.split(',').filter(Boolean).map((t) => (
                        <span key={t} style={{ background: 'rgba(108,99,255,0.15)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 12, fontSize: 11, marginRight: 4 }}>
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
