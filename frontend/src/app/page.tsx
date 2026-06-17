"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomeScreen() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Nuke Service Worker to ensure fresh fetches
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister();
        }
      });
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
      
      <div className="z-10 flex flex-col items-center justify-center space-y-12">
        {/* Welcome Text */}
        <div className="flex flex-col items-center space-y-4">
          <h2 className="text-emerald-500/70 text-sm tracking-[0.5em] font-light uppercase">
            Welcome Back
          </h2>
          <h1 className="text-white text-5xl md:text-7xl font-black tracking-widest uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            Virtual Mind
          </h1>
          <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent mt-4"></div>
        </div>

        {/* Action Prompt */}
        <div className="animate-pulse flex flex-col items-center mt-16">
          <p className="text-gray-400 text-xs tracking-[0.3em] uppercase">
            Press <span className="text-white font-bold mx-1">ENTER</span> or Tap to Begin
          </p>
        </div>
      </div>
    </div>
  );
}
