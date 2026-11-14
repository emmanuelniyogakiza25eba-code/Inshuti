import { createHmac, timingSafeEqual } from 'node:crypto';

function secret() {
  return process.env.INSHUTI_UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

export function createUnsubscribeToken(email: string) {
  const payload = Buffer.from(JSON.stringify({ email: email.trim().toLowerCase() }), 'utf8').toString('base64url');
  const key = secret();
  if (!key) throw new Error('An unsubscribe signing secret is not configured.');
  return `${payload}.${createHmac('sha256', key).update(payload).digest('base64url')}`;
}

export function readUnsubscribeToken(token: string) {
  const [payload, supplied] = token.split('.');
  const key = secret();
  if (!key || !payload || !supplied) return null;
  const expected = Buffer.from(createHmac('sha256', key).update(payload).digest('base64url'));
  const actual = Buffer.from(supplied);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { email?: string };
    return typeof value.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) ? value.email : null;
  } catch { return null; }
}
