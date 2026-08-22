'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useTransition } from 'react';

interface SortSelectProps {
  currentSort: string;
}

function SortSelectInner({ currentSort }: SortSelectProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'featured') {
      params.delete('sort');
    } else {
      params.set('sort', value);
    }
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  };

  return (
    <div className="relative flex items-center">
      <select
        value={currentSort}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
        className={`bg-white border border-gray-200 text-gray-900 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm cursor-pointer transition-opacity ${
          isPending ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <option value="featured" className="text-gray-900">Featured</option>
        <option value="price-asc" className="text-gray-900">Price: Low to High</option>
        <option value="price-desc" className="text-gray-900">Price: High to Low</option>
        <option value="rating" className="text-gray-900">Highest Rated</option>
        <option value="newest" className="text-gray-900">Newest First</option>
      </select>
      {isPending && (
        <span className="absolute right-2.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
        </span>
      )}
    </div>
  );
}

export default function SortSelect(props: SortSelectProps) {
  return (
    <Suspense fallback={<div className="w-36 h-9 bg-gray-100 rounded-lg animate-pulse" />}>
      <SortSelectInner {...props} />
    </Suspense>
  );
}
