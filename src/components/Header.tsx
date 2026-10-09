"use client";

import { useState, useEffect, useRef, Suspense, useTransition } from "react";
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

interface SearchSuggestion {
  id: string;
  name: string;
  slug: string;
  thumbnail: string;
  price: number;
  category?: string;
}

function HeaderContent() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const currentCategory = searchParams ? searchParams.get("category") : null;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [expandedMobileSection, setExpandedMobileSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Live search suggestions state
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchVisibleOnScroll, setIsSearchVisibleOnScroll] = useState(true);
  const lastScrollY = useRef(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [dbCategories, setDbCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function loadDbCategories() {
      try {
        const { data } = await supabase.from('materials').select('id, name').order('name', { ascending: true });
        if (data && data.length > 0) {
          setDbCategories(data);
        }
      } catch (err) {
        console.error('Failed to load categories in header:', err);
      }
    }
    loadDbCategories();
  }, []);

  const { totalItems: cartTotal } = useCart();
  const { totalItems: wishlistTotal } = useWishlist();
  const { user, profile, clearUser } = useUserStore();

  const [isClient, setIsClient] = useState(false);
  const megaMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Close mega menu and mobile menu on route change or search params update
  useEffect(() => {
    setMegaMenuOpen(false);
    setMobileOpen(false);
    setShowSuggestions(false);
  }, [pathname, currentCategory, searchParams]);

  // Lock body scroll and handle Escape key for mobile slide-in drawer
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setMobileOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [mobileOpen]);

  // Click outside to dismiss search suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Collapse / reveal mobile search bar on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 70) {
        if (currentScrollY > lastScrollY.current + 8) {
          setIsSearchVisibleOnScroll(false);
          setShowSuggestions(false);
        } else if (currentScrollY < lastScrollY.current - 8) {
          setIsSearchVisibleOnScroll(true);
        }
      } else {
        setIsSearchVisibleOnScroll(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Debounced product suggestions for search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await supabase
          .from('mattresses')
          .select(`
            id, name,
            materials ( name ),
            product_images!product_images_mattress_id_fkey ( image_url, is_primary ),
            variants!variants_mattress_id_fkey ( price )
          `)
          .ilike('name', `%${searchQuery.trim()}%`)
          .eq('is_active', true)
          .limit(5);

        if (data && data.length > 0) {
          const mapped: SearchSuggestion[] = data.map((item: any) => {
            const primaryImg = item.product_images?.find((img: any) => img.is_primary) || item.product_images?.[0];
            const sortedPrices = (item.variants || [])
              .map((v: any) => Number(v.price))
              .filter((p: number) => p > 0)
              .sort((a: number, b: number) => a - b);
            return {
              id: item.id,
              name: item.name,
              slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              thumbnail: primaryImg?.image_url || '/logo.webp',
              price: sortedPrices[0] || 0,
              category: item.materials?.name || 'Sanitaryware',
            };
          });
          setSuggestions(mapped);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Search suggestion error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const mobileNavItems = [
    { label: "Home", href: "/" },
    {
      label: "Products",
      href: "/products",
      children: productsItem?.children ?? [],
    },
    { label: "Claret Collection", href: "/products?category=Claret%20Collection" },
    { label: "Sanitaryware Catalog", href: "/products" },
    { label: "Contact Us", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm print:hidden">
      {/* ────────────────── TOP UTILITY STRIP ────────────────── */}
      <div className="bg-primary text-white text-xs md:text-sm">
        {/* Desktop Top Strip (hidden < md) */}
        <div className="container-main hidden md:flex items-center justify-center gap-8 py-1.5 md:py-2 font-medium">
          <span className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-emerald-300"
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
          <span className="opacity-40">•</span>
          <span className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-emerald-300"
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

        {/* Mobile Top Strip (< md): Auto-scrolling Trust Ticker */}
        <div className="md:hidden">
          {/* Auto-scrolling / Swipeable Trust Ticker */}
          <div className="overflow-hidden py-1.5 px-2 bg-primary text-[11px] font-semibold text-white/95">
            <div className="animate-ticker flex items-center gap-8 whitespace-nowrap">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                Fast Delivery across Tamil Nadu
              </span>
              <span className="text-white/40">•</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-300 inline-block"></span>
                Genuine Branded Products
              </span>
              <span className="text-white/40">•</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                Authorised Parryware Wholesaler
              </span>
              <span className="text-white/40">•</span>
              {/* Seamless loop duplication */}
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                Fast Delivery across Tamil Nadu
              </span>
              <span className="text-white/40">•</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-300 inline-block"></span>
                Genuine Branded Products
              </span>
              <span className="text-white/40">•</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                Authorised Parryware Wholesaler
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────── MAIN NAV CONTAINER ────────────────── */}
      <nav className="w-full relative">
        {/* ROW 1: Logo + Desktop Nav / Mobile Action Bar */}
        <div className="flex items-center h-14 md:h-20 w-full justify-between gap-2 md:gap-4 px-3 sm:px-6 md:px-8">
          {/* Logo Section */}
          <Link href="/" className="flex items-center flex-shrink-0 z-10" onClick={() => setMobileOpen(false)}>
            <div className="flex flex-col items-start justify-center py-1">
              <span className="font-playfair text-xl md:text-2xl font-black text-primary-dark leading-none tracking-tight">
                Abirami Agency
              </span>
              <span className="text-[0.6rem] md:text-xs font-bold text-sky-600 tracking-[0.15em] uppercase leading-none mt-1">
                Parryware
              </span>
            </div>
          </Link>

          {/* Desktop Nav group (hidden < lg) */}
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

          {/* Desktop Search Bar (hidden on phone, visible on sm+) */}
          <form
            className={`flex-1 max-w-[220px] shrink relative hidden sm:block ${isPending ? 'opacity-50' : ''}`}
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                startTransition(() => {
                  router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                });
              }
            }}
          >
            <div className="relative">
              <input
                type="text"
                disabled={isPending}
                placeholder={isPending ? "Searching..." : "Search products..."}
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

          {/* Action Buttons Block (Cart, Profile, Hamburger) */}
          <div className="flex items-center gap-2 sm:gap-4 md:gap-5 flex-shrink-0">
            {/* Cart with badge (>= 44px touch target) */}
            <Link
              href={isClient && !user ? "/login?redirect=/cart" : "/cart"}
              onClick={() => setMobileOpen(false)}
              className="relative min-w-[44px] min-h-[44px] flex items-center justify-center p-2 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Shopping Cart"
            >
              <div className="relative flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gray-700"
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
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] md:text-xs w-4.5 h-4.5 md:w-5 md:h-5 rounded-full flex items-center justify-center font-bold shadow-xs">
                    {cartTotal > 99 ? "99+" : cartTotal}
                  </span>
                )}
              </div>
            </Link>

            {/* Mobile User Profile / Login (min 44px target) */}
            {isClient && user ? (
              <Link
                href="/user"
                onClick={() => setMobileOpen(false)}
                className="flex md:hidden items-center justify-center min-w-[44px] min-h-[44px] rounded-full text-primary shrink-0"
                title="Go to Dashboard"
                aria-label="User Profile"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary-light/30 overflow-hidden shadow-inner flex items-center justify-center">
                  {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                    <img
                      src={user.user_metadata.avatar_url || user.user_metadata.picture}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-primary">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex md:hidden items-center justify-center min-w-[44px] min-h-[44px] rounded-full text-gray-700 shrink-0"
                title="Login"
                aria-label="Login"
              >
                <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </Link>
            )}

            {/* Desktop User / Login button (hidden on mobile, unchanged) */}
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

            {/* Mobile Hamburger Button (>= 44px target) */}
            <button
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* ────────────────── ROW 2: FULL-WIDTH MOBILE SEARCH BAR ────────────────── */}
        <div
          ref={searchContainerRef}
          className={`lg:hidden px-3 pb-2.5 pt-0.5 border-t border-gray-100/70 bg-white transition-all duration-300 relative ${
            isSearchVisibleOnScroll
              ? 'opacity-100 translate-y-0 max-h-16'
              : 'opacity-0 -translate-y-2 max-h-0 overflow-hidden pointer-events-none pb-0 pt-0 border-transparent'
          }`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                setShowSuggestions(false);
                startTransition(() => {
                  router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                });
              }
            }}
            className="relative w-full"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                disabled={isPending}
                placeholder={isPending ? "Searching products..." : "Search WCs, basins, faucets, fittings..."}
                value={searchQuery}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 focus:bg-white text-xs text-gray-900 placeholder-gray-400 font-semibold rounded-xl pl-9 pr-9 h-11 border border-gray-200 focus:border-sky-400 focus:ring-3 focus:ring-sky-100 outline-none transition-all shadow-2xs"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-sky-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); setSuggestions([]); setShowSuggestions(false); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full"
                  aria-label="Clear search query"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Suggestions Dropdown with product thumbnails and prices */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in divide-y divide-gray-50">
                <div className="px-3 py-1.5 bg-slate-50/80 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider flex justify-between items-center">
                  <span>Suggested Products</span>
                  {isSearching && <span className="text-sky-500 text-[10px]">Updating...</span>}
                </div>
                {suggestions.map((sug) => (
                  <Link
                    key={sug.id}
                    href={`/product/${sug.slug}`}
                    onClick={() => {
                      setShowSuggestions(false);
                      setSearchQuery("");
                    }}
                    className="flex items-center gap-3 p-2.5 hover:bg-sky-50/60 active:bg-sky-100/60 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                      <img
                        src={sug.thumbnail}
                        alt={sug.name}
                        className="w-full h-full object-contain p-0.5"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate group-hover:text-primary transition-colors">
                        {sug.name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">
                        {sug.category}
                      </p>
                    </div>
                    {sug.price > 0 && (
                      <span className="text-xs font-extrabold text-slate-900 shrink-0">
                        ₹{sug.price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </Link>
                ))}
                <button
                  type="submit"
                  className="w-full py-2.5 text-center text-xs font-bold text-primary bg-sky-50/50 hover:bg-sky-100/60 transition-colors block"
                >
                  View all results for &ldquo;{searchQuery}&rdquo; &rarr;
                </button>
              </div>
            )}
          </form>
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

        {/* ── MOBILE SLIDE-IN DRAWER WITH BACKDROP ── */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Dark Backdrop (click to close) */}
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-in Drawer Container */}
            <div
              className="relative ml-auto w-[85%] max-w-[340px] h-full bg-white shadow-2xl flex flex-col z-10 animate-fade-in overflow-hidden"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-slate-50/70 shrink-0">
                <div className="flex flex-col">
                  <span className="font-playfair text-lg font-black text-primary-dark leading-tight">
                    Abirami Agency
                  </span>
                  <span className="text-[10px] font-bold text-sky-600 tracking-wider uppercase">
                    Parryware Tamil Nadu
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable Navigation Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-1">
                {mobileNavItems.map((item) => {
                  const active = isItemActive(item);
                  const mobileChildren = item.children ?? [];
                  const isExpanded = expandedMobileSection === item.label;

                  return (
                    <div key={item.label} className="border-b border-gray-50 last:border-none">
                      <div className="flex items-center">
                        <Link
                          href={item.href}
                          className={`flex-1 min-h-[44px] px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
                            active
                              ? "text-primary font-bold bg-sky-50/80"
                              : "text-gray-700 hover:text-primary font-semibold text-sm"
                          }`}
                          onClick={() => setMobileOpen(false)}
                        >
                          <span>{item.label}</span>
                        </Link>
                        {mobileChildren.length > 0 && (
                          <button
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-primary transition-colors focus:outline-none"
                            onClick={() => setExpandedMobileSection(isExpanded ? null : item.label)}
                            aria-label={`Toggle ${item.label} subcategories`}
                          >
                            <svg className={`w-4.5 h-4.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Mobile Accordion Sub-items */}
                      {mobileChildren.length > 0 && isExpanded && (
                        <div className="pl-4 bg-gray-50/80 rounded-xl mb-2 py-1.5 space-y-0.5 border border-gray-100">
                          {mobileChildren.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className="min-h-[40px] flex items-center py-2 px-3 text-gray-600 hover:text-primary text-xs font-semibold rounded-lg hover:bg-white transition-colors"
                              onClick={() => setMobileOpen(false)}
                            >
                              &bull; {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Direct Call & WhatsApp Action Buttons in Drawer */}
                <div className="pt-4 border-t border-gray-100 space-y-2.5">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block px-1">
                    Direct Contact
                  </span>
                  <a
                    href="tel:8610710434"
                    className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors"
                  >
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call: 86107 10434
                  </a>
                  <a
                    href="https://wa.me/917200377455?text=Hi%2C%20I%20would%20like%20to%20inquire%20about%20Parryware%20products"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.053-.984-.047-.35-.098-.795-.275-1.428-.548-2.673-1.157-4.412-3.864-4.546-4.043-.134-.179-1.087-1.446-1.087-2.758 0-1.312.69-1.957.935-2.223.245-.266.535-.333.713-.333.178 0 .356.003.512.012.167.01.39-.063.611.467.223.535.758 1.848.825 1.982.067.134.112.29.022.468-.09.178-.134.29-.267.446-.134.156-.28.349-.401.468-.134.134-.274.28-.118.548.156.268.694 1.144 1.488 1.851 1.022.909 1.884 1.192 2.152 1.325.267.134.423.112.579-.067.156-.178.668-.78.846-1.047.178-.268.356-.223.6-.134.245.09 1.56.736 1.828.87.267.134.446.201.512.312.067.112.067.647-.077 1.052z" />
                    </svg>
                    WhatsApp Order
                  </a>
                </div>
              </div>

              {/* Bottom Profile / Account Area in Drawer */}
              <div className="p-4 border-t border-gray-100 bg-slate-50/70 shrink-0">
                {isClient && user ? (
                  <div className="space-y-2">
                    <Link
                      href="/user"
                      className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-primary text-white rounded-xl font-bold shadow-sm hover:bg-primary-dark transition-colors text-xs"
                      onClick={() => setMobileOpen(false)}
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile &amp; Orders
                    </Link>
                    <button
                      onClick={() => { setMobileOpen(false); handleLogout(); }}
                      className="w-full min-h-[44px] flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 rounded-xl font-bold transition-colors text-xs"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="w-full min-h-[44px] flex items-center justify-center gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-xl font-bold transition-colors text-xs"
                    onClick={() => setMobileOpen(false)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Login / Sign Up
                  </Link>
                )}
              </div>
            </div>
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
