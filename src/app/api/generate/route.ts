import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getDb } from '@/lib/db';
import { getSmtpSettings } from '@/lib/mailer';

export async function GET() {
  const db = getDb();
  const generations = db.prepare('SELECT * FROM ai_generations ORDER BY created_at DESC').all();
  return NextResponse.json(generations);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const { example_emails, prompt, quantity } = await req.json();

  const settings = getSmtpSettings();
  if (!settings.api_key) {
    return NextResponse.json({ error: 'Falta la API Key de Anthropic en Configuración' }, { status: 400 });
  }

  const r = db
    .prepare('INSERT INTO ai_generations (example_emails, prompt, quantity, status) VALUES (?, ?, ?, ?)')
    .run(example_emails, prompt, quantity || 1, 'generating');
  const genId = r.lastInsertRowid;

  try {
    const client = new Anthropic({ apiKey: settings.api_key });

    const systemPrompt = `Eres un experto en email marketing para CONTRACT — una plataforma de contratos sociales inteligentes que transforma metas personales en compromisos reales entre amigos, respaldados por tecnología Web3.

CONTRACT en pocas palabras: Los usuarios crean retos entre pares (ir al gimnasio, llegar puntual, asistir a clase). El cumplimiento se verifica con fotos geolocalizadas validadas socialmente. Quien falla pierde dinero en ESCROW; quienes cumplen ganan. La penalización se reparte automáticamente. Sin intermediarios.

Audiencia target: jóvenes 18-35 años, interesados en productividad, hábitos, fitness, Web3 y superación personal.
Tono de marca: directo, motivacional, con un toque de urgencia y desafío. Usa lenguaje coloquial pero profesional.
Valores: accountability, comunidad, recompensa real, tecnología descentralizada.

Tu tarea es generar emails de marketing profesionales para CONTRACT basándote en los ejemplos proporcionados.
Adoptá el mismo estilo, estructura y tono de los ejemplos pero aplicándolo al contexto de CONTRACT.
Cada email debe tener: subject (asunto) y body (cuerpo en HTML completo y responsive).
El body debe ser HTML bien formateado con estilos inline. Usa {{name}} para personalizar el nombre del destinatario.
Responde SOLO con un array JSON con esta estructura exacta, sin texto adicional:
[{"subject": "...", "body": "..."}]`;

    const userMessage = `Ejemplos de emails de referencia:
---
${example_emails}
---

Instrucciones adicionales: ${prompt}

Genera exactamente ${quantity} email(s) nuevo(s) en el mismo estilo.
Responde ÚNICAMENTE con el array JSON, sin texto adicional.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: userMessage }],
      system: systemPrompt,
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Respuesta inesperada de Claude');

    let parsed: { subject: string; body: string }[];
    try {
      const text = content.text.trim();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No se encontró JSON válido');
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error('Claude no devolvió JSON válido');
    }

    db.prepare('UPDATE ai_generations SET generated_emails = ?, status = ? WHERE id = ?').run(
      JSON.stringify(parsed),
      'done',
      genId
    );

    return NextResponse.json({ id: genId, emails: parsed });
  } catch (e: unknown) {
    db.prepare('UPDATE ai_generations SET status = ? WHERE id = ?').run('done', genId);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
