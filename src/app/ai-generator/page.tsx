'use client';

import { useEffect, useState } from 'react';
import * as T from '@/lib/theme';

type GeneratedEmail = { subject: string; body: string };
type Generation = {
  id: number;
  example_emails: string;
  prompt: string;
  quantity: number;
  generated_emails: string;
  status: string;
  campaign_id: number | null;
  created_at: string;
};

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

const statusColor: Record<string, string> = {
  generating: '#3b82f6', done: '#eab308', approved: '#0f9e5e', sent: '#10b981',
};
const statusLabel: Record<string, string> = {
  generating: 'GENERANDO', done: 'PARA REVISAR', approved: 'APROBADO', sent: 'ENVIADO',
};

export default function AiGeneratorPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [exampleEmails, setExampleEmails] = useState('');
  const [prompt, setPrompt] = useState('');
  const [quantity, setQuantity] = useState(3);
  const [sendMode, setSendMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledAt, setScheduledAt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok');
  const [selected, setSelected] = useState<{ genId: number; emailIndex: number } | null>(null);
  const [previewEmail, setPreviewEmail] = useState<GeneratedEmail | null>(null);
  const [sending, setSending] = useState<number | null>(null);

  async function load() {
    const r = await fetch('/api/generate');
    setGenerations(await r.json());
  }
  useEffect(() => { load(); }, []);

  function showMsg(text: string, type: 'ok' | 'err' = 'ok') {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 5000);
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!exampleEmails.trim()) { showMsg('Pegá al menos un email de ejemplo', 'err'); return; }
    setGenerating(true);
    const r = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ example_emails: exampleEmails, prompt, quantity }),
    });
    const d = await r.json();
    if (r.ok) {
      showMsg(`✓ ${d.emails.length} email(s) generado(s). Revisalos abajo.`);
      load();
    } else {
      showMsg(d.error || 'Error al generar', 'err');
    }
    setGenerating(false);
  }

  async function approveAndSend(genId: number, emailIndex: number) {
    setSending(genId);
    const body: Record<string, unknown> = { action: 'approve_and_send', email_index: emailIndex };
    if (sendMode === 'scheduled' && scheduledAt) {
      body.scheduled_at = scheduledAt;
    }
    const r = await fetch(`/api/generate/${genId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (r.ok) {
      showMsg(`✓ Enviado a ${d.sent} contactos correctamente`);
      load();
    } else {
      showMsg(d.error || 'Error al enviar', 'err');
    }
    setSending(null);
  }

  async function deleteGen(id: number) {
    await fetch(`/api/generate/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div style={{ padding: 36, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.16em', fontWeight: 700, marginBottom: 8 }}>CONTRACT — IA</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: '0.06em', color: '#fff', lineHeight: 1, marginBottom: 8 }}>
          ✦ GENERADOR DE EMAILS IA
        </h1>
        <p style={{ color: 'var(--muted-2)', fontSize: 14 }}>
          Pegá emails de inspiración → Claude genera versiones para Contract → Aprobás → Se envían solos.
        </p>
      </div>

      {msg && (
        <div style={{
          marginBottom: 20, padding: '12px 18px', borderRadius: 8, fontSize: 14,
          background: msgType === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${msgType === 'ok' ? 'var(--success)' : 'var(--danger)'}`,
          color: msgType === 'ok' ? 'var(--success)' : 'var(--danger)',
        }}>
          {msg}
        </div>
      )}

      {/* Generator form */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 24, marginBottom: 28 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Nueva generación</h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
          Pegá uno o más emails completos de referencia (texto plano o HTML). Claude tomará el estilo, tono y estructura para crear emails de Contract.
        </p>
        <form onSubmit={generate}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
              📧 Emails de ejemplo / inspiración *
            </label>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
              Pegá los emails tal como llegaron, separados por <code style={{ background: 'var(--background)', padding: '1px 4px', borderRadius: 3 }}>---</code> si son varios.
            </p>
            <textarea
              rows={12}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }}
              value={exampleEmails}
              onChange={(e) => setExampleEmails(e.target.value)}
              placeholder={`Asunto: 🔥 No pierdas este reto
Hola [nombre],

Te escribimos porque esta semana tenemos...

(pegá aquí tus emails de referencia)

---

Asunto: Último día para unirte
Hola [nombre],

Mañana cierra el contrato de...`}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                🎯 Instrucciones adicionales para Claude
              </label>
              <textarea
                rows={3}
                style={{ ...inputStyle, resize: 'none' }}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ej: Enfocate en el feature de retos grupales. Tono motivacional. Incluí un CTA para descargar la app. Mencioná la penalización económica por fallar."
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                # Emails
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                style={{ ...inputStyle }}
              />
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Máximo 10</p>
            </div>
          </div>

          {/* Send mode */}
          <div style={{ marginBottom: 18, padding: 16, background: 'var(--background)', borderRadius: 8, border: '1px solid var(--card-border)' }}>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 10 }}>⏰ Modo de envío (al aprobar)</label>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              {(['immediate', 'scheduled'] as const).map((m) => (
                <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input type="radio" checked={sendMode === m} onChange={() => setSendMode(m)} style={{ accentColor: 'var(--accent)' }} />
                  {m === 'immediate' ? '🚀 Envío inmediato al aprobar' : '📅 Programar envío'}
                </label>
              ))}
              {sendMode === 'scheduled' && (
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  style={{ ...inputStyle, width: 'auto', flex: 1, minWidth: 200 }}
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={generating}
            style={{
              padding: '11px 28px', background: generating ? '#333' : 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 8, cursor: generating ? 'default' : 'pointer', fontWeight: 700, fontSize: 15,
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {generating ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                Claude está generando...
              </>
            ) : (
              '✦ Generar emails con Claude'
            )}
          </button>
        </form>
      </div>

      {/* Generations history */}
      {generations.length > 0 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Generaciones anteriores</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {generations.map((gen) => {
              const emails: GeneratedEmail[] = (() => {
                try { return JSON.parse(gen.generated_emails); } catch { return []; }
              })();

              return (
                <div key={gen.id} style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 12, overflow: 'hidden' }}>
                  {/* Gen header */}
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>
                        Generación #{gen.id} · {emails.length} email(s)
                      </span>
                      <span style={{ marginLeft: 12, background: `${statusColor[gen.status] || '#6b7280'}22`, color: statusColor[gen.status] || '#6b7280', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500 }}>
                        {statusLabel[gen.status] || gen.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {new Date(gen.created_at).toLocaleString('es')}
                      </span>
                      {gen.status !== 'sent' && (
                        <button onClick={() => deleteGen(gen.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18 }}>✕</button>
                      )}
                    </div>
                  </div>

                  {/* Prompt context */}
                  {gen.prompt && (
                    <div style={{ padding: '8px 20px', background: 'rgba(108,99,255,0.05)', borderBottom: '1px solid var(--card-border)', fontSize: 12, color: 'var(--muted)' }}>
                      <strong>Instrucciones:</strong> {gen.prompt}
                    </div>
                  )}

                  {/* Email cards */}
                  <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                    {emails.map((email, idx) => {
                      const isSelected = selected?.genId === gen.id && selected?.emailIndex === idx;
                      const isSending = sending === gen.id;
                      return (
                        <div
                          key={idx}
                          style={{
                            border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--card-border)'}`,
                            borderRadius: 10,
                            overflow: 'hidden',
                            background: isSelected ? 'rgba(108,99,255,0.06)' : 'var(--background)',
                          }}
                        >
                          {/* Email preview header */}
                          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--card-border)' }}>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>ASUNTO</div>
                            <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{email.subject}</div>
                          </div>

                          {/* Body preview */}
                          <div
                            style={{ padding: '10px 14px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, maxHeight: 120, overflow: 'hidden', position: 'relative' }}
                          >
                            <div
                              style={{ pointerEvents: 'none' }}
                              dangerouslySetInnerHTML={{ __html: email.body.replace(/\{\{name\}\}/g, 'Usuario').substring(0, 400) }}
                            />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(transparent, var(--background))' }} />
                          </div>

                          {/* Actions */}
                          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--card-border)', display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => setPreviewEmail(previewEmail === email ? null : email)}
                              style={{ flex: 1, padding: '6px 0', background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--card-border)', borderRadius: 7, cursor: 'pointer', fontSize: 12 }}
                            >
                              {previewEmail === email ? 'Cerrar' : '👁 Ver completo'}
                            </button>
                            {gen.status === 'done' && (
                              <>
                                <button
                                  onClick={() => setSelected(isSelected ? null : { genId: gen.id, emailIndex: idx })}
                                  style={{ flex: 1, padding: '6px 0', background: isSelected ? 'var(--accent)' : 'rgba(108,99,255,0.12)', color: isSelected ? '#fff' : 'var(--accent)', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                                >
                                  {isSelected ? '✓ Seleccionado' : 'Seleccionar'}
                                </button>
                                {isSelected && (
                                  <button
                                    onClick={() => approveAndSend(gen.id, idx)}
                                    disabled={isSending}
                                    style={{ flex: 1, padding: '6px 0', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                                  >
                                    {isSending ? '⟳ Enviando...' : '🚀 Aprobar y Enviar'}
                                  </button>
                                )}
                              </>
                            )}
                            {gen.status === 'sent' && (
                              <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                ✓ Enviado
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full preview modal */}
      {previewEmail && (
        <div
          onClick={() => setPreviewEmail(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 680, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Asunto</div>
                <div style={{ fontWeight: 700, color: '#111', fontSize: 16 }}>{previewEmail.subject}</div>
              </div>
              <button onClick={() => setPreviewEmail(null)} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: '#374151', fontSize: 13 }}>
                × Cerrar
              </button>
            </div>
            <div
              style={{ flex: 1, overflow: 'auto', padding: 24, color: '#111' }}
              dangerouslySetInnerHTML={{ __html: previewEmail.body.replace(/\{\{name\}\}/g, 'Usuario') }}
            />
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
