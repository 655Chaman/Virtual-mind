'use client';

import { useEffect } from 'react';
import { triggerHaptic } from '@/lib/utils';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    try {
      triggerHaptic('heavy');
    } catch (e) {}
  }, [error]);

  return (
    <main className="h-screen min-h-screen flex flex-col bg-[#050510] text-white p-6 justify-center items-center font-mono z-50 relative">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
        <span className="text-red-400 text-2xl"></span>
      </div>
      <h2 className="text-lg text-white/90 mb-3 text-center">Runtime Crash Detected</h2>
      <pre className="p-4 bg-red-950/20 border border-red-900/30 rounded text-red-400 text-xs w-full overflow-auto max-h-[300px] whitespace-pre-wrap">
        {error.message || String(error)}
        {error.stack && `\n\nStack:\n${error.stack}`}
      </pre>
      <button
        onClick={() => reset()}
        className="mt-6 px-6 py-3 rounded-md bg-white/5 border border-white/10 text-white/70 text-xs hover:bg-white/10"
      >
        TRY AGAIN
      </button>
    </main>
  );
}
