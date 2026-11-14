import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmwvwydnghwwmxcmednj.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = serviceRoleKey
  ? createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;
