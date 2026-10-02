import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export async function createClient() {
  try {
    let cookieStore: any = null;
    try {
      cookieStore = await cookies();
    } catch {
      // Cookies may not be accessible during build or static generation
      cookieStore = null;
    }

    return createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            try {
              return cookieStore ? cookieStore.getAll() : [];
            } catch {
              return [];
            }
          },
          setAll(cookiesToSet) {
            try {
              if (cookieStore) {
                cookiesToSet.forEach(({ name, value, options }) => {
                  cookieStore.set(name, value, options);
                });
              }
            } catch (error) {
              // Expected in Server Components where cookies cannot be mutated
            }
          },
        },
      }
    );
  } catch (error) {
    console.warn('Failed to initialize Supabase server client:', error);
    return createServerClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-anon-key',
      {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      }
    );
  }
}
