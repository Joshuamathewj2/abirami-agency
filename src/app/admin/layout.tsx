'use client';

import Link from 'next/link';
import AdminSidebar from './AdminSidebar';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { loginAdminAction, checkAdminSessionAction, logoutAdminAction } from '@/app/actions/adminAuth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Lock Screen States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const checkAdminAuth = async () => {
    try {
      const hasCookie = await checkAdminSessionAction();
      if (hasCookie) {
        setIsLocked(false);
        // Best effort: load Supabase user info for UI, but don't lock if failing/unauthenticated in Supabase
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUser(session?.user || null);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);

      if (!session?.user) {
        setIsLocked(true);
        window.location.href = "/login?redirect=/admin";
        return;
      }

      // User metadata check
      const userRole = session.user.user_metadata?.role || '';
      if (userRole.toLowerCase() === 'admin') {
        setIsLocked(false);
        return;
      }

      // Database Role Validation
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role?.toLowerCase() === 'admin') {
        setIsLocked(false);
      } else {
        setIsLocked(true);
        alert("Access denied: Admin privileges required");
        window.location.href = "/";
      }
    } catch (err) {
      console.error('Admin layout auth verification error:', err);
      setIsLocked(true);
      window.location.href = "/";
    } finally {
      setCheckingAuth(false);
    }
  };

  // Re-check live DB role on every route navigation inside /admin
  useEffect(() => {
    checkAdminAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formEmail = (form.elements.namedItem('email') as HTMLInputElement)?.value || email;
    const formPassword = (form.elements.namedItem('password') as HTMLInputElement)?.value || password;

    if (!formEmail || !formPassword) {
      setLoginError('Please enter both email and password.');
      return;
    }

    const trimmedEmail = formEmail.trim();

    setIsLoading(true);
    setLoginError(null);

    try {
      const result = await loginAdminAction(trimmedEmail, formPassword);
      if (!result.success) {
        setLoginError(result.error || 'Authentication failed.');
        setIsLocked(true);
        return;
      }

      setCurrentUser(result.user);
      setIsLocked(false);
    } catch (err: any) {
      console.error('[Admin Login] Unexpected error:', err?.message ?? err);
      setLoginError(`Unexpected error: ${err?.message ?? 'Please try again.'}`);
      setIsLocked(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutAdminAction();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error during sign out:', err);
    }
    setCurrentUser(null);
    setIsLocked(true);
    setLoginError(null);
    setEmail('');
    setPassword('');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <svg className="animate-spin h-6 w-6 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Admin Portal...</span>
        </div>
      </div>
    );
  }

  // Render Standalone Minimalist Admin Lock Screen if locked
  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center py-12 px-4 select-none">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="flex flex-col items-center justify-center gap-1.5">
              <svg className="w-12 h-12 text-sky-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div className="flex flex-col items-center justify-center">
                <span className="font-playfair text-2xl font-black text-white leading-none tracking-tight">
                  Abirami Agency
                </span>
                <span className="text-[10px] font-bold text-sky-400 tracking-[0.25em] uppercase leading-none mt-1.5">
                  Parryware Admin
                </span>
              </div>
            </div>
            <h1 className="text-sm font-bold text-slate-350 pt-2 uppercase tracking-wider">
              Administration Lock Screen
            </h1>
          </div>

          {/* Feedback messages */}
          {loginError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold leading-relaxed">
              ⚠️ {loginError}
            </div>
          )}

          {/* Display logic if logged in as client */}
          {currentUser ? (
            <div className="space-y-4 text-center">
              <p className="text-xs font-medium text-slate-400 leading-normal">
                You are currently signed in as <strong className="text-slate-200">{currentUser.email}</strong>, which does not have admin privileges.
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-widest transition-colors cursor-pointer shadow-md"
              >
                Sign Out & Switch Account
              </button>
            </div>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-sky-500 text-slate-100 text-xs font-bold transition-colors"
                    placeholder="admin@abirami.agency"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-12 py-3 outline-none focus:border-sky-500 text-slate-100 text-xs font-bold transition-colors"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 focus:outline-none cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-600/10"
              >
                {isLoading ? 'Unlocking...' : 'Authenticate Admin'}
              </button>
            </form>
          )}

          {/* Footer Back Button */}
          <div className="pt-2 text-center">
            <Link href="/" className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors">
              ← Back to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Normal Authorized Admin Layout
  return (
    <div className="w-full bg-slate-50 min-h-screen flex">
      {/* Desktop Sidebar */}
      <AdminSidebar 
        className={`hidden md:flex transition-all duration-300 ${isDesktopSidebarOpen ? 'w-64' : 'w-20'}`} 
        isCollapsed={!isDesktopSidebarOpen}
        onToggle={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
      />

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
          
          {/* Sidebar */}
          <div className="relative flex w-64 max-w-xs flex-1 bg-white">
            <div className="absolute right-4 top-4 z-50">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <AdminSidebar className="flex w-full" onLinkClick={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-200 h-16 sticky top-0 z-40 px-3 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 focus:outline-none md:hidden shrink-0"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <Link href="/admin" className="md:hidden flex items-center gap-1.5 shrink-0">
              <span className="font-playfair text-sm sm:text-lg font-black text-primary-dark whitespace-nowrap">Abirami Agency</span>
              <span className="text-[9px] sm:text-[10px] font-bold text-sky-600 uppercase tracking-wider bg-sky-50 px-1.5 py-0.5 rounded whitespace-nowrap">Parryware</span>
            </Link>
            <h1 className="text-lg font-bold text-gray-800 tracking-tight hidden sm:block">Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link href="/" className="text-xs sm:text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap bg-gray-50 hover:bg-gray-100 px-2 sm:px-3 py-1.5 rounded-lg">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              View Store
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2.5 sm:px-3 py-1.5 rounded-lg whitespace-nowrap"
              title="Sign Out of Admin"
            >
              Sign Out
            </button>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sky-100 hidden sm:flex items-center justify-center text-primary font-bold text-xs sm:text-sm shadow-inner uppercase shrink-0">
              {currentUser?.email ? currentUser.email.charAt(0) : 'A'}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-8 flex flex-col">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 flex-1">
            {children}
          </div>
          
          {/* Admin Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest shrink-0">
            <span>© {new Date().getFullYear()} ALL RIGHTS RESERVED. ABIRAMI AGENCY.</span>
            <span>POWERED BY <span className="text-primary font-bold">CENEXA SYSTEMS</span> ©{new Date().getFullYear()}</span>
            <span className="text-primary italic tracking-normal text-xs font-serif">• PARRYWARE PREMIUM BATH EXPERIENCES.</span>
          </div>
        </main>
      </div>
    </div>
  );
}
