export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-32 bg-gray-150 rounded-md animate-pulse" />
        </div>
        <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-3">
            <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4">
        <div className="h-6 w-36 bg-gray-200 rounded-md animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-10 flex-1 bg-gray-50 rounded-lg animate-pulse" />
              <div className="h-10 flex-1 bg-gray-50 rounded-lg animate-pulse" />
              <div className="h-10 w-24 bg-gray-50 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
