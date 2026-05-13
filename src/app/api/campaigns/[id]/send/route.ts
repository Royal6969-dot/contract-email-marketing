import { NextRequest, NextResponse } from 'next/server';
import { getDb, Campaign, Contact } from '@/lib/db';
import { sendBulkEmails } from '@/lib/mailer';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id) as Campaign;
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (campaign.status !== 'approved' && campaign.status !== 'draft') {
    return NextResponse.json({ error: 'La campaña debe estar aprobada para enviarse' }, { status: 400 });
  }

  db.prepare('UPDATE campaigns SET status = ? WHERE id = ?').run('sending', id);

  let contacts = db.prepare('SELECT * FROM contacts').all() as Contact[];

  // Filter by tags if contact_filter is set
  if (campaign.contact_filter) {
    const tag = campaign.contact_filter.toLowerCase();
    contacts = contacts.filter((c) => c.tags.toLowerCase().includes(tag));
  }

  if (contacts.length === 0) {
    db.prepare('UPDATE campaigns SET status = ? WHERE id = ?').run('draft', id);
    return NextResponse.json({ error: 'No hay contactos que coincidan con el filtro' }, { status: 400 });
  }

  const emailList = contacts.map((c) => ({ to: c.email, name: c.name }));

  try {
    const result = await sendBulkEmails(emailList, campaign.subject, campaign.body);
    db.prepare(
      'UPDATE campaigns SET status = ?, sent_at = datetime("now"), total_sent = ? WHERE id = ?'
    ).run('sent', result.sent, id);
    return NextResponse.json(result);
  } catch (e: unknown) {
    db.prepare('UPDATE campaigns SET status = ? WHERE id = ?').run('failed', id);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
