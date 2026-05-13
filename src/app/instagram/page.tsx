'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import * as T from '@/lib/theme';

type IgAccount = {
  id: string;
  name: string;
  username: string;
  biography: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  profile_picture_url: string;
  website: string;
};

type IgMedia = {
  id: string;
  caption: string;
  media_type: string;
  media_url: string;
  thumbnail_url: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  permalink: string;
};

function InstagramPage() {
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<IgAccount | null>(null);
  const [media, setMedia] = useState<IgMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch('/api/instagram');
    const d = await r.json();
    setConnected(d.connected);
    if (d.account) setAccount(d.account);
    if (d.error) setError(d.error);
    setLoading(false);

    if (d.connected) {
      setMediaLoading(true);
      const mr = await fetch('/api/instagram/videos?limit=12');
      const md = await mr.json();
      if (md.data) setMedia(md.data);
      setMediaLoading(false);
    }
  }, []);

  useEffect(() => {
    const err = searchParams.get('error');
    const ok = searchParams.get('success');
    if (err) setError(decodeURIComponent(err));
    if (ok) setSuccess('¡Instagram conectado correctamente!');
    load();
  }, [searchParams, load]);

  async function disconnect() {
    await fetch('/api/instagram', { method: 'DELETE' });
    setConnected(false);
    setAccount(null);
    setMedia([]);
  }

  const totalLikes = media.reduce((s, m) => s + (m.like_count || 0), 0);
  const totalComments = media.reduce((s, m) => s + (m.comments_count || 0), 0);
  const engagementRate = account && media.length > 0
    ? ((totalLikes + totalComments) / (media.length * (account.followers_count || 1)) * 100).toFixed(2)
    : null;

  return (
    <div style={{ padding: 36, maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: '#e1306c', letterSpacing: '0.16em', fontWeight: 700, marginBottom: 8 }}>
          CONTRACT — SOCIAL
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: '0.06em', color: '#fff', lineHeight: 1 }}>
            INSTAGRAM STATS
          </h1>
          {connected && (
            <button onClick={disconnect} style={{ ...T.btnSecondary, fontSize: 11, letterSpacing: '0.08em', color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)' }}>
              DESCONECTAR
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ marginBottom: 20, padding: '12px 18px', borderRadius: 8, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.4)', color: '#dc2626', fontSize: 14 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ marginBottom: 20, padding: '12px 18px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981', fontSize: 14 }}>
          {success}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted-2)' }}>Cargando...</div>
      ) : !connected ? (
        /* NOT CONNECTED — Setup Instructions */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Connect card */}
          <div style={{ ...T.card, padding: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>◌</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: '0.06em', marginBottom: 10 }}>
              CONECTAR INSTAGRAM
            </h2>
            <p style={{ color: 'var(--muted-2)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Conectá tu cuenta de Instagram Business para ver estadísticas, publicaciones y métricas de engagement directamente desde el hub.
            </p>
            <a
              href="/api/instagram/auth"
              style={{
                ...T.btnPrimary,
                display: 'inline-block',
                textDecoration: 'none',
                fontSize: 12,
                letterSpacing: '0.08em',
                background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
              }}
            >
              CONECTAR CON INSTAGRAM
            </a>
          </div>

          {/* Instructions */}
          <div style={{ ...T.card, padding: 28 }}>
            <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 16 }}>
              CONFIGURACIÓN REQUERIDA
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { n: '01', title: 'Cuenta Instagram Business', desc: 'Tu cuenta debe ser Business o Creator (no personal). Convertila en Instagram → Ajustes → Cuenta.' },
                { n: '02', title: 'Página de Facebook', desc: 'Debe estar vinculada a una Página de Facebook. Hacé esto en Meta Business Suite.' },
                { n: '03', title: 'App de Facebook', desc: 'Configurá el App ID y App Secret en la sección Configuración de este hub (pestaña Instagram).' },
                { n: '04', title: 'Redirect URI', desc: 'En tu app de Facebook, agregá como Redirect URI: http://localhost:3000/api/instagram/callback (o tu dominio de producción).' },
              ].map(({ n, title, desc }) => (
                <div key={n} style={{ display: 'flex', gap: 14 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: 'var(--accent)', letterSpacing: '0.06em', minWidth: 28, lineHeight: 1 }}>{n}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{title}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted-2)', lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* CONNECTED — Stats Dashboard */
        <div>
          {/* Profile header */}
          {account && (
            <div style={{ ...T.card, padding: 24, marginBottom: 20, display: 'flex', gap: 20, alignItems: 'center' }}>
              {account.profile_picture_url && (
                <img
                  src={account.profile_picture_url}
                  alt={account.username}
                  style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e1306c' }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20 }}>@{account.username}</span>
                  <span style={{ fontSize: 10, color: '#e1306c', background: 'rgba(225,48,108,0.15)', padding: '2px 8px', borderRadius: 10, fontWeight: 700, letterSpacing: '0.06em' }}>INSTAGRAM</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted-2)', marginBottom: 8 }}>{account.biography}</div>
                {account.website && (
                  <a href={account.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)' }}>{account.website}</a>
                )}
              </div>
              <button
                onClick={load}
                style={{ ...T.btnSecondary, fontSize: 12, letterSpacing: '0.06em' }}
              >
                ↻ ACTUALIZAR
              </button>
            </div>
          )}

          {/* Stats grid */}
          {account && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'SEGUIDORES', value: account.followers_count?.toLocaleString(), color: '#e1306c', icon: '◆' },
                { label: 'SIGUIENDO', value: account.follows_count?.toLocaleString(), color: '#a855f7', icon: '◎' },
                { label: 'PUBLICACIONES', value: account.media_count?.toLocaleString(), color: '#3b82f6', icon: '▦' },
                { label: 'LIKES TOTAL', value: totalLikes.toLocaleString(), color: '#f43f5e', icon: '♥' },
                { label: 'COMENTARIOS', value: totalComments.toLocaleString(), color: '#f59e0b', icon: '💬' },
                { label: 'ENGAGEMENT %', value: engagementRate ? `${engagementRate}%` : '—', color: '#0f9e5e', icon: '◉' },
              ].map(({ label, value, color, icon }) => (
                <div key={label} style={{ ...T.statCard(color) }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 50, height: 50, background: `radial-gradient(circle at top right, ${color}20 0%, transparent 70%)`, borderRadius: '0 12px 0 50px' }} />
                  <div style={{ fontSize: 16, color, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: "'Space Grotesk', sans-serif" }}>{value ?? '—'}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 5, fontWeight: 600, letterSpacing: '0.1em' }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Recent posts */}
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 10, color: '#e1306c', letterSpacing: '0.14em', fontWeight: 700 }}>ÚLTIMAS PUBLICACIONES</span>
            <div style={{ flex: 1, height: 1, background: 'var(--card-border)' }} />
          </div>

          {mediaLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-2)', fontSize: 14 }}>Cargando posts...</div>
          ) : media.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-2)', fontSize: 14 }}>No hay publicaciones para mostrar.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
              {media.map(post => (
                <a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...T.cardInner, overflow: 'hidden', textDecoration: 'none', display: 'block' }}
                >
                  {/* Thumbnail */}
                  {(post.media_url || post.thumbnail_url) && (
                    <div style={{ aspectRatio: '1', overflow: 'hidden', background: '#1a1a1a' }}>
                      <img
                        src={post.thumbnail_url || post.media_url}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div style={{ padding: '12px 14px' }}>
                    {/* Type badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: '#e1306c', fontWeight: 700, letterSpacing: '0.06em' }}>
                        {post.media_type === 'VIDEO' ? '▷ VIDEO' : post.media_type === 'CAROUSEL_ALBUM' ? '▦ CARRUSEL' : '◈ FOTO'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {new Date(post.timestamp).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    {/* Caption */}
                    {post.caption && (
                      <div style={{ fontSize: 12, color: 'var(--muted-2)', lineHeight: 1.5, marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                        {post.caption}
                      </div>
                    )}
                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 14 }}>
                      <span style={{ fontSize: 12, color: '#f43f5e', fontWeight: 600 }}>♥ {(post.like_count || 0).toLocaleString()}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>💬 {(post.comments_count || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InstagramPageWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: 'center', color: 'var(--muted-2)' }}>Cargando...</div>}>
      <InstagramPage />
    </Suspense>
  );
}
