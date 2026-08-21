'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

/**
 * Server action to authenticate the administrator.
 * Uses Supabase auth as primary, and falls back to a hardcoded master admin immediately or on connection failure.
 */
export async function loginAdminAction(emailInput: string, passwordInput: string) {
  try {
    const email = (emailInput || '').trim();
    const password = passwordInput;

    console.log('[Admin Auth Action Submit]', { email, passwordLength: password?.length });

    // Hardcoded Master Admin credentials
    const MASTER_EMAIL = 'joshuamathewj2@gmail.com';
    const MASTER_PASSWORD = 'joshua';

    // 1. Immediate check: if credentials match master admin, authenticate immediately without external fetches
    if (email.toLowerCase() === MASTER_EMAIL.toLowerCase() && password === MASTER_PASSWORD) {
      console.log('[Admin Auth Action] ✅ Master admin fallback credentials matched immediately');
      const cookieStore = await cookies();
      await cookieStore.set('admin_session', 'true', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
      return { success: true, user: { email: MASTER_EMAIL, id: 'master-admin-id' } };
    }

    // 2. Otherwise proceed to Supabase authentication
    let supabase;
    try {
      supabase = await createClient();
    } catch (clientErr: any) {
      console.error('[Admin Auth Action] Supabase client creation failed:', clientErr);
      return { success: false, error: 'Database client failed to initialize.' };
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('[Admin Auth Action] Supabase auth error:', authError.message, authError.status);
      return { success: false, error: authError.message };
    }

    if (!data.user) {
      return { success: false, error: 'Authentication failed: no user returned.' };
    }

    // Authenticated via Supabase successfully!
    // Now let's check role permission
    const userEmail = data.user.email?.toLowerCase() ?? '';
    const ADMIN_EMAILS = [
      'joshuamathewj2@gmail.com',
      ...(process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) ?? []),
      ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) ?? []),
    ];

    let hasPermission = false;

    if (ADMIN_EMAILS.includes(userEmail)) {
      hasPermission = true;
    } else {
      const userRole = data.user.user_metadata?.role || '';
      if (userRole.toLowerCase() === 'admin') {
        hasPermission = true;
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
        if (profile?.role?.toLowerCase() === 'admin') {
          hasPermission = true;
        }
      }
    }

    if (hasPermission || userEmail === MASTER_EMAIL) {
      console.log('[Admin Auth Action] ✅ Supabase authentication and role validation successful');
      const cookieStore = await cookies();
      await cookieStore.set('admin_session', 'true', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
      return { success: true, user: { email: data.user.email, id: data.user.id } };
    } else {
      console.warn('[Admin Auth Action] ❌ Permission denied for:', userEmail);
      return { success: false, error: 'Access Denied: You do not have admin permissions.' };
    }

  } catch (err: any) {
    console.error('[Admin Auth Action] Unexpected error:', err?.message ?? err);
    return { success: false, error: err?.message || 'Authentication failed due to an unexpected error.' };
  }
}

/**
 * Checks if the HTTP-only admin_session cookie is set.
 */
export async function checkAdminSessionAction() {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');
    return adminSession?.value === 'true';
  } catch (err) {
    console.error('[Admin Auth Action] Error checking session:', err);
    return false;
  }
}

/**
 * Clears the HTTP-only admin_session cookie.
 */
export async function logoutAdminAction() {
  try {
    const cookieStore = await cookies();
    await cookieStore.delete('admin_session');
    return { success: true };
  } catch (err: any) {
    console.error('[Admin Auth Action] Error logging out:', err);
    return { success: false, error: err?.message || 'Logout failed' };
  }
}
