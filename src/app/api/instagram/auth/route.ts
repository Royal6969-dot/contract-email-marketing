import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Initiates Instagram OAuth via Facebook Login
export async function GET() {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const cfg: Record<string, string> = {};
  rows.forEach((r) => (cfg[r.key] = r.value));

  const appId = cfg['ig_app_id'];
  const redirectUri = cfg['ig_redirect_uri'] || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/instagram/callback`;

  if (!appId) {
    return NextResponse.json({ error: 'Configurá el App ID de Instagram en Configuración primero' }, { status: 400 });
  }

  // Instagram Graph API uses Facebook OAuth
  const scope = [
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_insights',
    'pages_show_list',
    'pages_read_engagement',
  ].join(',');

  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;

  return NextResponse.redirect(authUrl);
}
