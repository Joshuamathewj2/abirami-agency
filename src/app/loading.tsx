export default function RootLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        {/* Animated Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-sky-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-sky-500 border-r-sky-500 animate-spin"></div>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-playfair text-2xl font-black text-sky-600 leading-none tracking-tight">
            Abirami
          </span>
          <span className="text-[9px] font-bold text-gray-400 tracking-[0.25em] uppercase leading-none mt-2">
            Loading...
          </span>
        </div>
      </div>
    </div>
  );
}
