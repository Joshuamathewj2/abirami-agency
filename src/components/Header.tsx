"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { navItems } from "@/lib/mock-data";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import MegaMenu from "@/components/MegaMenu";

// Type for mega menu column data
interface MegaMenuColumn {
  title: string;
  isDirect?: boolean;
  items: { label: string; href: string }[];
}

function HeaderContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams ? searchParams.get("category") : null;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [expandedMobileSection, setExpandedMobileSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { totalItems: cartTotal } = useCart();
  const { totalItems: wishlistTotal } = useWishlist();
  const { user, profile, clearUser } = useUserStore();

  const [isClient, setIsClient] = useState(false);
  const megaMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Close mega menu on route change
  useEffect(() => {
    setMegaMenuOpen(false);
  }, [pathname, currentCategory]);

  const handleProductsMouseEnter = () => {
    if (megaMenuTimerRef.current) clearTimeout(megaMenuTimerRef.current);
    setMegaMenuOpen(true);
  };

  const handleProductsMouseLeave = () => {
    megaMenuTimerRef.current = setTimeout(() => {
      setMegaMenuOpen(false);
    }, 120);
  };

  const handleMegaMenuMouseEnter = () => {
    if (megaMenuTimerRef.current) clearTimeout(megaMenuTimerRef.current);
  };

  const handleMegaMenuMouseLeave = () => {
    megaMenuTimerRef.current = setTimeout(() => {
      setMegaMenuOpen(false);
    }, 120);
  };

  const isItemActive = (item: { label: string; href: string }) => {
    if (item.href === "/") {
      return pathname === "/";
    }
    if (item.href === "/contact") {
      return pathname === "/contact";
    }
    if (item.href === "/inquiry") {
      return pathname === "/inquiry";
    }
    if (item.label === "Products") {
      return pathname === "/products";
    }
    return false;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearUser();
    window.location.reload();
  };

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Account";

  if (pathname && pathname.startsWith("/admin")) {
    return null;
  }

  // Find the "Products" item and extract its megaMenu columns
  const productsItem = navItems.find((item) => item.label === "Products");
  const megaMenuColumns: MegaMenuColumn[] = (productsItem as { megaMenu?: MegaMenuColumn[] })?.megaMenu ?? [];

  const isFaucetsMode = Boolean(
    currentCategory &&
    ["faucet", "claret", "jade", "shower", "health", "trap", "hose", "coupling", "concealed", "angle", "valve"].some(
      (k) => currentCategory.toLowerCase().includes(k)
    )
  );

  const isClaretActive = pathname === "/products" && isFaucetsMode && currentCategory?.toLowerCase().includes("claret");
  const isSanitarywareActive = pathname === "/products" && !isFaucetsMode;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm print:hidden">
      {/* Top utility bar */}
      <div className="bg-primary text-white text-xs md:text-sm">
        <div className="container-main flex items-center justify-between py-1.5 md:py-2">
          <div className="flex items-center gap-1 md:gap-2">
            <svg
              className="w-3.5 h-3.5 md:w-4 md:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <a
              href="tel:8601710434"
              className="font-semibold hover:text-green-400  transition-colors"
            >
              86107 10434
            </a>
            <span className="px-1.5 opacity-70">/</span>
            <a
              href="tel:7200377455"
              className="font-semibold hover:text-green-500 transition-colors"
            >
              72003 77455
            </a>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              Fast Delivery across Tamil Nadu
            </span>
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Genuine Branded Products
            </span>
          </div>
        </div>
      </div>

      {/* Main nav — position:relative so MegaMenu can anchor to it */}
      <nav className="w-full relative">
        <div className="flex items-center h-16 md:h-20 w-full justify-between gap-2 md:gap-4">
          {/* Logo Section */}
          <Link href="/" className="flex items-center flex-shrink-0 z-10 pl-6 md:pl-8">
            <div className="flex flex-col items-start justify-center py-1">
              <span className="font-playfair text-xl md:text-2xl font-black text-primary-dark leading-none tracking-tight">
                Abirami Agency
              </span>
              <span className="text-[0.6rem] md:text-xs font-bold text-sky-600 tracking-[0.15em] uppercase leading-none mt-1">
                Parryware
              </span>
            </div>
          </Link>

          {/* Desktop Nav group */}
          <nav className="hidden lg:flex items-center gap-6">
            {/* 1. Home */}
            <div className="relative group">
              <Link
                href="/"
                className={`flex items-center py-2 transition-colors px-2.5 ${
                  pathname === "/"
                    ? "text-[#0091FF] font-semibold"
                    : "text-gray-700 hover:text-primary font-medium"
                }`}
              >
                <span className={pathname === "/" ? "border-b-2 border-[#0091FF] pb-0.5" : ""}>
                  Home
                </span>
              </Link>
            </div>

            {/* 2. Products */}
            <div
              className="relative"
              onMouseEnter={handleProductsMouseEnter}
              onMouseLeave={handleProductsMouseLeave}
            >
              <button
                onClick={() => setMegaMenuOpen((v) => !v)}
                className={`inline-flex items-center gap-1 py-2 font-medium transition-colors px-2.5 focus:outline-none ${
                  (pathname === "/products" && !isClaretActive && !isSanitarywareActive) || megaMenuOpen
                    ? "text-[#0091FF] font-semibold"
                    : "text-gray-700 hover:text-primary"
                }`}
              >
                <span className={(pathname === "/products" && !isClaretActive && !isSanitarywareActive) || megaMenuOpen ? "border-b-2 border-[#0091FF] pb-0.5" : ""}>
                  Products
                </span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${megaMenuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>

            {/* 3. Claret Collection */}
            <div className="relative group">
              <Link
                href="/products?category=Claret%20Collection"
                prefetch={true}
                className={`flex items-center py-2 transition-all px-2.5 ${
                  isClaretActive
                    ? "text-[#0091FF] font-semibold"
                    : "text-gray-700 hover:text-primary font-medium"
                }`}
              >
                <span className={isClaretActive ? "border-b-2 border-[#0091FF] pb-0.5" : ""}>
                  Claret Collection
                </span>
              </Link>
            </div>

            {/* 4. Sanitaryware Catalog */}
            <div className="relative group">
              <Link
                href="/products"
                prefetch={true}
                className={`flex items-center py-2 transition-all px-2.5 ${
                  isSanitarywareActive
                    ? "text-[#0091FF] font-semibold"
                    : "text-gray-700 hover:text-primary font-medium"
                }`}
              >
                <span className={isSanitarywareActive ? "border-b-2 border-[#0091FF] pb-0.5" : ""}>
                  Sanitaryware Catalog
                </span>
              </Link>
            </div>

            {/* 5. Contact Us */}
            <div className="relative group">
              <Link
                href="/contact"
                className={`flex items-center py-2 transition-colors px-2.5 ${
                  pathname === "/contact"
                    ? "text-[#0091FF] font-semibold"
                    : "text-gray-700 hover:text-primary font-medium"
                }`}
              >
                <span className={pathname === "/contact" ? "border-b-2 border-[#0091FF] pb-0.5" : ""}>
                  Contact Us
                </span>
              </Link>
            </div>
          </nav>

          {/* Search Bar (Centered/right-aligned flex item filling space) */}
          <form
            className="flex-1 max-w-[220px] shrink relative hidden sm:block"
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
              }
            }}
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 text-xs md:text-sm text-gray-900 placeholder-gray-400 font-semibold rounded-full pl-9 pr-4 py-2 border border-gray-200 focus:bg-white focus:border-sky-300 focus:ring-4 focus:ring-sky-50 outline-none transition-all"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-4 h-4 text-sky-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </form>

          {/* Action Buttons Block (Far right) */}
          <div className="flex items-center gap-5 flex-shrink-0 pr-6 md:pr-8">
            <Link
              href={isClient && !user ? "/login?redirect=/cart" : "/cart"}
              className="relative flex items-center gap-1.5 p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <span className="font-extrabold text-sm text-gray-700 uppercase tracking-wider block">Cart</span>
              <div className="relative">
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                  />
                </svg>
                {isClient && cartTotal > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] md:text-xs w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center font-bold shadow-sm">
                    {cartTotal > 99 ? "99+" : cartTotal}
                  </span>
                )}
              </div>
            </Link>

            {isClient && user ? (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="/user"
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-primary-dark bg-primary text-white rounded-full transition-all shadow-sm border border-primary-light/30 group"
                  title={`Go to Dashboard`}
                >
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-primary overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                    {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                      <img
                        src={user.user_metadata.avatar_url || user.user_metadata.picture}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-bold truncate max-w-[120px] pr-1">
                    Hi, {displayName.split(" ")[0]}
                  </span>
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:inline-flex items-center gap-2 border-2 border-primary text-primary px-5 py-2 rounded-lg font-semibold hover:bg-primary hover:text-white transition-all text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Login
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* ── MEGA MENU (desktop) ── */}
        <div
          onMouseEnter={handleMegaMenuMouseEnter}
          onMouseLeave={handleMegaMenuMouseLeave}
        >
          <MegaMenu
            columns={megaMenuColumns}
            isOpen={megaMenuOpen}
            onClose={() => setMegaMenuOpen(false)}
          />
        </div>

        {/* ── MOBILE DRAWER ── */}
        {mobileOpen && (
          <div className="lg:hidden pb-4 border-t animate-fade-in">
            {navItems.map((item) => {
              const active = isItemActive(item);
              const hasMegaMenu = !!(item as { megaMenu?: unknown }).megaMenu;
              const mobileChildren = hasMegaMenu
                ? (item as { children?: { label: string; href: string }[] }).children ?? []
                : (item as { children?: { label: string; href: string }[] }).children ?? [];
              const isExpanded = expandedMobileSection === item.label;

              return (
                <div key={item.label}>
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      className={`flex-1 py-3 px-2 border-b border-gray-100 flex items-center gap-2 transition-colors ${
                        active ? "text-[#0091FF] font-semibold bg-sky-50" : "text-gray-700 hover:text-primary font-medium"
                      }`}
                      onClick={() => {
                        if (!mobileChildren.length) setMobileOpen(false);
                      }}
                    >
                      {item.label === "Inquiry" && (
                        <svg className={`w-4.5 h-4.5 ${active ? "text-[#0091FF]" : "text-gray-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      )}
                      <span>{item.label}</span>
                    </Link>
                    {mobileChildren.length > 0 && (
                      <button
                        className="px-3 py-3 border-b border-gray-100 text-gray-500"
                        onClick={() => setExpandedMobileSection(isExpanded ? null : item.label)}
                      >
                        <svg className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Mobile sub-items accordion */}
                  {mobileChildren.length > 0 && isExpanded && (
                    <div className="pl-4 bg-gray-50">
                      {mobileChildren.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          className="block py-2.5 px-2 text-gray-600 hover:text-primary text-sm font-medium"
                          onClick={() => setMobileOpen(false)}
                        >
                          – {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isClient && user ? (
              <>
                <Link
                  href="/user"
                  className="flex items-center justify-center gap-2 mt-4 bg-primary text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Profile
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="w-full flex items-center justify-center gap-2 mt-2 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-lg font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 mt-4 border-2 border-primary text-primary px-5 py-2.5 rounded-lg font-semibold hover:bg-primary/5 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

export default function Header() {
  return (
    <Suspense fallback={null}>
      <HeaderContent />
    </Suspense>
  );
}
