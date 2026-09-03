"use client";

import { useState } from "react";
import Link from "next/link";

interface CategoryGroupCount {
  id: string;
  name: string;
  count: number;
}

interface CategorySidebarProps {
  isFaucetsMode: boolean;
  allContextUrl: string;
  categoryFilter: string | null;
  contextProductsCount: number;
  groupCounts: CategoryGroupCount[];
}

export default function CategorySidebar({
  isFaucetsMode,
  allContextUrl,
  categoryFilter,
  contextProductsCount,
  groupCounts,
}: CategorySidebarProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Find active category label for mobile header button summary
  const activeGroup = groupCounts.find(
    (g) =>
      categoryFilter &&
      (categoryFilter.toLowerCase() === g.id.toLowerCase() ||
        categoryFilter.toLowerCase() === g.name.toLowerCase())
  );
  const activeLabel = activeGroup
    ? activeGroup.name
    : isFaucetsMode
    ? "All Faucets & Fittings"
    : "All Sanitaryware";

  return (
    <aside className="lg:w-72 shrink-0">
      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5 sticky top-28 shadow-sm">
        {/* Mobile Header / Accordion Toggle Button */}
        <div className="flex items-center justify-between lg:mb-4 lg:pb-2 lg:border-b lg:border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-sm tracking-wide uppercase">
              {isFaucetsMode ? "Faucets & Fittings" : "Sanitaryware"}
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-primary">
              {isFaucetsMode ? "Faucets Mode" : "Sanitaryware Mode"}
            </span>
          </div>

          {/* Toggle button visible ONLY on mobile (< lg) */}
          <button
            onClick={() => setIsOpenMobile((prev) => !prev)}
            className="lg:hidden flex items-center gap-1.5 text-xs font-bold text-primary bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100 hover:bg-sky-100 transition-colors"
            aria-expanded={isOpenMobile}
            aria-label="Toggle Categories Filter"
          >
            <span>{isOpenMobile ? "Hide Categories" : "Filter Categories"}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpenMobile ? "rotate-180" : ""
              }`}
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

        {/* Selected category summary hint on mobile when collapsed */}
        {!isOpenMobile && (
          <div className="lg:hidden mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600 font-medium">
            <span>
              Active: <strong className="text-gray-900 font-bold">{activeLabel}</strong>
            </span>
            <span className="text-[11px] text-sky-600 font-semibold">Tap filter to change</span>
          </div>
        )}

        {/* Category List: Always block on desktop (lg:block), conditionally toggled on mobile */}
        <div
          className={`${
            isOpenMobile ? "block mt-3 pt-3 border-t border-gray-100" : "hidden"
          } lg:block lg:mt-0 lg:pt-0 lg:border-none`}
        >
          <div className="mb-2 max-h-[520px] overflow-y-auto pr-1 space-y-1">
            <Link
              href={allContextUrl}
              onClick={() => setIsOpenMobile(false)}
              className={`flex items-center justify-between text-xs font-bold py-2.5 px-3 rounded-lg transition-colors ${
                !categoryFilter
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-sky-50 hover:text-primary"
              }`}
            >
              <span>{isFaucetsMode ? "All Faucets & Fittings" : "All Sanitaryware"}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  !categoryFilter ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {contextProductsCount}
              </span>
            </Link>

            {groupCounts.map((group) => {
              const isSelected = Boolean(
                categoryFilter &&
                  (categoryFilter.toLowerCase() === group.id.toLowerCase() ||
                    categoryFilter.toLowerCase() === group.name.toLowerCase())
              );

              return (
                <Link
                  key={group.id}
                  href={`/products?category=${encodeURIComponent(group.id)}`}
                  onClick={() => setIsOpenMobile(false)}
                  className={`flex items-center justify-between text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors ${
                    isSelected
                      ? "bg-primary text-white shadow-sm"
                      : "text-gray-700 hover:bg-sky-50 hover:text-primary"
                  }`}
                >
                  <span className="truncate max-w-[170px]">{group.name}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {group.count}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Mode switch link at bottom */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link
              href={
                isFaucetsMode
                  ? "/products"
                  : "/products?category=Faucets%20%E2%80%94%20Claret%20Collection"
              }
              onClick={() => setIsOpenMobile(false)}
              className="block text-center text-xs font-bold text-sky-600 hover:text-primary py-2 px-3 rounded-lg bg-sky-50 hover:bg-sky-100 transition-colors"
            >
              Switch to {isFaucetsMode ? "Sanitaryware Categories →" : "Faucets & Fittings →"}
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
