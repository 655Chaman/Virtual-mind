'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FatigueCounter() {
  const router = useRouter();
  const [count, setCount] = useState(44); 
  const [goal, setGoal] = useState(150);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);

  // Vibrate the phone slightly if supported
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50); // short vibration for each tap
    }
  };

  const handleTap = () => {
    const now = Date.now();
    // DEBOUNCE: Max 2 taps per second
    if (now - lastTapTime < 300) return; 

    // CAP: Cannot exceed daily goal (prevents inflation)
    if (count >= goal) return;

    setLastTapTime(now);
    setCount(prev => prev + 1);
    setIsAnimating(true);
    triggerHaptic();
    setTimeout(() => setIsAnimating(false), 100);
  };

  const progressPercent = Math.min((count / goal) * 100, 100);

  return (
    <div className="min-h-[100dvh] w-full bg-black text-white overflow-hidden flex flex-col font-sans select-none">
      
      {/* HEADER */}
      <div className="z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.push('/home')} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition-transform">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#F97316]">FATIGUE PROTOCOL</span>
          <span className="text-xl font-black tracking-widest">{count} / {goal}</span>
        </div>
      </div>

      {/* MAIN COUNTER AREA */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-6">
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <svg className="w-96 h-96 transform -rotate-90">
            <circle cx="192" cy="192" r="180" fill="none" stroke="#333" strokeWidth="8" />
            <circle cx="192" cy="192" r="180" fill="none" stroke="#F97316" strokeWidth="8" strokeDasharray="1130" strokeDashoffset={1130 - (1130 * progressPercent) / 100} className="transition-all duration-300" />
          </svg>
        </div>

        <button 
          onClick={handleTap}
          className={`w-64 h-64 rounded-full bg-gradient-to-br from-[#F97316]/20 to-black border border-[#F97316]/50 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(249,115,22,0.1)] transition-transform ${isAnimating ? 'scale-95 bg-[#F97316]/30' : 'hover:scale-105 active:scale-95'}`}
        >
          <span className="text-8xl font-black text-white tracking-tighter">{count}</span>
          <span className="text-[10px] font-bold tracking-[0.3em] text-[#F97316] mt-2 uppercase">Tap to Log</span>
        </button>

        {count >= goal && (
           <div className="mt-12 text-center animate-in slide-in-from-bottom-4 duration-500">
              <span className="text-sm font-bold tracking-[0.2em] text-[#22C55E]">TARGET FATIGUE REACHED</span>
              <p className="text-xs text-white/50 mt-1">Ready for Sleep Protocol</p>
           </div>
        )}

      </div>

      {/* SETTINGS FOOTER */}
      <div className="p-6 border-t border-white/10 bg-black/50 backdrop-blur-md">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">Daily Goal</span>
          <div className="flex gap-2">
            <button onClick={() => setGoal(100)} className={`px-4 py-2 rounded text-[10px] font-bold tracking-widest ${goal === 100 ? 'bg-[#F97316] text-black' : 'bg-white/10 text-white'}`}>100</button>
            <button onClick={() => setGoal(150)} className={`px-4 py-2 rounded text-[10px] font-bold tracking-widest ${goal === 150 ? 'bg-[#F97316] text-black' : 'bg-white/10 text-white'}`}>150</button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
