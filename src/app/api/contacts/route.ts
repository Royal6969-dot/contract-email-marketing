import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const contacts = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();

  // Bulk import from CSV text
  if (body.bulk) {
    const lines = (body.bulk as string).split('\n').map((l: string) => l.trim()).filter(Boolean);
    const insert = db.prepare('INSERT OR IGNORE INTO contacts (name, email, tags) VALUES (?, ?, ?)');
    const tx = db.transaction(() => {
      let count = 0;
      for (const line of lines) {
        const parts = line.split(',').map((p: string) => p.trim());
        const email = parts[0];
        const name = parts[1] || email.split('@')[0];
        const tags = parts[2] || '';
        if (email && email.includes('@')) {
          insert.run(name, email, tags);
          count++;
        }
      }
      return count;
    });
    const count = tx();
    return NextResponse.json({ ok: true, imported: count });
  }

  const { name, email, tags } = body;
  try {
    const r = db.prepare('INSERT INTO contacts (name, email, tags) VALUES (?, ?, ?)').run(name, email, tags || '');
    return NextResponse.json({ id: r.lastInsertRowid, name, email, tags });
  } catch {
    return NextResponse.json({ error: 'Email ya existe' }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest) {
  const db = getDb();
  const { ids } = await req.json();
  const tx = db.transaction(() => {
    for (const id of ids) db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
  });
  tx();
  return NextResponse.json({ ok: true });
}
