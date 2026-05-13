import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const token = db
    .prepare('SELECT * FROM instagram_tokens ORDER BY id DESC LIMIT 1')
    .get() as { id: number; access_token: string; ig_user_id: string; expires_at: string } | undefined;

  if (!token) return NextResponse.json({ connected: false });

  if (token.expires_at && new Date(token.expires_at) < new Date()) {
    return NextResponse.json({ connected: false, expired: true });
  }

  try {
    const fields = 'id,name,username,biography,followers_count,follows_count,media_count,profile_picture_url,website';
    const res = await fetch(
      `https://graph.instagram.com/v21.0/${token.ig_user_id}?fields=${fields}&access_token=${token.access_token}`
    );
    const data = await res.json();
    if (data.error) return NextResponse.json({ connected: false, error: data.error.message });
    return NextResponse.json({ connected: true, account: data, ig_user_id: token.ig_user_id });
  } catch (e) {
    return NextResponse.json({ connected: false, error: String(e) });
  }
}

export async function DELETE() {
  const db = getDb();
  db.prepare('DELETE FROM instagram_tokens').run();
  return NextResponse.json({ ok: true });
}
