'use client';

import Link from 'next/link';
import AdminSidebar from './AdminSidebar';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { checkAdminSessionAction, logoutAdminAction } from '@/app/actions/adminAuth';
import {
  LayoutGrid,
  MessageSquare,
  FileText,
  Package,
  Layers,
  CreditCard,
  BarChart2,
  Tag,
  Users,
  Power,
} from 'lucide-react';

const adminNavItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutGrid },
  { name: 'WhatsApp Center', href: '/admin/whatsapp', icon: MessageSquare },
  { name: 'Orders', href: '/admin/inquiries', icon: FileText },
  { name: 'Inventory', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: Layers },
  { name: 'Billing POS', href: '/admin/billing', icon: CreditCard },
  { name: 'POS Analytics', href: '/admin/analytics', icon: BarChart2 },
  { name: 'Coupons', href: '/admin/coupons', icon: Tag },
  { name: 'Users', href: '/admin/users', icon: Users },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  const checkAdminAuth = async () => {
    try {
      const hasCookie = await checkAdminSessionAction();
      if (hasCookie) {
        setIsLocked(false);
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUser(session?.user || null);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);

      if (!session?.user) {
        setIsLocked(true);
        window.location.replace('/');
        return;
      }

      // Check admin emails
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);
      const userEmail = (session.user.email || '').toLowerCase();
      if (adminEmails.length > 0 && adminEmails.includes(userEmail)) {
        setIsLocked(false);
        return;
      }

      // User metadata check
      const userRole = (session.user.user_metadata?.role || session.user.app_metadata?.role || '').toLowerCase();
      if (userRole === 'admin') {
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
        window.location.replace('/');
      }
    } catch (err) {
      console.error('Admin layout auth verification error:', err);
      setIsLocked(true);
      window.location.replace('/');
    } finally {
      setCheckingAuth(false);
    }
  };

  // Re-check live DB role on every route navigation inside /admin
  useEffect(() => {
    checkAdminAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      await logoutAdminAction();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error during sign out:', err);
    }
    setCurrentUser(null);
    setIsLocked(true);
    window.location.replace('/');
  };

  // Normal Authorized Admin Layout
  return (
    <div className="w-full bg-slate-50 min-h-screen flex">
      {/* Desktop Sidebar (hidden on mobile, unchanged on desktop) */}
      <AdminSidebar 
        className={`hidden md:flex transition-all duration-300 ${isDesktopSidebarOpen ? 'w-64' : 'w-20'}`} 
        isCollapsed={!isDesktopSidebarOpen}
        onToggle={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        {/* Mobile Header + Sticky Top-Icon Navigation Bar (< md) */}
        <div className="md:hidden sticky top-0 z-40 shrink-0">
          {/* Mobile Top Bar */}
          <div className="h-14 bg-slate-950 px-4 flex items-center justify-between border-b border-slate-900">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="font-playfair text-base font-bold text-white tracking-tight">
                Abirami Admin
              </span>
              <span className="text-[10px] font-extrabold text-blue-400 bg-blue-900/40 border border-blue-500/30 px-1.5 py-0.5 rounded tracking-wider uppercase">
                ADMIN
              </span>
            </Link>

            <button
              onClick={handleSignOut}
              className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              title="Sign Out of Admin"
            >
              <Power className="w-4 h-4 shrink-0" />
              <span className="font-semibold text-xs">Sign Out</span>
            </button>
          </div>

          {/* Horizontal Icon Navigation Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2.5 px-3 bg-slate-900 text-slate-400 border-b border-slate-800">
            {adminNavItems.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname?.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.name}
                  className={`p-2.5 rounded-xl transition-colors shrink-0 flex items-center justify-center ${
                    isActive
                      ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Desktop Navbar (hidden md:flex) */}
        <header className="hidden md:flex bg-white border-b border-gray-200 h-16 sticky top-0 z-40 px-8 items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800 tracking-tight">Dashboard</h1>
          
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              View Store
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg whitespace-nowrap"
              title="Sign Out of Admin"
            >
              Sign Out
            </button>
            <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-primary font-bold text-sm shadow-inner uppercase shrink-0">
              {currentUser?.email ? currentUser.email.charAt(0) : 'A'}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 px-2.5 py-4 sm:p-8 flex flex-col w-full max-w-full overflow-hidden">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-2.5 sm:p-4 md:p-6 flex-1 w-full max-w-full overflow-hidden">
            {children}
          </div>
          
          {/* Admin Footer */}
          <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest shrink-0 text-center md:text-left">
            <span>© {new Date().getFullYear()} ALL RIGHTS RESERVED. ABIRAMI AGENCY.</span>
            <span>POWERED BY <span className="text-primary font-bold">CENEXA SYSTEMS</span> ©{new Date().getFullYear()}</span>
            <span className="text-primary italic tracking-normal text-xs font-serif">• PARRYWARE PREMIUM BATH EXPERIENCES.</span>
          </div>
        </main>
      </div>
    </div>
  );
}
