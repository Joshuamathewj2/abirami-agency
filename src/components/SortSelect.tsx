'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

interface SortSelectProps {
  currentSort: string;
}

function SortSelectInner({ currentSort }: SortSelectProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'featured') {
      params.delete('sort');
    } else {
      params.set('sort', value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <select
      value={currentSort}
      onChange={(e) => handleChange(e.target.value)}
      className="bg-white border border-gray-200 text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm cursor-pointer"
    >
      <option value="featured" className="text-gray-900">Featured</option>
      <option value="price-asc" className="text-gray-900">Price: Low to High</option>
      <option value="price-desc" className="text-gray-900">Price: High to Low</option>
      <option value="rating" className="text-gray-900">Highest Rated</option>
      <option value="newest" className="text-gray-900">Newest First</option>
    </select>
  );
}

export default function SortSelect(props: SortSelectProps) {
  return (
    <Suspense fallback={<div className="w-36 h-9 bg-gray-100 rounded-lg animate-pulse" />}>
      <SortSelectInner {...props} />
    </Suspense>
  );
}
