export default function ProductsLoading() {
  return (
    <div>
      {/* Header Skeleton */}
      <div className="bg-[#fcfcfc] border-b border-gray-100 pt-8 pb-6 md:pt-10 md:pb-8">
        <div className="container-main">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="h-9 w-64 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-4 w-32 bg-gray-150 rounded-md animate-pulse" />
            </div>
            <div className="h-9 w-40 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      <div className="container-main py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Skeleton */}
          <aside className="lg:w-72 shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
              <div className="h-5 w-28 bg-gray-200 rounded-md animate-pulse" />
              <div className="space-y-2.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-9 w-full bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </aside>

          {/* Product Grid Skeleton */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col h-[400px]">
                  {/* Image Placeholder */}
                  <div className="w-full h-56 bg-gray-100 animate-pulse relative" />
                  
                  {/* Content Placeholder */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="h-3 w-20 bg-gray-150 rounded-md animate-pulse" />
                      <div className="h-5 w-44 bg-gray-200 rounded-md animate-pulse" />
                      <div className="h-4 w-full bg-gray-100 rounded-md animate-pulse" />
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                      <div className="h-6 w-20 bg-gray-200 rounded-md animate-pulse" />
                      <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
