import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const COOKIE_NAME = 'inshuti-admin-session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const OWNER_PASSWORD = process.env.INSHUTI_OWNER_PASSWORD || 'INSHUTI2026';

function sessionSecret() {
  return process.env.INSHUTI_ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

function signature(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function validSession(request: NextRequest) {
  const secret = sessionSecret();
  const token = request.cookies.get(COOKIE_NAME)?.value || '';
  const [payload, suppliedSignature] = token.split('.');
  if (!secret || !payload || !suppliedSignature) return false;
  const expectedSignature = signature(payload, secret);
  const expectedBuffer = Buffer.from(expectedSignature);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) return false;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { expiresAt?: number };
    return typeof session.expiresAt === 'number' && session.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: validSession(request) });
}

export async function POST(request: NextRequest) {
  const secret = sessionSecret();
  if (!secret) return NextResponse.json({ error: 'Cloud admin session is not configured on the server.' }, { status: 503 });
  let password = '';
  try {
    const body = await request.json();
    password = typeof body?.password === 'string' ? body.password : '';
  } catch {
    return NextResponse.json({ error: 'Enter the owner password.' }, { status: 400 });
  }
  const supplied = Buffer.from(password);
  const expected = Buffer.from(OWNER_PASSWORD);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return NextResponse.json({ error: 'That password did not match. Try again.' }, { status: 401 });
  }

  const payload = Buffer.from(JSON.stringify({ expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 })).toString('base64url');
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(COOKIE_NAME, `${payload}.${signature(payload, secret)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(COOKIE_NAME, '', { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 0 });
  return response;
}
