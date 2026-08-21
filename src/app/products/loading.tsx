import React from 'react';

export default function ProductsLoading() {
  return (
    <div className="container-main py-10 animate-pulse">
      {/* Header Skeleton */}
      <div className="h-10 bg-gray-250 rounded-lg w-1/3 mb-6"></div>
      <div className="h-4 bg-gray-250 rounded-lg w-1/4 mb-10"></div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Skeleton */}
        <div className="w-full lg:w-72 h-[450px] bg-gray-100 rounded-xl"></div>

        {/* Product Grid Skeleton */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 h-[380px] flex flex-col justify-between">
              <div className="h-48 bg-gray-100 rounded-xl mb-4"></div>
              <div className="h-6 bg-gray-100 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-4"></div>
              <div className="h-10 bg-gray-100 rounded-lg w-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
