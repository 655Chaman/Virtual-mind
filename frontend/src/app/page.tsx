"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomeScreen() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <div className="text-emerald-500 animate-pulse text-sm tracking-widest">INITIALIZING VIRTUAL MIND...</div>
    </div>
  );
}
