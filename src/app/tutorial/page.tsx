'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as T from '@/lib/theme';

type Step = {
  id: string;
  title: string;
  done: boolean;
  required: boolean;
  count?: number;
};

type Status = {
  steps: Step[];
  completed: number;
  total: number;
  requiredDone: number;
  requiredTotal: number;
  ready: boolean;
};

const stepDetails: Record<string, {
  icon: string;
  color: string;
  href: string;
  btnLabel: string;
  instructions: { title: string; body: string }[];
}> = {
  smtp: {
    icon: '◉', color: '#0f9e5e', href: '/settings', btnLabel: 'IR A CONFIGURACIÓN',
    instructions: [
      { title: '1. Abrí tu cuenta de Gmail', body: 'Entrá a gmail.com con la cuenta que querés usar para enviar los emails masivos.' },
      { title: '2. Activá la verificación en 2 pasos', body: 'Andá a myaccount.google.com → Seguridad → Verificación en 2 pasos → Activar. Es obligatorio para crear App Passwords.' },
      { title: '3. Creá una App Password', body: 'En myaccount.google.com → Seguridad → Verificación en 2 pasos → App passwords. Poné nombre "Contract Marketing" y copiá la contraseña de 16 caracteres.' },
      { title: '4. Completá los campos en Configuración', body: 'Host: smtp.gmail.com · Puerto: 587 · Usuario: tu@gmail.com · Contraseña: la App Password (no tu contraseña normal).' },
    ],
  },
  sender: {
    icon: '◎', color: '#3b82f6', href: '/settings', btnLabel: 'IR A CONFIGURACIÓN',
    instructions: [
      { title: 'Nombre del remitente', body: 'Es el nombre que van a ver los destinatarios cuando reciban el email. Recomendado: "Contract" o "Contract App".' },
      { title: 'Email del remitente', body: 'Usá el mismo email que configuraste en SMTP (tu Gmail u otro). Tiene que coincidir para evitar que los emails vayan a spam.' },
    ],
  },
  anthropic: {
    icon: '✦', color: '#a855f7', href: '/settings', btnLabel: 'IR A CONFIGURACIÓN',
    instructions: [
      { title: '1. Creá una cuenta en Anthropic', body: 'Entrá a console.anthropic.com y registrate (es gratis para empezar, tenés créditos iniciales).' },
      { title: '2. Generá una API Key', body: 'En el panel de Anthropic → API Keys → Create Key. Ponele nombre "Contract Marketing" y copiá la key completa (empieza con sk-ant-...).' },
      { title: '3. Pegala en Configuración', body: 'En la sección "ANTHROPIC — CLAUDE IA" de Configuración, pegá la key y guardá. Esta key permite que la app genere emails automáticamente.' },
    ],
  },
  contacts: {
    icon: '◆', color: '#eab308', href: '/contacts', btnLabel: 'IR A CONTACTOS',
    instructions: [
      { title: 'Formato de importación', body: 'Podés pegar una lista con el formato: email, nombre, tag — una persona por línea. El nombre y tag son opcionales.' },
      { title: 'Ejemplo', body: 'juan@gmail.com, Juan García, vip\nmaria@gmail.com, María López\npedro@gmail.com' },
      { title: '¿De dónde saco los emails?', body: 'Podés exportar desde tu CRM, planilla de Excel, o copiarlos de donde los tengas guardados. Lo importante es tener al menos un email para poder hacer pruebas.' },
    ],
  },
  smtp_test: {
    icon: '⬡', color: '#10b981', href: '/settings', btnLabel: 'IR A CONFIGURACIÓN',
    instructions: [
      { title: 'Probá la conexión', body: 'En Configuración, una vez que cargaste todos los datos del SMTP, hacé click en "PROBAR SMTP". Si aparece un tilde verde, todo está listo para enviar.' },
      { title: '¿Qué pasa si falla?', body: 'Verificá que la App Password sea correcta (sin espacios extra), que el host sea smtp.gmail.com y el puerto 587. Si usás otro proveedor, consultá la documentación de tu servicio de email.' },
    ],
  },
  instagram: {
    icon: '◌', color: '#e1306c', href: '/settings', btnLabel: 'IR A CONFIGURACIÓN',
    instructions: [
      { title: '1. Convertí tu cuenta a Business/Creator', body: 'En Instagram → Ajustes → Tipo de cuenta y herramientas → Cambiar a cuenta profesional.' },
      { title: '2. Vinculá una Página de Facebook', body: 'Tu cuenta de Instagram Business necesita estar vinculada a una Página de Facebook. Podés hacerlo desde Meta Business Suite (business.facebook.com).' },
      { title: '3. Creá una app en Facebook Developers', body: 'Andá a developers.facebook.com → Mis apps → Crear app → Tipo "Business". Agregá el producto "Instagram Graph API".' },
      { title: '4. Copiá App ID y App Secret', body: 'En Configuración de la app → Configuración básica → App ID y App Secret. Pegálos en la sección Instagram de este hub.' },
      { title: '5. Configurá el Redirect URI', body: 'En la app de Facebook → Instagram → OAuth → Agregá como URI válida: http://localhost:3000/api/instagram/callback (o tu dominio si está en producción).' },
    ],
  },
};

