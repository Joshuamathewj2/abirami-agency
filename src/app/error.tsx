'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root Route Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 bg-slate-50 text-slate-900 font-sans">
      <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-md border border-slate-200 text-center space-y-4">
        <h2 className="text-xl font-bold text-rose-600">Something went wrong</h2>
        <p className="text-sm text-slate-500">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition cursor-pointer"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
