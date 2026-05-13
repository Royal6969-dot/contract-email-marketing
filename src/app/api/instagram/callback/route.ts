import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error_description');

  if (error || !code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/instagram?error=${encodeURIComponent(error || 'Sin código de autorización')}`
    );
  }

  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const cfg: Record<string, string> = {};
  rows.forEach((r) => (cfg[r.key] = r.value));

  const appId = cfg['ig_app_id'];
  const appSecret = cfg['ig_app_secret'];
  const redirectUri = cfg['ig_redirect_uri'] || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/instagram/callback`;

  try {
    // 1. Exchange code for short-lived token
    const tokenRes = await fetch('https://graph.facebook.com/v21.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error.message);

    const shortToken = tokenData.access_token;

    // 2. Exchange for long-lived token (60 days)
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`
    );
    const longTokenData = await longTokenRes.json();
    const longToken = longTokenData.access_token || shortToken;
    const expiresIn = longTokenData.expires_in || 5184000; // 60 days default

    // 3. Get Facebook pages to find connected IG business account
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${longToken}`
    );
    const pagesData = await pagesRes.json();
    const page = pagesData.data?.[0];
    if (!page) throw new Error('No se encontró una Página de Facebook conectada a tu cuenta');

    const pageToken = page.access_token;
    const pageId = page.id;

    // 4. Get Instagram Business Account linked to this page
    const igRes = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
    );
    const igData = await igRes.json();
    const igUserId = igData.instagram_business_account?.id;
    if (!igUserId) throw new Error('No se encontró una cuenta de Instagram Business vinculada a esta página');

    // 5. Save token
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    db.prepare('DELETE FROM instagram_tokens').run();
    db.prepare(
      'INSERT INTO instagram_tokens (access_token, refresh_token, open_id, expires_at) VALUES (?, ?, ?, ?)'
    ).run(pageToken, longToken, igUserId, expiresAt);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/instagram?success=1`
    );
  } catch (e) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/instagram?error=${encodeURIComponent(String(e))}`
    );
  }
}
