"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MegaMenuItem {
  label: string;
  href: string;
}

interface MegaMenuColumn {
  title: string;
  items: MegaMenuItem[];
  isDirect?: boolean;
}

interface MegaMenuProps {
  columns: MegaMenuColumn[];
  isOpen: boolean;
  onClose: () => void;
}

export default function MegaMenu({ columns, isOpen, onClose }: MegaMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop — click outside to close */}
      <div
        className="fixed inset-0 z-40"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Mega menu panel */}
      <div
        ref={menuRef}
        className="absolute top-full left-0 right-0 z-50 bg-white shadow-2xl border-t-2 border-[#0091FF]/20 animate-mega-menu"
        role="dialog"
        aria-label="Products Mega Menu"
      >
        <div className="max-w-screen-xl mx-auto px-6 py-8">
          <div className="flex">
            {columns.map((col, colIdx) => {
              const isLast = colIdx === columns.length - 1;
              const isDirect = col.isDirect;

              return (
                <div
                  key={col.title}
                  className={`flex-1 min-w-0 ${
                    !isLast ? "border-r border-gray-200 pr-6 mr-6" : ""
                  }`}
                >
                  {/* Column title */}
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.12em] mb-4 pb-2 border-b border-gray-100">
                    {col.title}
                  </h3>

                  {/* Sub-items */}
                  <ul className="space-y-1.5">
                    {col.items.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={`group flex items-start gap-2 text-[13px] transition-colors duration-150 leading-snug ${
                            isDirect
                              ? "font-bold text-gray-800 hover:text-[#0091FF] uppercase tracking-wide text-[11px]"
                              : "font-medium text-gray-600 hover:text-[#0091FF]"
                          }`}
                        >
                          {!isDirect && (
                            <span className="text-gray-300 group-hover:text-[#0091FF] transition-colors mt-0.5 shrink-0 select-none">
                              –
                            </span>
                          )}
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium">
              Authorised Parryware Dealer — Abirami Agency, Chennai
            </p>
            <Link
              href="/products"
              onClick={onClose}
              className="inline-flex items-center gap-2 bg-[#0091FF] hover:bg-[#0078d4] text-white text-xs font-black uppercase tracking-widest px-6 py-3 transition-all duration-200 rounded-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              NEW COLLECTIONS
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
