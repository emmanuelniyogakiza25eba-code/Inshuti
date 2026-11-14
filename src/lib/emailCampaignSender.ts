import { Resend } from 'resend';
import { createUnsubscribeToken } from '@/src/lib/emailPreferences';

export type CampaignProduct = { id: string; title: string; category: string; priceRwf: number; imageUrl?: string };
export type CampaignRecipient = { email: string; fullName?: string };

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] || character);
const formatRwf = (amount: number) => `RWF ${Math.round(amount).toLocaleString('en-US')}`;

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function emailHtml(subject: string, intro: string, products: CampaignProduct[], unsubscribeUrl: string) {
  const productBlocks = products.map((product) => {
    const rawImage = product.imageUrl || '';
    const image = rawImage.startsWith('https://') || rawImage.startsWith('http://') ? rawImage : rawImage.startsWith('/') ? `${siteUrl()}${rawImage}` : '';
    return `<article style="margin:0 0 30px">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.title)}" style="display:block;width:100%;max-width:540px;height:auto;border-radius:9px;margin-bottom:18px">` : ''}<p style="margin:0;color:#71717a;font-size:12px;letter-spacing:1.5px;text-transform:uppercase">${escapeHtml(product.category)}</p><h2 style="margin:8px 0;font-size:24px;line-height:1.25">${escapeHtml(product.title)}</h2><p style="margin:0 0 16px;font-size:17px;font-weight:700">${formatRwf(product.priceRwf)}</p><a href="${escapeHtml(`${siteUrl()}/shop?product=${encodeURIComponent(product.id)}`)}" style="display:inline-block;padding:13px 18px;border-radius:5px;background:#111;color:#fff;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:1px">CHECK OUT NEW ARRIVAL</a></article>`;
  }).join('<hr style="border:0;border-top:1px solid #e4e4e7;margin:26px 0">');
  const safeIntro = escapeHtml(intro).replace(/\r?\n/g, '<br>');
  return `<div style="margin:0;background:#f4f4f5;padding:30px 12px;font-family:Arial,Helvetica,sans-serif;color:#111"><div style="max-width:600px;margin:auto;background:#fff;padding:30px;border-radius:12px"><p style="margin:0 0 24px;font-size:14px;font-weight:900;letter-spacing:2px">INSHUTI <span style="font-family:cursive;font-weight:400">st@re</span></p><h1 style="margin:0 0 12px;font-size:25px;line-height:1.2">${escapeHtml(subject)}</h1><p style="margin:0 0 28px;color:#52525b;font-size:15px;line-height:1.7">${safeIntro}</p>${productBlocks}<p style="margin:28px 0 0;color:#71717a;font-size:12px;line-height:1.7">Made with care in Rwanda. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#52525b">Unsubscribe</a> from new arrival emails.</p></div></div>`;
}

export async function sendCampaignEmails({ recipients, subject, intro, products }: { recipients: CampaignRecipient[]; subject: string; intro: string; products: CampaignProduct[] }) {
  const apiKey = process.env.RESEND_API_KEY || '';
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured on the server.');
  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || 'INSHUTI st@re <onboarding@resend.dev>';
  let sent = 0;
  for (let start = 0; start < recipients.length; start += 100) {
    const messages = recipients.slice(start, start + 100).map((recipient) => {
      const email = recipient.email.trim().toLowerCase();
      const unsubscribeUrl = `${siteUrl()}/api/unsubscribe?token=${encodeURIComponent(createUnsubscribeToken(email))}`;
      const greeting = recipient.fullName ? `Hi ${recipient.fullName.trim()},` : 'Hello,';
      const html = emailHtml(subject, `${greeting}\n\n${intro}`, products, unsubscribeUrl);
      const productLines = products.map((product) => `${product.title} · ${product.category} · ${formatRwf(product.priceRwf)}\n${siteUrl()}/shop?product=${encodeURIComponent(product.id)}`).join('\n\n');
      return {
        from,
        to: [email],
        subject,
        headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
        html,
        text: `${greeting}\n\n${intro}\n\n${productLines}\n\nUnsubscribe: ${unsubscribeUrl}`,
      };
    });
    const { data, error } = await resend.batch.send(messages);
    if (error) throw new Error(error.message);
    sent += data?.data?.length ?? messages.length;
  }
  return sent;
}
