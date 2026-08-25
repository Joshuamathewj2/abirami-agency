import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip auth checks on public storefront pages, static assets, and API routes
  const pathname = request.nextUrl.pathname;
  const isAuthRequiredRoute = 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/user') || 
    pathname === '/cart/checkout';

  const isLoginPath = pathname.startsWith('/login');

  if (!isAuthRequiredRoute && !isLoginPath) {
    return supabaseResponse;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with cross-site request forgery (CSRF) and others.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    console.error('Middleware Supabase Network Error:', err);
  }

  // Local development or admin email bypass
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');
  const isDev = process.env.NODE_ENV === 'development';
  const hasAdminCookie = request.cookies.get('admin_session')?.value === 'true';

  // Define your protected routes here (exclude /admin from automatic redirects to /login)
  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/user') || 
    request.nextUrl.pathname === '/cart/checkout';

  if (!user && isProtectedRoute) {
    // If no user, redirect to login page with the return url
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Prevent logged-in users from accessing the login page
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Role-based access control for admin routes:
  // If user is logged in, is accessing an admin path, and is NOT in dev mode / bypass email / has cookie, check role
  if (user && isAdminPath) {
    if (isDev || hasAdminCookie) {
      return supabaseResponse;
    }

    let role = user.user_metadata?.role?.toUpperCase();

    // Fallback for existing users without role in metadata
    if (!role) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      role = profile?.role?.toUpperCase();
    }

    // If role is not ADMIN, we let it proceed to /admin, where Layout will securely show the Customer Access Denied screen.
  }

  return supabaseResponse
}
