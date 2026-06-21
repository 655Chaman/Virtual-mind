"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomeScreen() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Keep Service Worker intact so push notifications stay active
    console.log("[Welcome] System Online");

    // Check if we crossed midnight since the last launch
    const today = new Date().toISOString().split('T')[0];
    const lastOpened = localStorage.getItem('vm_last_opened_date');
    if (lastOpened && lastOpened !== today) {
      console.log("[Welcome] Midnight crossed. Forcing hard reload to wipe stale state.");
      localStorage.setItem('vm_last_opened_date', today);
      window.location.reload();
    } else if (!lastOpened) {
      localStorage.setItem('vm_last_opened_date', today);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        enterSystem();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const enterSystem = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      window.location.replace('/home/');
    }, 600); // Wait for fade out animation
  };

  return (
    <div 
      className={`flex h-full flex-1 w-full flex-col items-center justify-center bg-black transition-opacity duration-700 cursor-pointer ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
      onClick={enterSystem}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black"></div>
      
      <div className="z-10 flex flex-col items-center justify-center space-y-12 w-full px-6">
        {/* Welcome Text */}
        <div className="flex flex-col items-center space-y-6 w-full">
          <h2 className="text-emerald-500/70 text-xs tracking-[0.5em] font-light uppercase text-center">
            System Online
          </h2>
          <h1 className="text-white text-5xl sm:text-6xl md:text-7xl font-black tracking-widest uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] text-center leading-tight">
            Welcome Back<br />
            <span className="text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">Chaman</span>
          </h1>
          <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent mt-2"></div>
        </div>

        {/* Action Prompt */}
        <div className="animate-pulse flex flex-col items-center mt-16 w-full">
          <p className="text-gray-400 text-xs tracking-[0.3em] uppercase text-center">
            <span className="text-white font-bold mx-1">TAP</span> TO BEGIN
          </p>
        </div>
      </div>
    </div>
  );
}
