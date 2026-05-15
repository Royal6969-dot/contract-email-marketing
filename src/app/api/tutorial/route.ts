import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createTransporter } from '@/lib/mailer';

export async function GET() {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const cfg: Record<string, string> = {};
  rows.forEach(r => (cfg[r.key] = r.value));

  const contactCount = (db.prepare('SELECT COUNT(*) as c FROM contacts').get() as { c: number }).c;

  const steps = [
    {
      id: 'smtp',
      title: 'Configurar SMTP (tu correo)',
      done: !!(cfg.smtp_host && cfg.smtp_user && cfg.smtp_pass),
      required: true,
    },
    {
      id: 'sender',
      title: 'Configurar remitente',
      done: !!(cfg.from_name && cfg.from_email),
      required: true,
    },
    {
      id: 'anthropic',
      title: 'API Key de Claude IA',
      done: !!cfg.anthropic_api_key,
      required: true,
    },
    {
      id: 'contacts',
      title: 'Importar contactos',
      done: contactCount > 0,
      required: true,
      count: contactCount,
    },
    {
      id: 'smtp_test',
      title: 'Probar conexión SMTP',
      done: cfg.smtp_verified === 'true',
      required: false,
    },
    {
      id: 'instagram',
      title: 'Conectar Instagram (opcional)',
      done: !!(cfg.ig_app_id && cfg.ig_app_secret),
      required: false,
    },
  ];

  const completed = steps.filter(s => s.done).length;
  const requiredDone = steps.filter(s => s.required && s.done).length;
  const requiredTotal = steps.filter(s => s.required).length;

  return NextResponse.json({ steps, completed, total: steps.length, requiredDone, requiredTotal, ready: requiredDone === requiredTotal });
}

// Mark smtp as verified after successful test
export async function POST() {
  const db = getDb();
  try {
    const transporter = await createTransporter();
    await transporter.verify();
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('smtp_verified', 'true');
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}
