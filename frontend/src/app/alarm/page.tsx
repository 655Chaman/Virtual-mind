'use client';

import { useState, useEffect } from 'react';

export default function CognitiveAlarm() {
  const [quote, setQuote] = useState("The impediment to action advances action. What stands in the way becomes the way. I will not negotiate with my own weakness today.");
  const [input, setInput] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // In production, this quote is fetched from the Oracle backend
    if (timeRemaining > 0 && !success) {
      const timer = setInterval(() => setTimeRemaining(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, success]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (e.target.value === quote) {
      setSuccess(true);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-[100dvh] w-full bg-red-950 text-white font-mono p-6 flex flex-col justify-center relative overflow-hidden">
      
      {/* Blinking Alarm Background Effect */}
      {!success && (
        <div className="absolute inset-0 bg-red-600/20 animate-pulse pointer-events-none"></div>
      )}

      <div className="z-10 max-w-md mx-auto w-full">
        
        {!success ? (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-6xl font-black text-red-500 tracking-tighter mb-2">{formatTime(timeRemaining)}</h1>
              <p className="text-xs text-red-400 tracking-[0.2em] uppercase">Boot Sequence Initiated</p>
            </div>

            <div className="bg-black/50 border border-red-500/50 p-6 rounded-xl">
              <p className="text-xs text-red-400/60 tracking-[0.1em] mb-4 uppercase">Cognitive Verification Required</p>
              <p className="text-lg leading-relaxed select-none">{quote}</p>
            </div>

            <div>
              <textarea 
                value={input}
                onChange={handleInput}
                placeholder="Type the exact quote to disarm..."
                spellCheck="false"
                className="w-full h-40 bg-black/80 border border-red-500 rounded-xl p-4 text-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none font-sans"
              />
              <p className="text-[10px] text-red-400/50 mt-2 text-center uppercase tracking-widest">
                XP penalty applied if timer expires
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-500 rounded-full mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.5)]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-widest uppercase">System Disarmed</h1>
              <p className="text-green-400 text-sm tracking-widest mt-2">Cognitive Link Established</p>
            </div>
            <button 
              onClick={() => window.location.href = '/home'}
              className="mt-8 px-8 py-4 bg-white text-black text-xs font-bold tracking-[0.2em] rounded-xl hover:bg-gray-200 transition-colors"
            >
              PROCEED TO DASHBOARD
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
