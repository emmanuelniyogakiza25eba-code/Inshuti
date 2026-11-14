import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/src/lib/supabase';
import { supabaseAdmin } from '@/src/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function GET() {
  if (!isSupabaseConfigured || !supabaseAdmin) return NextResponse.json({ active: false });
  const checks = await Promise.all([
    supabaseAdmin.from('store_items').select('id').limit(1),
    supabaseAdmin.from('store_orders').select('id').limit(1),
    supabaseAdmin.from('store_subscribers').select('id').limit(1),
  ]);
  const failed = checks.find((result) => result.error);
  if (failed?.error) return NextResponse.json({ active: false, error: failed.error.message }, { status: 503 });
  return NextResponse.json({ active: true });
}
