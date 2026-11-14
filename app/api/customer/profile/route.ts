import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Customer profile sync is not configured.' }, { status: 503 });
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!token || !url || !anonKey) return NextResponse.json({ error: 'A valid customer session is required.' }, { status: 401 });

  const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user?.email) return NextResponse.json({ error: 'Customer session could not be verified.' }, { status: 401 });

  let body: { fullName?: string; marketingOptIn?: boolean } = {};
  try { body = await request.json(); } catch { /* Metadata may be enough for an OAuth callback. */ }
  const user = authData.user;
  const email = user.email!.trim().toLowerCase();
  const metadata = user.user_metadata || {};
  const fullName = (typeof body.fullName === 'string' && body.fullName.trim())
    || (typeof metadata.full_name === 'string' && metadata.full_name.trim())
    || (typeof metadata.name === 'string' && metadata.name.trim())
    || email.split('@')[0];
  const { data: existing } = await supabaseAdmin.from('profiles').select('marketing_opt_in').eq('id', user.id).maybeSingle();
  const metadataOptIn = typeof metadata.marketing_opt_in === 'boolean' ? metadata.marketing_opt_in : undefined;
  const marketingOptIn = typeof body.marketingOptIn === 'boolean'
    ? body.marketingOptIn
    : existing?.marketing_opt_in ?? metadataOptIn ?? true;
  const { error } = await supabaseAdmin.from('profiles').upsert({
    id: user.id,
    email,
    full_name: fullName.slice(0, 160),
    marketing_opt_in: marketingOptIn,
  }, { onConflict: 'id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ ok: true });
}
