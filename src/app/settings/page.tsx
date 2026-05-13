'use client';

import { useEffect, useState } from 'react';
import * as T from '@/lib/theme';

type SettingsForm = {
  smtp_host: string;
  smtp_port: string;
  smtp_secure: string;
  smtp_user: string;
  smtp_pass: string;
  from_name: string;
  from_email: string;
  anthropic_api_key: string;
  ig_app_id: string;
  ig_app_secret: string;
  ig_redirect_uri: string;
};

const defaultForm: SettingsForm = {
  smtp_host: '', smtp_port: '587', smtp_secure: 'false',
  smtp_user: '', smtp_pass: '', from_name: 'Contract', from_email: '',
  anthropic_api_key: '', ig_app_id: '', ig_app_secret: '', ig_redirect_uri: '',
};

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => setForm(f => ({ ...f, ...data })));
  }, []);

  async function save() {
    setSaving(true); setSaved(false);
    await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function testSmtp() {
    setTesting(true); setTestResult(null);
    await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const r = await fetch('/api/settings', { method: 'PUT' });
    const data = await r.json();
    setTestResult(data);
    setTesting(false);
  }

  const F = (label: string, key: keyof SettingsForm, type = 'text', placeholder = '', hint?: string) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        style={T.input}
      />
      {hint && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>{hint}</div>}
    </div>
  );

  const Section = (title: string, subtitle: string, icon: string, accent: string, children: React.ReactNode) => (
    <div style={{ ...T.card, marginBottom: 20, overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ fontSize: 18, color: accent }}>{icon}</div>
        <div>
          <div style={{ fontWeight: 700, letterSpacing: '0.04em' }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{subtitle}</div>
        </div>
        <div style={{ marginLeft: 'auto', width: 4, height: 32, borderRadius: 2, background: `linear-gradient(180deg, ${accent} 0%, transparent 100%)` }} />
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );

  return (
    <div style={{ padding: 36, maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.16em', fontWeight: 700, marginBottom: 8 }}>CONTRACT — HUB</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: '0.06em', color: '#fff', lineHeight: 1, marginBottom: 8 }}>
          CONFIGURACIÓN
        </h1>
        <p style={{ color: 'var(--muted-2)', fontSize: 14 }}>Conectá tu correo, la IA y tus redes sociales.</p>
      </div>

      {Section('SMTP — Servidor de Correo', 'Para envíos masivos de email marketing', '◉', '#0f9e5e', <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>HOST SMTP</label>
            <input type="text" value={form.smtp_host} onChange={e => setForm(f => ({ ...f, smtp_host: e.target.value }))} placeholder="smtp.gmail.com" style={T.input} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>PUERTO</label>
            <input type="text" value={form.smtp_port} onChange={e => setForm(f => ({ ...f, smtp_port: e.target.value }))} style={T.input} />
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted-2)', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.smtp_secure === 'true'} onChange={e => setForm(f => ({ ...f, smtp_secure: e.target.checked ? 'true' : 'false' }))} style={{ accentColor: 'var(--accent)' }} />
            SSL/TLS (puerto 465)
          </label>
        </div>
        {F('USUARIO / EMAIL SMTP', 'smtp_user', 'text', 'tu@gmail.com')}
        {F('CONTRASEÑA / APP PASSWORD', 'smtp_pass', 'password', '••••••••', 'Para Gmail usá una App Password (no tu contraseña normal)')}
      </>)}

      {Section('REMITENTE', 'Cómo aparecés en los emails', '◎', '#3b82f6', <>
        {F('NOMBRE DEL REMITENTE', 'from_name', 'text', 'Contract')}
        {F('EMAIL DEL REMITENTE', 'from_email', 'email', 'noreply@contractapp.net')}
      </>)}

      {Section('ANTHROPIC — CLAUDE IA', 'Para generación automática de emails', '✦', '#a855f7', <>
        {F('API KEY DE ANTHROPIC', 'anthropic_api_key', 'password', 'sk-ant-api03-...', 'Obtenela en console.anthropic.com → API Keys')}
      </>)}

      {Section('INSTAGRAM — META API', 'Para ver estadísticas de tu cuenta', '◌', '#e1306c', <>
        <div style={{ padding: '10px 14px', background: 'rgba(225,48,108,0.08)', border: '1px solid rgba(225,48,108,0.2)', borderRadius: 8, marginBottom: 16, fontSize: 12, color: 'var(--muted-2)', lineHeight: 1.6 }}>
          Necesitás crear una app en <strong style={{ color: '#e1306c' }}>developers.facebook.com</strong> con los productos: <em>Instagram Basic Display</em> o <em>Instagram Graph API</em>.
          Tu cuenta debe ser Business/Creator vinculada a una Página de Facebook.
        </div>
        {F('APP ID (FACEBOOK APP)', 'ig_app_id', 'text', '123456789012345')}
        {F('APP SECRET', 'ig_app_secret', 'password', '••••••••••••••••')}
        {F('REDIRECT URI', 'ig_redirect_uri', 'text', 'http://localhost:3000/api/instagram/callback', 'Debe coincidir exactamente con lo que pusiste en tu app de Facebook')}
      </>)}

      {testResult && (
        <div style={{
          marginBottom: 16, padding: '12px 16px', borderRadius: 8, fontSize: 14,
          background: testResult.ok ? 'rgba(16,185,129,0.1)' : 'rgba(220,38,38,0.1)',
          border: `1px solid ${testResult.ok ? '#10b981' : '#dc2626'}`,
          color: testResult.ok ? '#10b981' : '#dc2626',
        }}>
          {testResult.message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{ ...T.btnPrimary, fontSize: 12, letterSpacing: '0.08em' }}
        >
          {saving ? 'GUARDANDO...' : saved ? '✓ GUARDADO' : 'GUARDAR TODO'}
        </button>
        <button
          onClick={testSmtp}
          disabled={testing}
          style={{ ...T.btnSecondary, fontSize: 12, letterSpacing: '0.06em' }}
        >
          {testing ? 'PROBANDO...' : 'PROBAR SMTP'}
        </button>
      </div>
    </div>
  );
}
