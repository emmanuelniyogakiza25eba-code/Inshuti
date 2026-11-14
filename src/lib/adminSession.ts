import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'inshuti-admin-session';

export function isValidAdminSession(request: NextRequest) {
  const secret = process.env.INSHUTI_ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const token = request.cookies.get(COOKIE_NAME)?.value || '';
  const [payload, suppliedSignature] = token.split('.');
  if (!secret || !payload || !suppliedSignature) return false;
  const expected = Buffer.from(createHmac('sha256', secret).update(payload).digest('base64url'));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return false;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { expiresAt?: number };
    return typeof session.expiresAt === 'number' && session.expiresAt > Date.now();
  } catch {
    return false;
  }
}
