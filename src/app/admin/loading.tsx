export default function AdminLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse p-4">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-72 bg-slate-100 rounded-lg"></div>
        </div>
        <div className="h-9 w-28 bg-slate-200 rounded-xl"></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-2xl border border-slate-200/50 p-4 space-y-2">
            <div className="h-3 w-16 bg-slate-200 rounded"></div>
            <div className="h-7 w-24 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>

      <div className="h-64 bg-slate-100 rounded-2xl border border-slate-200/60 p-4"></div>
    </div>
  );
}
