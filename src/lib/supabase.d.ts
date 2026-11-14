import type { SupabaseClient } from '@supabase/supabase-js';

export const supabase: SupabaseClient | null;
export const isSupabaseConfigured: boolean;
export const supabaseBucket: string;
