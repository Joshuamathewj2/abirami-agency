export default function ProductDetailLoading() {
  return (
    <div>
      {/* Breadcrumb Skeleton */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-main py-4">
          <div className="h-4 w-64 bg-gray-100 rounded-md animate-pulse" />
        </div>
      </div>

      <div className="container-main py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Images Section Skeleton */}
          <div className="space-y-4">
            <div className="aspect-square w-full bg-gray-100 rounded-2xl animate-pulse" />
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-20 h-20 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>

          {/* Details Section Skeleton */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="h-4 w-28 bg-gray-150 rounded-md animate-pulse" />
              <div className="h-10 w-3/4 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-4 w-40 bg-gray-100 rounded-md animate-pulse" />
            </div>

            <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />

            <hr className="border-gray-100" />

            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-100 rounded-md animate-pulse" />
              <div className="h-4 w-full bg-gray-100 rounded-md animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-100 rounded-md animate-pulse" />
            </div>

            <div className="space-y-4">
              <div className="h-4 w-24 bg-gray-150 rounded-md animate-pulse" />
              <div className="flex flex-wrap gap-2.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 w-24 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="h-14 flex-1 bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-14 flex-1 bg-gray-200 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>

        {/* Related Products Grid Skeleton */}
        <div className="py-12 border-t border-gray-100 mt-12">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col h-[380px]">
                <div className="w-full h-48 bg-gray-100 animate-pulse" />
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-gray-100 rounded-md animate-pulse" />
                    <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse" />
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded-md animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
