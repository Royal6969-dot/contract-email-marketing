import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const items = db.prepare('SELECT * FROM content_plan ORDER BY planned_date ASC, created_at DESC').all();
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const { title, description, planned_date, status } = await req.json();
  const r = db
    .prepare('INSERT INTO content_plan (title, description, planned_date, status) VALUES (?, ?, ?, ?)')
    .run(title, description || '', planned_date || null, status || 'idea');
  return NextResponse.json({ id: r.lastInsertRowid });
}
