import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const body = await req.json();
  const fields = Object.entries(body).map(([k]) => `${k} = ?`).join(', ');
  const values = [...Object.values(body), id];
  db.prepare(`UPDATE content_plan SET ${fields} WHERE id = ?`).run(...values);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  db.prepare('DELETE FROM content_plan WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