export default function TutorialPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);

  async function load() {
    const r = await fetch('/api/tutorial');
    setStatus(await r.json());
  }
  useEffect(() => { load(); }, []);

  async function testSmtp() {
    setTesting(true); setTestResult(null);
    const r = await fetch('/api/tutorial', { method: 'POST' });
    const d = await r.json();
    setTestResult(d);
    setTesting(false);
    if (d.ok) load();
  }

  const progress = status ? Math.round((status.completed / status.total) * 100) : 0;

  return (
    <div style={{ padding: 36, maxWidth: 820, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.16em', fontWeight: 700, marginBottom: 8 }}>
          CONTRACT — SETUP
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: '0.06em', color: '#fff', lineHeight: 1, marginBottom: 8 }}>
          GUÍA DE CONFIGURACIÓN
        </h1>
        <p style={{ color: 'var(--muted-2)', fontSize: 14, lineHeight: 1.6 }}>
          Completá estos pasos para empezar a enviar campañas. Hacé click en cada paso para ver las instrucciones detalladas.
        </p>
      </div>

      {/* Progress bar */}
      {status && (
        <div style={{ ...T.card, padding: '20px 24px', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{status.completed} de {status.total} pasos completados</span>
              <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--muted-2)' }}>
                ({status.requiredDone}/{status.requiredTotal} requeridos)
              </span>
            </div>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: status.ready ? 'var(--accent)' : 'var(--muted)', letterSpacing: '0.04em' }}>
              {progress}%
            </span>
          </div>
          <div style={{ height: 6, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #0f9e5e 0%, #0eb86d 100%)', borderRadius: 3, transition: 'width 0.5s ease' }} />
          </div>
          {status.ready && (
            <div style={{ marginTop: 14, padding: '10px 16px', background: 'rgba(15,158,94,0.1)', border: '1px solid rgba(15,158,94,0.3)', borderRadius: 8, fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
              ✓ Todo listo — ya podés empezar a enviar campañas
            </div>
          )}
        </div>
      )}

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {status?.steps.map((step, i) => {
          const detail = stepDetails[step.id];
          const isExpanded = expanded === step.id;

          return (
            <div
              key={step.id}
              style={{
                ...T.card,
                border: `1px solid ${step.done ? 'rgba(15,158,94,0.3)' : isExpanded ? detail.color + '50' : 'var(--card-border)'}`,
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Step header */}
              <div
                onClick={() => setExpanded(isExpanded ? null : step.id)}
                style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
              >
                {/* Number / check */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step.done ? 'rgba(15,158,94,0.15)' : '#111',
                  border: `1.5px solid ${step.done ? 'var(--accent)' : '#333'}`,
                  fontSize: step.done ? 16 : 14,
                  color: step.done ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: 700,
                  fontFamily: "'Bebas Neue', sans-serif",
                }}>
                  {step.done ? '✓' : String(i + 1).padStart(2, '0')}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{step.title}</span>
                    {!step.required && (
                      <span style={{ fontSize: 10, color: 'var(--muted)', background: '#1a1a1a', padding: '2px 8px', borderRadius: 10, border: '1px solid #333' }}>
                        OPCIONAL
                      </span>
                    )}
                    {step.id === 'contacts' && step.count !== undefined && step.count > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
                        {step.count} contactos
                      </span>
                    )}
                  </div>
                  {step.done && (
                    <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>Completado</div>
                  )}
                </div>

                <div style={{ fontSize: 18, color: 'var(--muted)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  ⌄
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div style={{ borderTop: `1px solid ${detail.color}30`, padding: '20px 20px 20px' }}>
                  {/* Instructions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                    {detail.instructions.map((inst, j) => (
                      <div key={j} style={{ display: 'flex', gap: 14 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                          background: `${detail.color}20`, color: detail.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, fontFamily: "'Bebas Neue', sans-serif",
                          marginTop: 1,
                        }}>
                          {j + 1}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{inst.title}</div>
                          <div style={{
                            fontSize: 13, color: 'var(--muted-2)', lineHeight: 1.6,
                            whiteSpace: inst.body.includes('\n') ? 'pre-line' : 'normal',
                            fontFamily: inst.body.includes('\n') ? 'monospace' : 'inherit',
                            background: inst.body.includes('\n') ? '#0a0a0a' : 'transparent',
                            padding: inst.body.includes('\n') ? '8px 12px' : '0',
                            borderRadius: inst.body.includes('\n') ? 6 : 0,
                            borderLeft: inst.body.includes('\n') ? `2px solid ${detail.color}` : 'none',
                          }}>
                            {inst.body}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Special: SMTP test button */}
                  {step.id === 'smtp_test' && (
                    <div style={{ marginBottom: 16 }}>
                      <button
                        onClick={testSmtp}
                        disabled={testing}
                        style={{ ...T.btnPrimary, fontSize: 12, letterSpacing: '0.08em' }}
                      >
                        {testing ? 'PROBANDO...' : '⬡ PROBAR CONEXIÓN AHORA'}
                      </button>
                      {testResult && (
                        <div style={{
                          marginTop: 10, padding: '10px 14px', borderRadius: 8, fontSize: 13,
                          background: testResult.ok ? 'rgba(15,158,94,0.1)' : 'rgba(220,38,38,0.1)',
                          border: `1px solid ${testResult.ok ? 'var(--accent)' : '#dc2626'}`,
                          color: testResult.ok ? 'var(--accent)' : '#dc2626',
                        }}>
                          {testResult.ok ? '✓ Conexión SMTP exitosa — todo listo para enviar' : `Error: ${testResult.error}`}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action button */}
                  {step.id !== 'smtp_test' && (
                    <Link
                      href={detail.href}
                      style={{ ...T.btnPrimary, display: 'inline-block', textDecoration: 'none', fontSize: 12, letterSpacing: '0.08em', background: `linear-gradient(135deg, ${detail.color} 0%, ${detail.color}cc 100%)` }}
                    >
                      {detail.btnLabel} →
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* After setup — what to do */}
      <div style={{ ...T.card, padding: 28, marginTop: 28 }}>
        <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 16 }}>
          UNA VEZ CONFIGURADO — ¿QUÉ HAGO?
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { icon: '✦', title: 'Generador IA', desc: 'Pegá emails de inspiración y Claude genera versiones para Contract. Aprobás con un click y se envían solos.', href: '/ai-generator', color: '#a855f7' },
            { icon: '◉', title: 'Nueva Campaña', desc: 'Creá una campaña manual con tu propio HTML. Filtrá por tags y enviá a toda tu lista.', href: '/campaigns', color: '#0f9e5e' },
            { icon: '▷', title: 'Video Plan', desc: 'Planificá tu contenido de video con hook, guión, hashtags y estado de producción.', href: '/video-plan', color: '#3b82f6' },
            { icon: '◎', title: 'Content Email', desc: 'Organizá tus ideas de email en un Kanban antes de producirlas.', href: '/content-plan', color: '#eab308' },
          ].map(({ icon, title, desc, href, color }) => (
            <Link key={href} href={href} style={{ ...T.cardInner, padding: 16, textDecoration: 'none', display: 'block' }}>
              <div style={{ fontSize: 20, color, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted-2)', lineHeight: 1.5 }}>{desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
