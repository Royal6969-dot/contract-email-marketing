import nodemailer from 'nodemailer';
import { getDb } from './db';

export function getSmtpSettings() {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const map: Record<string, string> = {};
  rows.forEach((r) => (map[r.key] = r.value));
  return {
    host: map['smtp_host'] || '',
    port: parseInt(map['smtp_port'] || '587'),
    secure: map['smtp_secure'] === 'true',
    user: map['smtp_user'] || '',
    pass: map['smtp_pass'] || '',
    from_name: map['from_name'] || '',
    from_email: map['from_email'] || '',
    api_key: map['anthropic_api_key'] || '',
  };
}

export async function createTransporter() {
  const cfg = getSmtpSettings();
  if (!cfg.host || !cfg.user || !cfg.pass) {
    throw new Error('SMTP no configurado. Ve a Configuración primero.');
  }
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
}

export async function sendBulkEmails(
  emails: { to: string; name: string }[],
  subject: string,
  html: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const cfg = getSmtpSettings();
  const transporter = await createTransporter();
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const { to, name } of emails) {
    try {
      const personalizedHtml = html.replace(/\{\{name\}\}/g, name);
      await transporter.sendMail({
        from: `"${cfg.from_name}" <${cfg.from_email}>`,
        to,
        subject,
        html: personalizedHtml,
      });
      sent++;
      await sleep(200);
    } catch (e: unknown) {
      failed++;
      errors.push(`${to}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { sent, failed, errors };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
