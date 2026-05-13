import { NextResponse } from 'next/server';
import { getDb, Campaign, Contact } from '@/lib/db';
import { sendBulkEmails } from '@/lib/mailer';

// This endpoint processes campaigns that are scheduled and past their time.
// Call it with a cron job: curl -X POST /api/scheduler
// or use Vercel Cron / any external cron to hit it every minute.
export async function POST() {
  const db = getDb();
  const now = new Date().toISOString();

  const due = db
    .prepare(
      `SELECT * FROM campaigns
       WHERE status = 'approved'
       AND scheduled_at IS NOT NULL
       AND scheduled_at <= ?`
    )
    .all(now) as Campaign[];

  if (due.length === 0) return NextResponse.json({ processed: 0 });

  const results = [];
  for (const campaign of due) {
    db.prepare('UPDATE campaigns SET status = ? WHERE id = ?').run('sending', campaign.id);
    const contacts = db.prepare('SELECT * FROM contacts').all() as Contact[];

    let filtered = contacts;
    if (campaign.contact_filter) {
      const tag = campaign.contact_filter.toLowerCase();
      filtered = contacts.filter((c) => c.tags.toLowerCase().includes(tag));
    }

    try {
      const emailList = filtered.map((c) => ({ to: c.email, name: c.name }));
      const result = await sendBulkEmails(emailList, campaign.subject, campaign.body);
      db.prepare('UPDATE campaigns SET status = ?, sent_at = datetime("now"), total_sent = ? WHERE id = ?').run(
        'sent', result.sent, campaign.id
      );
      results.push({ id: campaign.id, ...result });
    } catch (e) {
      db.prepare('UPDATE campaigns SET status = ? WHERE id = ?').run('failed', campaign.id);
      results.push({ id: campaign.id, error: String(e) });
    }
  }

  return NextResponse.json({ processed: due.length, results });
}

export async function GET() {
  const db = getDb();
  const scheduled = db
    .prepare(`SELECT * FROM campaigns WHERE status = 'approved' AND scheduled_at IS NOT NULL ORDER BY scheduled_at ASC`)
    .all();
  return NextResponse.json(scheduled);
}
