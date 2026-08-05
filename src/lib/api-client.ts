import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppError } from './errors/AppError';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Generic fetcher wrapper to handle Supabase quirks and prevent UI crashes
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  try {
    const { data, error } = await queryFn();
    if (error) {
      // Log to monitoring (Sentry/Logtail later)
      console.error('[API Error]', error);
      throw new AppError(error.message, error.code, error.status);
    }
    if (data === null) {
      throw new AppError('Resource not found', 'NOT_FOUND', 404);
    }
    return data;
  } catch (err) {
    if (err instanceof AppError) throw err;
    // Catch network failures
    throw new AppError('Network or server error', 'NETWORK_ERROR', 500);
  }
}
