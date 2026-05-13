import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'day';
  const since = searchParams.get('since') || String(Math.floor((Date.now() - 28 * 86400 * 1000) / 1000));
  const until = searchParams.get('until') || String(Math.floor(Date.now() / 1000));

  const token = db
    .prepare('SELECT * FROM instagram_tokens ORDER BY id DESC LIMIT 1')
    .get() as { access_token: string; ig_user_id: string } | undefined;

  if (!token) return NextResponse.json({ error: 'No conectado' }, { status: 401 });

  // Account-level insights
  const metrics = ['impressions', 'reach', 'profile_views', 'follower_count'].join(',');
  const res = await fetch(
    `https://graph.instagram.com/v21.0/${token.ig_user_id}/insights?metric=${metrics}&period=${period}&since=${since}&until=${until}&access_token=${token.access_token}`
  );
  const data = await res.json();
  if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 });
  return NextResponse.json(data);
}
