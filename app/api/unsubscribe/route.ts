import { NextRequest, NextResponse } from 'next/server';
import { readUnsubscribeToken } from '@/src/lib/emailPreferences';
import { supabaseAdmin } from '@/src/lib/supabaseAdmin';

export const runtime = 'nodejs';

function page(message: string, token: string, success = false) {
  return new NextResponse(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>INSHUTI email preferences</title></head><body style="margin:0;background:#050505;color:#fff;font:16px Arial,sans-serif"><main style="max-width:520px;margin:12vh auto;padding:32px"><h1 style="font-size:24px">INSHUTI st@re</h1><p>${message}</p>${success ? '<a style="color:#93c5fd" href="/shop">Return to the store</a>' : `<form method="post"><input type="hidden" name="token" value="${token.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"><button style="border:0;border-radius:6px;background:#3b82f6;color:#fff;padding:14px 20px;font-weight:bold">Unsubscribe from new arrival emails</button></form>`}</main></body></html>`, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  if (!readUnsubscribeToken(token)) return page('This unsubscribe link is invalid or has expired.', '', true);
  return page('Confirm that you would like to stop receiving new arrival and exclusive drop emails.', token);
}

export async function POST(request: NextRequest) {
  const tokenFromQuery = request.nextUrl.searchParams.get('token');
  let token = tokenFromQuery || '';
  if (!token && request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
    const form = await request.formData();
    token = String(form.get('token') || '');
  }
  const email = readUnsubscribeToken(token);
  if (!email) return page('This unsubscribe link is invalid or has expired.', '', true);
  if (!supabaseAdmin) return page('We could not update your preferences right now. Please contact INSHUTI support.', '', true);
  const [profiles, subscribers] = await Promise.all([
    supabaseAdmin.from('profiles').update({ marketing_opt_in: false }).eq('email', email),
    supabaseAdmin.from('store_subscribers').update({ marketing_opt_in: false }).eq('email', email),
  ]);
  if (profiles.error || subscribers.error) return page('We could not update your preferences right now. Please contact INSHUTI support.', '', true);
  return page('You are unsubscribed from new arrival and exclusive drop emails.', '', true);
}
