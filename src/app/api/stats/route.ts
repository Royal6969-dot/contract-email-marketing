import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const totalContacts = (db.prepare('SELECT COUNT(*) as c FROM contacts').get() as { c: number }).c;
  const totalCampaigns = (db.prepare('SELECT COUNT(*) as c FROM campaigns').get() as { c: number }).c;
  const totalSent = (
    db.prepare('SELECT SUM(total_sent) as s FROM campaigns WHERE status = "sent"').get() as { s: number | null }
  ).s || 0;
  const pendingApproval = (
    db.prepare('SELECT COUNT(*) as c FROM ai_generations WHERE status = "done"').get() as { c: number }
  ).c;
  const contentIdeas = (
    db.prepare('SELECT COUNT(*) as c FROM content_plan WHERE status = "idea"').get() as { c: number }
  ).c;
  const recentCampaigns = db
    .prepare('SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 5')
    .all();

  return NextResponse.json({ totalContacts, totalCampaigns, totalSent, pendingApproval, contentIdeas, recentCampaigns });
}
