import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const items = db.prepare('SELECT * FROM video_plan ORDER BY planned_date ASC, created_at DESC').all();
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { title, concept, hook, script_notes, hashtags, format, platform, status, planned_date, duration_sec } = body;
  const r = db
    .prepare(
      `INSERT INTO video_plan (title, concept, hook, script_notes, hashtags, format, platform, status, planned_date, duration_sec)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title,
      concept || '',
      hook || '',
      script_notes || '',
      hashtags || '',
      format || 'vertical',
      platform || 'tiktok',
      status || 'idea',
      planned_date || null,
      duration_sec || null
    );
  return NextResponse.json({ id: r.lastInsertRowid });
}
