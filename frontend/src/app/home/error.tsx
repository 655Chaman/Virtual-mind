'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an API or console
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black p-4 text-white">
      <h2 className="text-xl font-bold text-red-500 mb-4">Something went wrong in Home!</h2>
      <pre className="bg-red-900/50 p-4 rounded text-xs overflow-auto max-w-full text-red-100">
        {error.message || 'Unknown error'}
      </pre>
      <pre className="bg-zinc-900 mt-4 p-4 rounded text-[10px] overflow-auto max-w-full text-zinc-400">
        {error.stack}
      </pre>
      <button
        className="mt-6 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-500"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
