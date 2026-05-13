import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createTransporter } from '@/lib/mailer';

export async function GET() {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const map: Record<string, string> = {};
  rows.forEach((r) => (map[r.key] = r.value));
  // Mask password
  if (map['smtp_pass']) map['smtp_pass'] = '••••••••';
  return NextResponse.json(map);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const tx = db.transaction((data: Record<string, string>) => {
    for (const [k, v] of Object.entries(data)) {
      if (k === 'smtp_pass' && v === '••••••••') continue;
      upsert.run(k, v);
    }
  });
  tx(body);
  return NextResponse.json({ ok: true });
}

export async function PUT() {
  try {
    const transporter = await createTransporter();
    await transporter.verify();
    return NextResponse.json({ ok: true, message: 'Conexión SMTP exitosa ✓' });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, message: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
