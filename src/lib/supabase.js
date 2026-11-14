import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  || process.env.VITE_SUPABASE_URL
  || process.env.REACT_APP_SUPABASE_URL
  || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || process.env.VITE_SUPABASE_ANON_KEY
  || process.env.REACT_APP_SUPABASE_ANON_KEY
  || process.env.SUPABASE_ANON_KEY
  || '';

export const supabaseBucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'Inshuti-media';
const isPlaceholderKey = !supabaseAnonKey || /PASTE_YOUR|YOUR_ANON|PLACEHOLDER/i.test(supabaseAnonKey);
export const isSupabaseConfigured = Boolean(supabaseUrl && !isPlaceholderKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null;
