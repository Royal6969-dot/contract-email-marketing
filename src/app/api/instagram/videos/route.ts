import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get('limit') || '20';

  const token = db
    .prepare('SELECT * FROM instagram_tokens ORDER BY id DESC LIMIT 1')
    .get() as { access_token: string; ig_user_id: string } | undefined;

  if (!token) return NextResponse.json({ error: 'No conectado' }, { status: 401 });

  const fields = 'id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink';
  const res = await fetch(
    `https://graph.instagram.com/v21.0/${token.ig_user_id}/media?fields=${fields}&limit=${limit}&access_token=${token.access_token}`
  );
  const data = await res.json();
  if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 });
  return NextResponse.json(data);
}
