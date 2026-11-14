import { NextRequest, NextResponse } from 'next/server';
import { isValidAdminSession } from '@/src/lib/adminSession';
import { sendCampaignEmails, type CampaignProduct, type CampaignRecipient } from '@/src/lib/emailCampaignSender';
import { supabaseAdmin } from '@/src/lib/supabaseAdmin';

export const runtime = 'nodejs';

type RequestBody = {
  mode?: 'test' | 'send' | 'schedule';
  ownerEmail?: string;
  subject?: string;
  introMessage?: string;
  products?: CampaignProduct[];
};

function nextKigaliMorningDrop(now = new Date()) {
  const kigaliOffsetMs = 2 * 60 * 60 * 1000;
  const localNow = new Date(now.getTime() + kigaliOffsetMs);
  const localDrop = new Date(localNow);
  localDrop.setUTCHours(8, 0, 0, 0);
  if (localDrop.getTime() <= localNow.getTime()) localDrop.setUTCDate(localDrop.getUTCDate() + 1);
  return new Date(localDrop.getTime() - kigaliOffsetMs).toISOString();
}

async function optedInRecipients(): Promise<CampaignRecipient[]> {
  const [profiles, subscribers] = await Promise.all([
    supabaseAdmin!.from('profiles').select('email,full_name').eq('marketing_opt_in', true),
    supabaseAdmin!.from('store_subscribers').select('email,full_name').eq('marketing_opt_in', true),
  ]);
  if (profiles.error || subscribers.error) throw new Error(profiles.error?.message || subscribers.error?.message || 'Could not load opted-in customers.');
  const unique = new Map<string, CampaignRecipient>();
  for (const row of [...(profiles.data || []), ...(subscribers.data || [])]) {
    if (typeof row.email !== 'string' || !row.email.includes('@')) continue;
    const email = row.email.trim().toLowerCase();
    unique.set(email, { email, fullName: typeof row.full_name === 'string' ? row.full_name : '' });
  }
  return Array.from(unique.values());
}

function validateProducts(value: unknown): CampaignProduct[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) return null;
  const products: CampaignProduct[] = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object') return null;
    const product = candidate as Partial<CampaignProduct>;
    if (typeof product.id !== 'string' || !product.id.trim() || typeof product.title !== 'string' || !product.title.trim()
      || typeof product.category !== 'string' || !product.category.trim() || !Number.isFinite(Number(product.priceRwf)) || Number(product.priceRwf) < 0) return null;
    products.push({ id: product.id.trim(), title: product.title.trim(), category: product.category.trim(), priceRwf: Number(product.priceRwf), imageUrl: typeof product.imageUrl === 'string' ? product.imageUrl : '' });
  }
  return products;
}

export async function GET(request: NextRequest) {
  if (!isValidAdminSession(request)) return NextResponse.json({ error: 'Owner session required.' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase server access is not configured.' }, { status: 503 });
  const { data, error } = await supabaseAdmin.from('email_campaigns').select('id,subject,intro_message,product_ids,product_payloads,recipient_count,status,sent_at,scheduled_for,created_at').order('created_at', { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ campaigns: data || [] });
}

export async function POST(request: NextRequest) {
  if (!isValidAdminSession(request)) return NextResponse.json({ error: 'Owner session required.' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase server access is not configured.' }, { status: 503 });
  let body: RequestBody;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid campaign details.' }, { status: 400 }); }
  const mode = body.mode;
  const subject = typeof body.subject === 'string' ? body.subject.trim().slice(0, 180) : '';
  const intro = typeof body.introMessage === 'string' ? body.introMessage.trim().slice(0, 3000) : '';
  const products = validateProducts(body.products);
  if (!['test', 'send', 'schedule'].includes(mode || '') || !subject || !intro || !products) return NextResponse.json({ error: 'Add a subject, message, and at least one valid product.' }, { status: 400 });

  if (mode === 'test') {
    const ownerEmail = typeof body.ownerEmail === 'string' ? body.ownerEmail.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) return NextResponse.json({ error: 'Enter a valid owner email for the test send.' }, { status: 400 });
    try {
      const sent = await sendCampaignEmails({ recipients: [{ email: ownerEmail, fullName: 'INSHUTI Owner' }], subject: `[TEST] ${subject}`, intro, products });
      return NextResponse.json({ ok: true, sent });
    } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Test email failed.' }, { status: 502 }); }
  }

  if (mode === 'schedule') {
    const scheduledFor = nextKigaliMorningDrop();
    const { data, error } = await supabaseAdmin.from('email_campaigns').insert({
      subject, intro_message: intro, product_ids: products.map((product) => product.id), product_payloads: products,
      recipient_count: 0, status: 'scheduled', scheduled_for: scheduledFor,
    }).select('id,scheduled_for').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 502 });
    return NextResponse.json({ ok: true, campaignId: data.id, scheduledFor: data.scheduled_for });
  }

  let recipients: CampaignRecipient[];
  try { recipients = await optedInRecipients(); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load subscribers.' }, { status: 502 }); }
  const { data: campaign, error: insertError } = await supabaseAdmin.from('email_campaigns').insert({
    subject, intro_message: intro, product_ids: products.map((product) => product.id), product_payloads: products,
    recipient_count: 0, status: 'sending',
  }).select('id').single();
  if (insertError || !campaign) return NextResponse.json({ error: insertError?.message || 'Could not log this campaign.' }, { status: 502 });

  try {
    const sent = await sendCampaignEmails({ recipients, subject, intro, products });
    const sentAt = new Date().toISOString();
    await supabaseAdmin.from('email_campaigns').update({ recipient_count: sent, status: 'sent', sent_at: sentAt }).eq('id', campaign.id);
    if (products.length) await supabaseAdmin.from('store_items').update({ notified_at: sentAt }).in('id', products.map((product) => product.id));
    return NextResponse.json({ ok: true, campaignId: campaign.id, sent });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Campaign delivery failed.';
    await supabaseAdmin.from('email_campaigns').update({ recipient_count: 0, status: 'failed' }).eq('id', campaign.id);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
