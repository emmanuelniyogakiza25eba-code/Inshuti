import { NextRequest, NextResponse } from 'next/server';
import { sendCampaignEmails, type CampaignProduct } from '@/src/lib/emailCampaignSender';
import { supabaseAdmin } from '@/src/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET || '';
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Cron authorization required.' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase server access is not configured.' }, { status: 503 });
  const { data: campaigns, error } = await supabaseAdmin.from('email_campaigns')
    .select('id,subject,intro_message,product_ids,product_payloads')
    .eq('status', 'scheduled').lte('scheduled_for', new Date().toISOString()).order('scheduled_for', { ascending: true }).limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });

  const results: { id: string; status: string; sent?: number; error?: string }[] = [];
  for (const campaign of campaigns || []) {
    const claimed = await supabaseAdmin.from('email_campaigns').update({ status: 'sending' }).eq('id', campaign.id).eq('status', 'scheduled').select('id').maybeSingle();
    if (claimed.error || !claimed.data) continue;
    const [profiles, subscribers] = await Promise.all([
      supabaseAdmin.from('profiles').select('email,full_name').eq('marketing_opt_in', true),
      supabaseAdmin.from('store_subscribers').select('email,full_name').eq('marketing_opt_in', true),
    ]);
    if (profiles.error || subscribers.error) {
      const message = profiles.error?.message || subscribers.error?.message || 'Could not load opted-in customers.';
      await supabaseAdmin.from('email_campaigns').update({ status: 'failed' }).eq('id', campaign.id);
      results.push({ id: campaign.id, status: 'failed', error: message });
      continue;
    }
    const recipients = new Map<string, { email: string; fullName: string }>();
    for (const row of [...(profiles.data || []), ...(subscribers.data || [])]) if (row.email) recipients.set(row.email.toLowerCase(), { email: row.email.toLowerCase(), fullName: row.full_name || '' });
    try {
      const sent = await sendCampaignEmails({ recipients: Array.from(recipients.values()), subject: campaign.subject, intro: campaign.intro_message, products: (campaign.product_payloads || []) as CampaignProduct[] });
      const sentAt = new Date().toISOString();
      await supabaseAdmin.from('email_campaigns').update({ recipient_count: sent, status: 'sent', sent_at: sentAt }).eq('id', campaign.id);
      if (campaign.product_ids?.length) await supabaseAdmin.from('store_items').update({ notified_at: sentAt }).in('id', campaign.product_ids);
      results.push({ id: campaign.id, status: 'sent', sent });
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : 'Morning drop email failed.';
      await supabaseAdmin.from('email_campaigns').update({ status: 'failed' }).eq('id', campaign.id);
      results.push({ id: campaign.id, status: 'failed', error: message });
    }
  }
  return NextResponse.json({ ok: true, processed: results.length, results });
}
