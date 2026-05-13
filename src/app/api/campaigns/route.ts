import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all();
  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const { name, subject, body, contact_filter, scheduled_at } = await req.json();
  const r = db
    .prepare(
      'INSERT INTO campaigns (name, subject, body, contact_filter, scheduled_at) VALUES (?, ?, ?, ?, ?)'
    )
    .run(name, subject, body, contact_filter || '', scheduled_at || null);
  return NextResponse.json({ id: r.lastInsertRowid });
}
