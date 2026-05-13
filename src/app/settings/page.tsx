'use client';

import { useEffect, useState } from 'react';

type SettingsForm = {
  smtp_host: string;
  smtp_port: string;
  smtp_secure: string;
  smtp_user: string;
  smtp_pass: string;
  from_name: string;
  from_email: string;
  anthropic_api_key: string;
};

const defaultForm: SettingsForm = {
  smtp_host: '',
  smtp_port: '587',
  smtp_secure: 'false',
  smtp_user: '',
  smtp_pass: '',
  from_name: 'Contract',
  from_email: '',
  anthropic_api_key: '',
};

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => setForm((f) => ({ ...f, ...data })));
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function testSmtp() {
    setTesting(true);
    setTestResult(null);
    await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const r = await fetch('/api/settings', { method: 'PUT' });
    const data = await r.json();
    setTestResult(data);
    setTesting(false);
  }

  const field = (label: string, key: keyof SettingsForm, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        style={{
          width: '100%',
          background: 'var(--background)',
          border: '1px solid var(--card-border)',
          borderRadius: 8,
          padding: '9px 12px',
          color: 'var(--foreground)',
          fontSize: 14,
          outline: 'none',
        }}
      />
    </div>
  );

  const section = (title: string, subtitle: string, children: React.ReactNode) => (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        borderRadius: 12,
        marginBottom: 24,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)' }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{subtitle}</div>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );

  return (
    <div style={{ padding: 32, maxWidth: 680, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Configuración</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>
        Conecta tu correo y configura las APIs necesarias.
      </p>

      {section(
        'Configuración SMTP',
        'Servidor de correo para envíos masivos',
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, marginBottom: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>Host SMTP</label>
              <input
                type="text"
                value={form.smtp_host}
                onChange={(e) => setForm((f) => ({ ...f, smtp_host: e.target.value }))}
                placeholder="smtp.gmail.com"
                style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--card-border)', borderRadius: 8, padding: '9px 12px', color: 'var(--foreground)', fontSize: 14, outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>Puerto</label>
              <input
                type="text"
                value={form.smtp_port}
                onChange={(e) => setForm((f) => ({ ...f, smtp_port: e.target.value }))}
                style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--card-border)', borderRadius: 8, padding: '9px 12px', color: 'var(--foreground)', fontSize: 14, outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.smtp_secure === 'true'}
                onChange={(e) => setForm((f) => ({ ...f, smtp_secure: e.target.checked ? 'true' : 'false' }))}
              />
              SSL/TLS (puerto 465)
            </label>
          </div>

          {field('Usuario / Email SMTP', 'smtp_user', 'text', 'tu@email.com')}
          {field('Contraseña / App Password', 'smtp_pass', 'password', '••••••••')}
        </>
      )}

      {section(
        'Remitente',
        'Nombre y email que verán los destinatarios',
        <>
          {field('Nombre del remitente', 'from_name', 'text', 'Contract')}
          {field('Email del remitente', 'from_email', 'email', 'noreply@contract.app')}
        </>
      )}

      {section(
        'Anthropic API',
        'Para generación de emails con Claude IA',
        field('API Key de Anthropic', 'anthropic_api_key', 'password', 'sk-ant-...')
      )}

      {testResult && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            borderRadius: 8,
            background: testResult.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${testResult.ok ? 'var(--success)' : 'var(--danger)'}`,
            color: testResult.ok ? 'var(--success)' : 'var(--danger)',
            fontSize: 14,
          }}
        >
          {testResult.message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar'}
        </button>
        <button
          onClick={testSmtp}
          disabled={testing}
          style={{
            background: 'var(--card)',
            color: 'var(--foreground)',
            border: '1px solid var(--card-border)',
            borderRadius: 8,
            padding: '10px 24px',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {testing ? 'Probando...' : 'Probar conexión SMTP'}
        </button>
      </div>
    </div>
  );
}
