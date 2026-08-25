import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Build a fresh Service Role client — guaranteed to bypass RLS
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export async function GET() {
  try {
    const supabaseAdmin = getAdminClient();

    // ── 1. Pull every account from Supabase Auth (paginate to get ALL) ──
    let allAuthUsers: any[] = [];
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) throw new Error(`Auth listUsers error: ${error.message}`);
      if (!data?.users?.length) break;
      allAuthUsers = allAuthUsers.concat(data.users);
      if (data.users.length < perPage) break; // last page
      page++;
    }

    // ── 2. Pull profiles table (best-effort; ignore errors) ──
    const { data: dbProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role');

    const profilesMap = new Map((dbProfiles || []).map((p: any) => [p.id, p]));

    // ── 3. For auth users without a profile row, auto-create one ──
    const missingIds = allAuthUsers
      .filter((u) => !profilesMap.has(u.id))
      .map((u) => ({
        id: u.id,
        email: u.email || '',
        full_name:
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          '',
        role:
          u.user_metadata?.role || 'customer',
        created_at: u.created_at || new Date().toISOString(),
      }));

    if (missingIds.length > 0) {
      const { error: insertErr } = await supabaseAdmin
        .from('profiles')
        .upsert(missingIds, { onConflict: 'id' });
      if (insertErr) {
        console.warn('Could not auto-upsert missing profiles:', insertErr.message);
      } else {
        missingIds.forEach((p) => profilesMap.set(p.id, p));
      }
    }

    // ── 4. Merge into clean response array ──
    const merged = allAuthUsers.map((u) => {
      const profile = profilesMap.get(u.id);
      const role =
        profile?.role ||
        u.user_metadata?.role ||
        'customer';
      const provider =
        u.app_metadata?.provider ||
        u.identities?.[0]?.provider ||
        'email';

      return {
        id: u.id,
        email: u.email || profile?.email || '',
        full_name:
          profile?.full_name ||
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          '',
        role,
        created_at: u.created_at || new Date().toISOString(),
        provider,
      };
    });

    return NextResponse.json({ success: true, data: merged });
  } catch (error: any) {
    console.error('[GET /api/admin/users]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const body = await request.json();
    const { userId, newRole, role } = body;
    const targetRole = newRole || role; // accept either field name

    if (!userId || !targetRole) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or role' },
        { status: 400 }
      );
    }

    // 1. Update Auth user_metadata (so JWT reflects new role on next sign-in)
    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { role: targetRole }
    });
    if (authErr) {
      console.error('[PATCH /api/admin/users] Auth metadata update error:', authErr);
      throw new Error(`Auth update error: ${authErr.message}`);
    }

    // 2. Update profiles table directly (Service Role bypasses RLS)
    const { error: dbErr } = await supabaseAdmin
      .from('profiles')
      .update({ role: targetRole })
      .eq('id', userId);
    if (dbErr) {
      console.error('[PATCH /api/admin/users] Profile update error:', dbErr);
      throw new Error(`Database update error: ${dbErr.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PATCH /api/admin/users]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update role' },
      { status: 500 }
    );
  }
}
