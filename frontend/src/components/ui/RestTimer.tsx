'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Plus, Minus, Bell, BellOff, Heart } from 'lucide-react';
import { triggerHaptic } from '@/lib/utils';
import { WorkoutNotifications } from '@/lib/notifications';

interface RestTimerProps {
  initialSeconds?: number;
  onClose?: () => void;
}

export function RestTimer({ initialSeconds = 90, onClose }: RestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const totalSecondsRef = useRef(initialSeconds);
  const endTimeRef = useRef<number | null>(null);

  // Biometric respiratory pacing (8-second cycle: 4s inhale, 4s exhale)
  const [breathCycle, setBreathCycle] = useState(0);

  // Sync initialSeconds when it changes
  useEffect(() => {
    setSecondsLeft(initialSeconds);
    totalSecondsRef.current = initialSeconds;
    if (isActive) {
      endTimeRef.current = Date.now() + initialSeconds * 1000;
    }
  }, [initialSeconds]);

  // Handle active timer state changes
  useEffect(() => {
    if (isActive) {
      endTimeRef.current = Date.now() + secondsLeft * 1000;
    } else {
      endTimeRef.current = null;
    }
  }, [isActive]);

  // High-precision, drift-free countdown interval
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      if (endTimeRef.current) {
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setSecondsLeft(remaining);
        
        if (remaining <= 0) {
          setIsActive(false);
          endTimeRef.current = null;
          // Fire alarm: native notification + triple vibration + web audio
          WorkoutNotifications.restComplete();
          triggerZenChime();
        }
      }
    }, 100); // 10 ticks per second for immediate accuracy

    return () => clearInterval(interval);
  }, [isActive]);

  // Breathing guide sync ticker
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setBreathCycle((prev) => (prev + 1) % 8);
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  // Therapeutic, warm, layered major triad meditation chime (using Web Audio API)
  const triggerZenChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      
      const playTone = (freq: number, gainVal: number, duration: number, delay = 0) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(gainVal, audioCtx.currentTime + delay + 0.08); // soft fade-in attack
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delay + duration); // smooth decay
        
        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + duration);
      };

      const now = audioCtx.currentTime;
      // Warm, soothing chord (A major triad: A3 + A4 + C#5 + E5) with slow decay
      playTone(220.00, 0.12, 3.0, 0.0);
      playTone(440.00, 0.08, 2.5, 0.1);
      playTone(554.37, 0.06, 2.2, 0.2);
      playTone(659.25, 0.04, 1.8, 0.3);
    } catch (e) {
      console.warn('Zen chime failed:', e);
    }
  };

  const toggleTimer = () => {
    triggerHaptic('medium');
    setIsActive(!isActive);
  };
  
  const resetTimer = () => {
    triggerHaptic('medium');
    setSecondsLeft(totalSecondsRef.current);
    if (isActive) {
      endTimeRef.current = Date.now() + totalSecondsRef.current * 1000;
    }
  };

  const adjustTime = (amount: number) => {
    triggerHaptic('light');
    setSecondsLeft((prev) => {
      const next = prev + amount;
      const finalVal = next < 0 ? 0 : next;
      if (isActive) {
        endTimeRef.current = Date.now() + finalVal * 1000;
      }
      return finalVal;
    });
    if (amount > 0) {
      totalSecondsRef.current += amount;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // SVG Circular progress math
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progressPct = totalSecondsRef.current > 0 ? secondsLeft / totalSecondsRef.current : 0;
  const strokeDashoffset = circumference - progressPct * circumference;

  // Breathing guide attributes
  const isHolding = breathCycle === 4;
  const isInhaling = breathCycle < 4;
  const breathLabel = isInhaling ? 'Inhale...' : 'Exhale...';
  const breathScale = isInhaling 
    ? 0.95 + (breathCycle / 4) * 0.12 
    : 1.07 - ((breathCycle - 4) / 4) * 0.12;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/90 backdrop-blur-md transition-all duration-500 animate-fade-in">
      <div className="bg-surface/40 border border-indigo-500/10 shadow-[0_0_50px_rgba(99,102,241,0.08)] rounded-3xl p-8 flex flex-col items-center w-full max-w-sm text-indigo-300 font-mono relative overflow-hidden backdrop-blur-xl">
        
        {/* Soft floating breathing background glow */}
        <div 
          className="absolute w-44 h-44 rounded-full bg-indigo-500/5 blur-[60px] pointer-events-none transition-transform duration-1000 ease-in-out"
          style={{
            transform: `scale(${breathScale * 1.2})`,
          }}
        />

        {/* Close Button */}
        {onClose && (
          <button 
            onClick={() => { triggerHaptic('light'); onClose(); }} 
            className="absolute top-5 right-5 text-text-dim hover:text-indigo-300 transition-colors z-10 p-2 hover:bg-white/5 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-[10px] text-text-dim tracking-[0.4em] uppercase font-bold mb-6">ZEN REST INTERVAL</div>

        {/* Soothing Breathing Circle Ring */}
        <div className="relative w-56 h-56 flex items-center justify-center mb-6">
          {/* Breathing aura ring */}
          <div 
            className="absolute inset-0 rounded-full border border-indigo-500/10 transition-transform duration-1000 ease-in-out"
            style={{
              transform: `scale(${breathScale})`,
              boxShadow: `0 0 30px rgba(99, 102, 241, ${(breathScale - 0.95) * 0.8})`,
              background: `radial-gradient(circle, rgba(99, 102, 241, 0.03) 0%, transparent 70%)`
            }}
          />

          <svg className="w-full h-full transform -rotate-90 z-10">
            {/* Background ring */}
            <circle
              cx="112"
              cy="112"
              r={radius}
              className="stroke-white/[0.03] fill-none"
              strokeWidth="4"
            />
            {/* Zen progress ring */}
            {secondsLeft > 0 && (
              <circle
                cx="112"
                cy="112"
                r={radius}
                className="stroke-indigo-400 fill-none transition-all duration-300 ease-out"
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  filter: 'drop-shadow(0 0 6px rgba(129, 140, 248, 0.3))',
                }}
              />
            )}
          </svg>

          {/* Centered digits */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
            <span className="text-5xl font-extralight tracking-tight text-white tabular-nums font-sans leading-none">
              {formatTime(secondsLeft)}
            </span>
            {isActive ? (
              <span className="text-[9px] text-indigo-300/80 font-bold tracking-[0.2em] mt-3 animate-pulse uppercase">
                {breathLabel}
              </span>
            ) : secondsLeft === 0 ? (
              <span className="text-[10px] text-vm-green font-bold tracking-[0.3em] mt-3 animate-pulse">
                REST COMPLETE
              </span>
            ) : (
              <span className="text-[9px] text-text-dim tracking-[0.2em] mt-3 uppercase font-bold">
                PAUSED
              </span>
            )}
          </div>
        </div>

        {/* Subtle breath guidance sub-text */}
        <p className="text-[10px] text-text-dim/80 tracking-widest text-center h-4 mb-6">
          {isActive ? 'Sync your breath with the glowing ring to calm down' : 'Tap start to begin recovery'}
        </p>

        {/* Minimal Controls Layout */}
        <div className="flex flex-col w-full gap-4 z-20">
          {/* Time adjustments */}
          <div className="flex justify-between items-center gap-3">
            <button
              onClick={() => adjustTime(-30)}
              className="flex-1 py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] text-[10px] tracking-widest transition-colors flex items-center justify-center gap-1 hover:text-indigo-300"
            >
              <Minus className="w-3 h-3" /> 30S
            </button>
            <button
              onClick={() => adjustTime(30)}
              className="flex-1 py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] text-[10px] tracking-widest transition-colors flex items-center justify-center gap-1 hover:text-indigo-300"
            >
              <Plus className="w-3 h-3" /> 30S
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center gap-3">
            <button
              onClick={toggleTimer}
              className={`flex-[2] py-4 border transition-all duration-300 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.2em] ${
                isActive 
                  ? 'border-indigo-500/20 bg-indigo-950/15 hover:bg-indigo-950/25 text-indigo-300' 
                  : 'border-indigo-400 bg-indigo-500 text-obsidian hover:bg-indigo-400 font-bold'
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="w-4 h-4" /> PAUSE REST
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> START REST
                </>
              )}
            </button>

            <button
              onClick={resetTimer}
              className="flex-1 py-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] transition-colors hover:text-indigo-300 flex items-center justify-center"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => { triggerHaptic('light'); setSoundEnabled(!soundEnabled); }}
              className={`flex-1 py-4 border transition-colors flex items-center justify-center ${
                soundEnabled 
                  ? 'border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] hover:text-indigo-300' 
                  : 'border-rose-500/30 bg-rose-950/10 text-rose-400'
              }`}
              title={soundEnabled ? 'Mute Alert' : 'Unmute Alert'}
            >
              {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
