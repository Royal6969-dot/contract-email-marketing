'use client';

import { useEffect, useState, useRef } from 'react';
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

const statusColor: Record<string, string> = {
  generating: '#3b82f6', done: '#eab308', approved: '#0f9e5e', sent: '#10b981',
};
const statusLabel: Record<string, string> = {
  generating: 'GENERANDO', done: 'PARA REVISAR', approved: 'APROBADO', sent: 'ENVIADO',
};

const PROMPT_SUGGESTIONS = [
  'Enfocate en los retos grupales y la penalización económica. Tono motivacional y urgente.',
  'Destacá el feature de verificación con fotos. CTA claro para descargar la app.',
  'Email de bienvenida para nuevos usuarios. Explicá cómo funciona el ESCROW.',
  'Email de reactivación para usuarios que no usaron la app en 2 semanas.',
  'Promocionando el ranking global y las recompensas para los que cumplen.',
];

export default function AiGeneratorPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [exampleEmails, setExampleEmails] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; content: string }[]>([]);
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
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const r = await fetch('/api/generate');
    setGenerations(await r.json());
  }
  useEffect(() => { load(); }, []);

  function showMsg(text: string, type: 'ok' | 'err' = 'ok') {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(''), 5000);
  }

  function readFiles(files: FileList | File[]) {
    Array.from(files).forEach(file => {
      if (!file.name.match(/\.(txt|eml|html|htm|md)$/i) && file.type && !file.type.includes('text')) {
        showMsg(`"${file.name}" no es un formato válido (usá .txt, .eml o .html)`, 'err');
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target?.result as string;
        setUploadedFiles(prev => {
          if (prev.find(f => f.name === file.name)) return prev;
          return [...prev, { name: file.name, content }];
        });
      };
      reader.readAsText(file);
    });
  }

  function removeFile(name: string) {
    setUploadedFiles(prev => prev.filter(f => f.name !== name));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    readFiles(e.dataTransfer.files);
  }

  // Build the full example text combining textarea + uploaded files
  function buildExampleText() {
    const parts: string[] = [];
    if (exampleEmails.trim()) parts.push(exampleEmails.trim());
    uploadedFiles.forEach(f => parts.push(`--- ${f.name} ---\n${f.content}`));
    return parts.join('\n\n---\n\n');
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    const combined = buildExampleText();
    if (!combined) { showMsg('Pegá al menos un email de ejemplo o subí un archivo', 'err'); return; }
    setGenerating(true);
    const r = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ example_emails: combined, prompt, quantity }),
    });
    const d = await r.json();
    if (r.ok) { showMsg(`✓ ${d.emails.length} email(s) generado(s). Revisalos abajo.`); load(); }
    else showMsg(d.error || 'Error al generar', 'err');
    setGenerating(false);
  }

  async function approveAndSend(genId: number, emailIndex: number) {
    setSending(genId);
    const body: Record<string, unknown> = { action: 'approve_and_send', email_index: emailIndex };
    if (sendMode === 'scheduled' && scheduledAt) body.scheduled_at = scheduledAt;
    const r = await fetch(`/api/generate/${genId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const d = await r.json();
    if (r.ok) {
      if (d.scheduled) showMsg(`✓ Programado para enviar el ${new Date(d.scheduled_at).toLocaleString('es')}`);
      else showMsg(`✓ Enviado a ${d.sent} contactos`);
      load();
    } else showMsg(d.error || 'Error al enviar', 'err');
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
          Subí o pegá emails de inspiración → Claude genera versiones para Contract → Aprobás → Se envían solos.
        </p>
      </div>

      {msg && (
        <div style={{ marginBottom: 20, padding: '12px 18px', borderRadius: 8, fontSize: 14,
          background: msgType === 'ok' ? 'rgba(15,158,94,0.1)' : 'rgba(220,38,38,0.1)',
          border: `1px solid ${msgType === 'ok' ? 'var(--accent)' : '#dc2626'}`,
          color: msgType === 'ok' ? 'var(--accent)' : '#dc2626',
        }}>{msg}</div>
      )}

      {/* Generator form */}
      <div style={{ ...T.card, padding: 28, marginBottom: 28 }}>
        <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: '0.06em', marginBottom: 4 }}>
          NUEVA GENERACIÓN
        </h3>
        <p style={{ fontSize: 13, color: 'var(--muted-2)', marginBottom: 24 }}>
          Podés subir archivos (.txt .eml .html) o pegar el texto directamente. Cuantos más ejemplos mejor.
        </p>

        <form onSubmit={generate}>

          {/* File drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--accent)' : '#2a2a2a'}`,
              borderRadius: 10,
              padding: '22px 20px',
              marginBottom: 16,
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'rgba(15,158,94,0.05)' : '#0a0a0a',
              transition: 'all 0.15s',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.eml,.html,.htm,.md"
              multiple
              style={{ display: 'none' }}
              onChange={e => e.target.files && readFiles(e.target.files)}
            />
            <div style={{ fontSize: 24, marginBottom: 8, color: dragOver ? 'var(--accent)' : 'var(--muted)' }}>⬆</div>
            <div style={{ fontSize: 14, color: dragOver ? 'var(--accent)' : 'var(--muted-2)', fontWeight: 500 }}>
              Arrastrá archivos acá o hacé click para seleccionar
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
              Formatos: .txt · .eml · .html — podés subir varios a la vez
            </div>
          </div>

          {/* Uploaded files chips */}
          {uploadedFiles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {uploadedFiles.map(f => (
                <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(15,158,94,0.12)', border: '1px solid rgba(15,158,94,0.3)', borderRadius: 20, padding: '4px 10px 4px 12px', fontSize: 12, color: 'var(--accent)' }}>
                  <span>📄 {f.name}</span>
                  <button type="button" onClick={() => removeFile(f.name)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                </div>
              ))}
            </div>
          )}

          {/* Text paste area */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 8 }}>
              O PEGÁ EL TEXTO DIRECTO {uploadedFiles.length > 0 ? '(adicional a los archivos)' : ''}
            </label>
            <textarea
              rows={8}
              style={{ ...T.input, resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }}
              value={exampleEmails}
              onChange={e => setExampleEmails(e.target.value)}
              placeholder={`Asunto: 🔥 No pierdas este reto\nHola [nombre],\n\nTe escribimos porque esta semana...\n\n(pegá aquí uno o más emails de referencia, separados por ---)`}
            />
          </div>

          {/* Prompt */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 8 }}>
              🎯 INSTRUCCIONES PARA CLAUDE
            </label>
            {/* Suggestion chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {PROMPT_SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(s)}
                  style={{ padding: '4px 12px', background: prompt === s ? 'var(--accent-dim)' : '#111', border: `1px solid ${prompt === s ? 'var(--accent)' : '#333'}`, borderRadius: 20, fontSize: 11, color: prompt === s ? 'var(--accent)' : 'var(--muted-2)', cursor: 'pointer' }}
                >
                  {s.substring(0, 45)}...
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              style={{ ...T.input, resize: 'none' }}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Ej: Enfocate en el feature de retos grupales. Tono motivacional. CTA para descargar la app."
            />
          </div>

          {/* Quantity + send mode */}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16, marginBottom: 20, padding: 16, background: '#0a0a0a', borderRadius: 10, border: '1px solid var(--card-border)' }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 8 }}>
                # EMAILS A GENERAR
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setQuantity(n)}
                    style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${quantity === n ? 'var(--accent)' : '#333'}`, background: quantity === n ? 'var(--accent-dim)' : 'transparent', color: quantity === n ? 'var(--accent)' : 'var(--muted-2)', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 8 }}>
                ⏰ MODO DE ENVÍO (al aprobar)
              </label>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                {(['immediate', 'scheduled'] as const).map(m => (
                  <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                    <input type="radio" checked={sendMode === m} onChange={() => setSendMode(m)} style={{ accentColor: 'var(--accent)' }} />
                    {m === 'immediate' ? '🚀 Inmediato' : '📅 Programado'}
                  </label>
                ))}
                {sendMode === 'scheduled' && (
                  <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                    style={{ ...T.input, width: 'auto', flex: 1, minWidth: 200 }} />
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={generating}
            style={{ ...T.btnPrimary, fontSize: 14, letterSpacing: '0.06em', padding: '13px 32px', opacity: generating ? 0.7 : 1 }}
          >
            {generating ? '⟳ Claude está generando...' : '✦ GENERAR EMAILS CON CLAUDE'}
          </button>
        </form>
      </div>

      {/* Generations list */}
      {generations.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', fontWeight: 700 }}>GENERACIONES ANTERIORES</span>
            <div style={{ flex: 1, height: 1, background: 'var(--card-border)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {generations.map(gen => {
              const emails: GeneratedEmail[] = (() => { try { return JSON.parse(gen.generated_emails); } catch { return []; } })();

              return (
                <div key={gen.id} style={{ ...T.card, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>Gen #{gen.id} · {emails.length} email(s)</span>
                      <span style={{ ...T.badge(statusColor[gen.status] || '#555') }}>{statusLabel[gen.status] || gen.status}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(gen.created_at).toLocaleString('es')}</span>
                      {gen.status !== 'sent' && (
                        <button onClick={() => deleteGen(gen.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18 }}>✕</button>
                      )}
                    </div>
                  </div>

                  {gen.prompt && (
                    <div style={{ padding: '8px 20px', background: 'rgba(15,158,94,0.04)', borderBottom: '1px solid var(--card-border)', fontSize: 12, color: 'var(--muted)' }}>
                      <strong style={{ color: 'var(--muted-2)' }}>Instrucciones:</strong> {gen.prompt}
                    </div>
                  )}

                  <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {emails.map((email, idx) => {
                      const isSelected = selected?.genId === gen.id && selected?.emailIndex === idx;
                      const isSending = sending === gen.id;
                      return (
                        <div key={idx} style={{ background: isSelected ? 'rgba(15,158,94,0.06)' : '#0a0a0a', border: `1px solid ${isSelected ? 'var(--accent)' : '#1f1f1f'}`, borderRadius: 10, overflow: 'hidden' }}>
                          <div style={{ padding: '12px 14px', borderBottom: '1px solid #1a1a1a' }}>
                            <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 4 }}>ASUNTO</div>
                            <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{email.subject}</div>
                          </div>
                          <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--muted-2)', lineHeight: 1.6, maxHeight: 100, overflow: 'hidden', position: 'relative' }}>
                            <div style={{ pointerEvents: 'none' }} dangerouslySetInnerHTML={{ __html: email.body.replace(/\{\{name\}\}/g, 'Usuario').substring(0, 300) }} />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 36, background: 'linear-gradient(transparent, #0a0a0a)' }} />
                          </div>
                          <div style={{ padding: '10px 14px', borderTop: '1px solid #1a1a1a', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button
                              onClick={() => setPreviewEmail(previewEmail === email ? null : email)}
                              style={{ flex: 1, padding: '6px 0', background: '#141414', color: 'var(--muted-2)', border: '1px solid #2a2a2a', borderRadius: 7, cursor: 'pointer', fontSize: 12 }}
                            >
                              {previewEmail === email ? 'Cerrar' : '👁 Ver'}
                            </button>
                            {gen.status === 'done' && (
                              <>
                                <button
                                  onClick={() => setSelected(isSelected ? null : { genId: gen.id, emailIndex: idx })}
                                  style={{ flex: 1, padding: '6px 0', background: isSelected ? 'var(--accent)' : 'var(--accent-dim)', color: isSelected ? '#fff' : 'var(--accent)', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                                >
                                  {isSelected ? '✓ Seleccionado' : 'Elegir'}
                                </button>
                                {isSelected && (
                                  <button
                                    onClick={() => approveAndSend(gen.id, idx)}
                                    disabled={isSending}
                                    style={{ flex: 2, padding: '6px 0', background: 'linear-gradient(135deg, #0f9e5e 0%, #0eb86d 100%)', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                                  >
                                    {isSending ? '⟳ Enviando...' : '🚀 APROBAR Y ENVIAR'}
                                  </button>
                                )}
                              </>
                            )}
                            {gen.status === 'sent' && (
                              <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>✓ Enviado</span>
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
        <div onClick={() => setPreviewEmail(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 680, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
              <div>
                <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Asunto</div>
                <div style={{ fontWeight: 700, color: '#111', fontSize: 16 }}>{previewEmail.subject}</div>
              </div>
              <button onClick={() => setPreviewEmail(null)} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: '#374151', fontSize: 13 }}>
                × Cerrar
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 24, color: '#111' }} dangerouslySetInnerHTML={{ __html: previewEmail.body.replace(/\{\{name\}\}/g, 'Usuario') }} />
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
