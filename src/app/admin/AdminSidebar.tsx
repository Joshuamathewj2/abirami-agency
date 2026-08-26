"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar({
  className = "",
  onLinkClick,
  isCollapsed = false,
  onToggle,
}: {
  className?: string;
  onLinkClick?: () => void;
  isCollapsed?: boolean;
  onToggle?: () => void;
}) {
  const pathname = usePathname();

  const links = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"
          />
        </svg>
      ),
    },
    {
      name: "WhatsApp Center",
      href: "/admin/whatsapp",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
    },
    {
      name: "Orders",
      href: "/admin/inquiries",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
    },
    {
      name: "Inventory",
      href: "/admin/products",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
    },
    {
      name: "Categories",
      href: "/admin/categories",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h7"
          />
        </svg>
      ),
    },
    {
      name: "Billing (POS)",
      href: "/admin/billing",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
    },
    {
      name: "POS Analytics",
      href: "/admin/analytics",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      name: "Coupons",
      href: "/admin/coupons",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      ),
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <aside
      className={`bg-white border-r border-gray-200 flex-col sticky top-0 h-screen shrink-0 z-50 transition-all duration-300 ${className}`}
    >
      {/* Sidebar Header (Logo) */}
      <div
        className={`h-16 flex items-center ${isCollapsed ? "justify-center px-0" : "justify-between px-6"} border-b border-gray-200 shrink-0`}
      >
        {!isCollapsed && (
          <Link href="/admin" className="flex items-center gap-1 shrink-0">
            <span className="font-playfair text-lg font-black text-primary-dark">
              Abirami
            </span>
            <span className="text-[0.65rem] font-bold text-sky-600 tracking-[0.15em] uppercase mt-1">
              Admin
            </span>
          </Link>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  isCollapsed
                    ? "M13 5l7 7-7 7M5 5l7 7-7 7"
                    : "M11 19l-7-7 7-7M19 19l-7-7 7-7"
                }
              />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1.5 px-4 py-6 flex-1 overflow-y-auto">
        {links.map((link) => {
          // Exact match for /admin, prefix match for others
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname?.startsWith(link.href);

          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={onLinkClick}
              className={`flex items-center gap-3 py-3 rounded-xl transition-all font-medium ${isCollapsed ? "justify-center px-0" : "px-4"} ${
                isActive
                  ? "bg-primary text-white shadow-sm hover:bg-primary-dark"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
              title={isCollapsed ? link.name : undefined}
            >
              {link.icon}
              {!isCollapsed && link.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
