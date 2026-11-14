import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { isValidAdminSession } from '@/src/lib/adminSession';
import { createUnsubscribeToken } from '@/src/lib/emailPreferences';
import { supabaseAdmin } from '@/src/lib/supabaseAdmin';

export const runtime = 'nodejs';

type ProductNotice = { id?: string; title?: string; category?: string; priceRwf?: number; imageUrl?: string };
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] || character);

export async function POST(request: NextRequest) {
  if (!isValidAdminSession(request)) return NextResponse.json({ error: 'Owner session required.' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase server access is not configured.' }, { status: 503 });
  const apiKey = process.env.RESEND_API_KEY || '';
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY is not configured on the server.' }, { status: 503 });

  let product: ProductNotice;
  try { product = await request.json(); } catch { return NextResponse.json({ error: 'Invalid product details.' }, { status: 400 }); }
  const id = typeof product.id === 'string' ? product.id.trim() : '';
  const title = typeof product.title === 'string' ? product.title.trim() : '';
  const category = typeof product.category === 'string' ? product.category.trim() : '';
  const price = Number(product.priceRwf);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  if (!id || !title || !category || !Number.isFinite(price) || price < 0) return NextResponse.json({ error: 'Product ID, title, category, and a valid price are required.' }, { status: 400 });
  const rawImage = typeof product.imageUrl === 'string' ? product.imageUrl.trim() : '';
  const imageUrl = rawImage.startsWith('https://') || rawImage.startsWith('http://') ? rawImage : rawImage.startsWith('/') ? `${siteUrl}${rawImage}` : '';
  const productUrl = `${siteUrl}/shop?product=${encodeURIComponent(id)}`;
  const [profilesResult, subscribersResult] = await Promise.all([
    supabaseAdmin.from('profiles').select('email,full_name').eq('marketing_opt_in', true),
    supabaseAdmin.from('store_subscribers').select('email,full_name').eq('marketing_opt_in', true),
  ]);
  if (profilesResult.error || subscribersResult.error) return NextResponse.json({ error: profilesResult.error?.message || subscribersResult.error?.message || 'Could not load opted-in customers.' }, { status: 502 });

  const byEmail = new Map<string, { email: string; name: string }>();
  for (const row of [...(profilesResult.data || []), ...(subscribersResult.data || [])]) {
    if (typeof row.email !== 'string' || !row.email.includes('@')) continue;
    const email = row.email.trim().toLowerCase();
    byEmail.set(email, { email, name: typeof row.full_name === 'string' ? row.full_name.trim() : '' });
  }
  const recipients = Array.from(byEmail.values());
  if (!recipients.length) return NextResponse.json({ ok: true, sent: 0, message: 'No opted-in customers to notify.' });

  const safeTitle = escapeHtml(title);
  const safeCategory = escapeHtml(category);
  const image = imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${safeTitle}" width="560" style="display:block;width:100%;max-width:560px;height:auto;border-radius:10px;margin:0 auto 24px">` : '';
  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || 'INSHUTI st@re <onboarding@resend.dev>';
  let sent = 0;
  try {
    for (let start = 0; start < recipients.length; start += 100) {
      const messages = recipients.slice(start, start + 100).map((recipient) => {
        const unsubscribeUrl = `${siteUrl}/api/unsubscribe?token=${encodeURIComponent(createUnsubscribeToken(recipient.email))}`;
        const greeting = recipient.name ? `Hi ${escapeHtml(recipient.name)},` : 'Hello,';
        return {
          from,
          to: [recipient.email],
          subject: `New arrival: ${title} · INSHUTI st@re`,
          headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
          html: `<div style="margin:0;background:#f4f4f5;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;color:#111"><div style="max-width:600px;margin:auto;background:#fff;padding:32px;border-radius:14px"><p style="margin:0 0 22px;font-size:13px;font-weight:800;letter-spacing:2px">INSHUTI <span style="font-family:cursive;font-weight:400">st@re</span></p>${image}<p style="margin:0 0 12px;color:#52525b;font-size:14px">${greeting} A new piece just landed.</p><p style="margin:0;color:#71717a;font-size:12px;letter-spacing:1.5px;text-transform:uppercase">${safeCategory}</p><h1 style="margin:8px 0 10px;font-size:28px;line-height:1.2">${safeTitle}</h1><p style="margin:0 0 24px;font-size:18px;font-weight:700">RWF ${Math.round(price).toLocaleString('en-US')}</p><a href="${escapeHtml(productUrl)}" style="display:inline-block;padding:15px 22px;border-radius:6px;background:#111;color:white;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1px">CHECK OUT NEW ARRIVAL</a><p style="margin:30px 0 0;color:#71717a;font-size:12px;line-height:1.6">Made with care in Rwanda. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#52525b">Unsubscribe</a> from new arrival emails.</p></div></div>`,
          text: `${greeting}\nNew arrival: ${title}\n${category} · RWF ${Math.round(price).toLocaleString('en-US')}\nShop: ${productUrl}\nUnsubscribe: ${unsubscribeUrl}`,
        };
      });
      const { data, error } = await resend.batch.send(messages);
      if (error) return NextResponse.json({ error: error.message, sent }, { status: 502 });
      sent += data?.data?.length ?? messages.length;
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Email delivery failed.', sent }, { status: 502 });
  }
  return NextResponse.json({ ok: true, sent, total: recipients.length });
}
