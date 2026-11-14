import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Cloud newsletter sync is not configured.' }, { status: 503 });
  let body: { id?: string; email?: string; timestamp?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid subscriber.' }, { status: 400 }); }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  const { error } = await supabaseAdmin.from('store_subscribers').upsert({
    id: body.id || `subscriber-${Date.now()}`,
    email,
    created_at: body.timestamp || new Date().toISOString(),
  }, { onConflict: 'email' });
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ ok: true });
}
