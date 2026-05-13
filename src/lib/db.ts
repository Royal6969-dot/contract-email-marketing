import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      tags TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      contact_filter TEXT DEFAULT '',
      scheduled_at TEXT,
      sent_at TEXT,
      total_sent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS content_plan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      planned_date TEXT,
      status TEXT NOT NULL DEFAULT 'idea',
      campaign_id INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_generations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      example_emails TEXT NOT NULL,
      prompt TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      generated_emails TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'pending',
      campaign_id INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS video_plan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      concept TEXT DEFAULT '',
      hook TEXT DEFAULT '',
      script_notes TEXT DEFAULT '',
      hashtags TEXT DEFAULT '',
      format TEXT DEFAULT 'vertical',
      platform TEXT DEFAULT 'tiktok',
      status TEXT NOT NULL DEFAULT 'idea',
      planned_date TEXT,
      duration_sec INTEGER,
      tiktok_video_id TEXT,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS instagram_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      open_id TEXT,
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

export type Setting = { key: string; value: string };
export type Contact = {
  id: number;
  name: string;
  email: string;
  tags: string;
  created_at: string;
};
export type Campaign = {
  id: number;
  name: string;
  subject: string;
  body: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'sending' | 'sent' | 'failed';
  contact_filter: string;
  scheduled_at: string | null;
  sent_at: string | null;
  total_sent: number;
  created_at: string;
};
export type ContentPlan = {
  id: number;
  title: string;
  description: string;
  planned_date: string | null;
  status: 'idea' | 'in_progress' | 'ready' | 'sent';
  campaign_id: number | null;
  created_at: string;
};
export type AiGeneration = {
  id: number;
  example_emails: string;
  prompt: string;
  quantity: number;
  generated_emails: string;
  status: 'pending' | 'generating' | 'done' | 'approved' | 'sent';
  campaign_id: number | null;
  created_at: string;
};

export type VideoItem = {
  id: number;
  title: string;
  concept: string;
  hook: string;
  script_notes: string;
  hashtags: string;
  format: 'vertical' | 'horizontal' | 'square';
  platform: string;
  status: 'idea' | 'scripting' | 'filming' | 'editing' | 'ready' | 'published';
  planned_date: string | null;
  duration_sec: number | null;
  tiktok_video_id: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  created_at: string;
};

export type InstagramToken = {
  id: number;
  access_token: string;
  refresh_token: string | null;
  open_id: string | null;
  expires_at: string | null;
  created_at: string;
};
