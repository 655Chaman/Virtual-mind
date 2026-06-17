"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomeScreen() {
  useEffect(() => {
    // 1. Nuke Service Worker to ensure fresh fetches
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister();
        }
      });
    }

    // 2. Hard redirect to /home/ with trailing slash to bypass 307 redirect
    setTimeout(() => {
      window.location.replace('/home/');
    }, 500);
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <div className="text-emerald-500 animate-pulse text-sm tracking-widest">INITIALIZING VIRTUAL MIND...</div>
    </div>
  );
}
