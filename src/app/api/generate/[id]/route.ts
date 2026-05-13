import { NextRequest, NextResponse } from 'next/server';
import { getDb, AiGeneration, Contact } from '@/lib/db';
import { sendBulkEmails } from '@/lib/mailer';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const body = await req.json();

  if (body.action === 'approve_and_send') {
    const gen = db.prepare('SELECT * FROM ai_generations WHERE id = ?').get(id) as AiGeneration;
    if (!gen) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const emails: { subject: string; body: string }[] = JSON.parse(gen.generated_emails);
    const selectedIndex: number = body.email_index ?? 0;
    const selected = emails[selectedIndex];
    if (!selected) return NextResponse.json({ error: 'Email index inválido' }, { status: 400 });

    const scheduled_at: string | null = body.scheduled_at || null;

    db.prepare('UPDATE ai_generations SET status = ? WHERE id = ?').run('approved', id);

    const contacts = db.prepare('SELECT * FROM contacts').all() as Contact[];
    if (contacts.length === 0) {
      return NextResponse.json({ error: 'No hay contactos en la base de datos' }, { status: 400 });
    }

    // If scheduled, create campaign in approved state for later sending
    if (scheduled_at) {
      const campaignResult = db
        .prepare('INSERT INTO campaigns (name, subject, body, status, scheduled_at) VALUES (?, ?, ?, ?, ?)')
        .run(
          `AI Gen #${id} - ${selected.subject.substring(0, 30)}`,
          selected.subject,
          selected.body,
          'approved',
          scheduled_at
        );
      db.prepare('UPDATE ai_generations SET status = ?, campaign_id = ? WHERE id = ?').run(
        'approved',
        campaignResult.lastInsertRowid,
        id
      );
      return NextResponse.json({
        scheduled: true,
        scheduled_at,
        campaign_id: campaignResult.lastInsertRowid,
        sent: 0,
        failed: 0,
      });
    }

    // Immediate send
    const campaignResult = db
      .prepare('INSERT INTO campaigns (name, subject, body, status) VALUES (?, ?, ?, ?)')
      .run(`AI Gen #${id} - ${selected.subject.substring(0, 30)}`, selected.subject, selected.body, 'sending');

    const emailList = contacts.map((c) => ({ to: c.email, name: c.name }));
    const result = await sendBulkEmails(emailList, selected.subject, selected.body);

    db.prepare(
      'UPDATE campaigns SET status = ?, sent_at = datetime("now"), total_sent = ? WHERE id = ?'
    ).run('sent', result.sent, campaignResult.lastInsertRowid);
    db.prepare('UPDATE ai_generations SET status = ?, campaign_id = ? WHERE id = ?').run(
      'sent',
      campaignResult.lastInsertRowid,
      id
    );

    return NextResponse.json({ ...result, campaign_id: campaignResult.lastInsertRowid });
  }

  // Generic update
  const fields = Object.entries(body)
    .filter(([k]) => k !== 'action')
    .map(([k]) => `${k} = ?`)
    .join(', ');
  if (fields) {
    const values = [...Object.entries(body).filter(([k]) => k !== 'action').map(([, v]) => v), id];
    db.prepare(`UPDATE ai_generations SET ${fields} WHERE id = ?`).run(...values);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  db.prepare('DELETE FROM ai_generations WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
