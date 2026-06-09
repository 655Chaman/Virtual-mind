'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Moon, Sun, Power, Shield, Clock, TrendingUp, Bell, BellOff, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { triggerHaptic } from '@/lib/utils';

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  const s = Math.floor((minutes % 1) * 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function computeElapsedMin(startISO: string | null): number {
  if (!startISO) return 0;
  let normalized = startISO;
  const timePart = normalized.split('T')[1] || '';
  if (!normalized.endsWith('Z') && !timePart.includes('+') && !timePart.includes('-')) {
    normalized = normalized + 'Z';
  }
  return (Date.now() - new Date(normalized).getTime()) / 60000;
}

export default function SleepControlCenter() {
  const router = useRouter();
  const [sleepStatus, setSleepStatus] = useState<any>(null);
  const [sleepHistory, setSleepHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSleepLoading, setIsSleepLoading] = useState(false);
  const [, tick] = useState(0);

  // Digital Sunset state
  const [sunsetHour] = useState(20); // 8 PM
  const [wakeHour] = useState(5);    // 5 AM
  const [sunsetActive, setSunsetActive] = useState(false);
  const [sunsetCountdown, setSunsetCountdown] = useState('');

  // Tick every second
  useEffect(() => {
    const interval = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Sunset countdown logic
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const isSunset = hour >= sunsetHour || hour < wakeHour;
    setSunsetActive(isSunset);

    if (!isSunset) {
      const sunsetToday = new Date(now);
      sunsetToday.setHours(sunsetHour, 0, 0, 0);
      const diffMs = sunsetToday.getTime() - now.getTime();
      if (diffMs > 0) {
        const h = Math.floor(diffMs / 3600000);
        const m = Math.floor((diffMs % 3600000) / 60000);
        setSunsetCountdown(`${h}h ${m}m`);
      }
    }
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [status, history] = await Promise.all([
        api.wellness.sleep.today().catch(() => null),
        api.wellness.sleep.history(7).catch(() => []),
      ]);
      setSleepStatus(status);
      setSleepHistory(Array.isArray(history) ? history : []);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggleSleep = async () => {
    if (isSleepLoading) return;
    triggerHaptic('heavy');
    setIsSleepLoading(true);
    try {
      if (sleepStatus?.is_sleeping) {
        await api.wellness.sleep.stop();
      } else {
        await api.wellness.sleep.start();
        // Trigger native Android lock for 7 hours
        if (typeof window !== 'undefined' && (window as any).Android && (window as any).Android.startSleepSession) {
          (window as any).Android.startSleepSession(7);
        }
      }
      const updated = await api.wellness.sleep.today();
      setSleepStatus(updated);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSleepLoading(false);
    }
  };

  const isSleeping = sleepStatus?.is_sleeping;
  const elapsedMinutes = isSleeping ? computeElapsedMin(sleepStatus?.sleep_start_time) : 0;
  const elapsedHours = elapsedMinutes / 60;
  const goalHours = 7.5;
  const progressPct = Math.min(100, (elapsedHours / goalHours) * 100);

  // SVG Circular Progress
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center font-mono gap-6">
        <div className="scanline-overlay" />
        <div className="w-16 h-16 border border-indigo-400/20 border-t-indigo-400/80 rounded-full animate-spin" />
        <p className="text-text-dim text-xs tracking-[0.4em] animate-pulse">INIT SLEEP SYSTEM...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-gray-300 font-mono relative pb-10 overflow-x-hidden">
      <div className="scanline-overlay" />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-obsidian/95 backdrop-blur-sm border-b border-white/[0.04] px-4 py-4 pt-safe flex items-center gap-3">
        <button
          onClick={() => { triggerHaptic('light'); router.push('/wellness'); }}
          className="p-2 -ml-2 text-text-dim hover:text-indigo-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-indigo-300 font-mono font-bold tracking-[0.3em] text-base">🌙 SLEEP SYSTEM</h1>
          <p className="text-[9px] text-text-dim tracking-widest mt-0.5">RECOVERY · CIRCADIAN · PROTOCOL</p>
        </div>
        <Moon className="w-4 h-4 text-indigo-400/50" />
      </header>

      <div className="px-4 pt-6 space-y-6">

        {/* ── MAIN SLEEP TIMER ───────────────────────────────────── */}
        <div 
          className={`relative overflow-hidden p-6 border transition-all duration-500 ${
            isSleeping 
              ? 'border-indigo-500/40 bg-indigo-950/20' 
              : 'border-white/[0.06] bg-surface'
          }`}
          style={{
            boxShadow: isSleeping ? '0 0 40px rgba(100,120,255,0.1), inset 0 0 20px rgba(100,120,255,0.03)' : 'none',
          }}
        >
          {isSleeping && (
            <div className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(100,120,255,0.06) 0%, transparent 70%)',
              }}
            />
          )}

          {/* Circular Timer */}
          <div className="flex flex-col items-center relative z-10">
            <div className="relative w-56 h-56 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="112" cy="112" r={radius}
                  className="fill-none"
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                {isSleeping && (
                  <circle
                    cx="112" cy="112" r={radius}
                    className="fill-none transition-all duration-1000 ease-linear"
                    stroke="rgba(129, 140, 248, 0.7)"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(129, 140, 248, 0.4))',
                    }}
                  />
                )}
              </svg>
              
              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isSleeping ? (
                  <>
                    <Moon className="w-6 h-6 text-indigo-400 mb-2 animate-pulse" />
                    <span className="text-4xl font-bold text-indigo-300 tracking-tight tabular-nums font-mono"
                      style={{ textShadow: '0 0 20px rgba(100,120,255,0.5)' }}
                    >
                      {formatDuration(elapsedMinutes)}
                    </span>
                    <span className="text-[8px] text-indigo-400/60 tracking-[0.3em] mt-2">
                      DEEP SLEEP ACTIVE
                    </span>
                    <span className="text-[9px] text-indigo-300/80 mt-1 font-bold">
                      {elapsedHours.toFixed(1)}h / {goalHours}h goal
                    </span>
                  </>
                ) : (
                  <>
                    <Moon className="w-8 h-8 text-text-dim/30 mb-3" />
                    <span className="text-2xl font-bold text-white/50 tracking-widest">
                      {sleepStatus?.last_sleep_hours 
                        ? `${sleepStatus.last_sleep_hours.toFixed(1)}h`
                        : '—'
                      }
                    </span>
                    <span className="text-[8px] text-text-dim tracking-[0.3em] mt-2">
                      LAST SLEEP SESSION
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Toggle Button */}
            <button
              onClick={handleToggleSleep}
              disabled={isSleepLoading}
              className={`w-full max-w-xs py-4 font-bold text-xs tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 ${
                isSleeping
                  ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30 shadow-[0_0_15px_rgba(100,120,255,0.15)]'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_20px_rgba(100,120,255,0.25)]'
              }`}
            >
              <Power className="w-4 h-4" />
              {isSleeping ? 'WAKE UP — END SLEEP' : 'START SLEEP SESSION'}
            </button>
          </div>
        </div>

        {/* ── DIGITAL SUNSET PROTOCOL ───────────────────────────── */}
        <div 
          className={`p-5 border relative overflow-hidden transition-all duration-500 ${
            sunsetActive 
              ? 'border-gold/40 bg-gold/5' 
              : 'border-white/[0.06] bg-surface'
          }`}
          style={{
            boxShadow: sunsetActive ? '0 0 25px rgba(201,168,76,0.08)' : 'none',
          }}
        >
          {sunsetActive && (
            <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
              style={{ background: 'radial-gradient(circle at top right, rgba(201,168,76,0.15), transparent 70%)' }}
            />
          )}
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className={`w-5 h-5 ${sunsetActive ? 'text-gold animate-pulse' : 'text-text-dim'}`} />
              <div>
                <h3 className={`text-xs font-bold tracking-[0.3em] ${sunsetActive ? 'text-gold' : 'text-text-dim'}`}>
                  DIGITAL SUNSET PROTOCOL
                </h3>
                <p className="text-[8px] text-text-dim tracking-widest mt-0.5">
                  {sunsetActive ? '⚠️ ACTIVE — PHONE SHOULD BE OFF' : `ACTIVATES AT ${sunsetHour}:00`}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1.5 border text-[9px] font-bold tracking-widest font-mono ${
              sunsetActive 
                ? 'border-gold bg-gold/10 text-gold' 
                : 'border-white/[0.06] text-text-dim'
            }`}>
              {sunsetActive ? '🔒 LOCKED' : sunsetCountdown ? `⏳ ${sunsetCountdown}` : '—'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-obsidian/50 border border-white/[0.04] p-3 flex items-center gap-3">
              <Sun className="w-4 h-4 text-orange-300/60" />
              <div>
                <p className="text-[7px] text-text-dim tracking-[0.3em]">SUNSET</p>
                <p className="text-sm font-bold text-white font-mono">{sunsetHour}:00</p>
              </div>
            </div>
            <div className="bg-obsidian/50 border border-white/[0.04] p-3 flex items-center gap-3">
              <Moon className="w-4 h-4 text-indigo-300/60" />
              <div>
                <p className="text-[7px] text-text-dim tracking-[0.3em]">WAKE TIME</p>
                <p className="text-sm font-bold text-white font-mono">{wakeHour}:00</p>
              </div>
            </div>
          </div>

          {sunsetActive && (
            <div className="mt-4 p-3 bg-gold/5 border border-gold/30 text-center animate-pulse">
              <p className="text-[9px] text-gold tracking-[0.2em] font-bold font-mono">
                ⚠️ DIGITAL SUNSET ACTIVE — PUT YOUR PHONE DOWN. SLEEP IS YOUR WEAPON.
              </p>
            </div>
          )}
        </div>

        {/* ── SLEEP HISTORY ─────────────────────────────────────── */}
        <div className="bg-surface border border-white/[0.06] p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] tracking-[0.3em] font-bold text-indigo-300 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              LAST 7 SESSIONS
            </h3>
            <button
              onClick={() => router.push('/wellness/progress')}
              className="text-[9px] text-text-dim hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              VIEW ALL <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {sleepHistory.length === 0 ? (
            <p className="text-text-dim text-[10px] tracking-widest text-center py-6">NO SLEEP SESSIONS LOGGED YET</p>
          ) : (
            <div className="space-y-2">
              {sleepHistory.slice(0, 7).map((session: any, i: number) => {
                const hours = session.duration_hours || 0;
                const goalHit = hours >= goalHours;
                const pct = Math.min(100, (hours / goalHours) * 100);
                const startDate = new Date(session.start_time);
                
                return (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.03] last:border-0">
                    <div className="w-16 text-[9px] text-text-dim font-mono shrink-0">
                      {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1 bg-obsidian border border-white/[0.04] h-5 relative overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${goalHit ? 'bg-indigo-500' : 'bg-indigo-500/40'}`}
                        style={{ width: `${pct}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[8px] font-mono text-white/60">{hours.toFixed(1)}h</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 flex items-center justify-center text-[10px] ${goalHit ? 'text-vm-green' : 'text-text-dim/30'}`}>
                      {goalHit ? '✓' : '·'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── SLEEP INSIGHTS ───────────────────────────────────── */}
        <div className="bg-surface border border-white/[0.06] p-4">
          <h3 className="text-[10px] tracking-[0.3em] font-bold text-indigo-300 flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            SLEEP INTELLIGENCE
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-obsidian/50 border border-white/[0.04] p-3 text-center">
              <p className="text-lg font-bold text-indigo-300 font-mono">
                {sleepStatus?.last_sleep_hours?.toFixed(1) || '—'}
                <span className="text-[9px] text-text-dim ml-0.5">h</span>
              </p>
              <p className="text-[7px] text-text-dim tracking-[0.3em] mt-1">LAST SESSION</p>
            </div>
            <div className="bg-obsidian/50 border border-white/[0.04] p-3 text-center">
              <p className="text-lg font-bold text-indigo-300 font-mono">
                {goalHours}<span className="text-[9px] text-text-dim ml-0.5">h</span>
              </p>
              <p className="text-[7px] text-text-dim tracking-[0.3em] mt-1">NIGHTLY GOAL</p>
            </div>
            <div className="bg-obsidian/50 border border-white/[0.04] p-3 text-center">
              <p className="text-lg font-bold text-gold font-mono">
                {sleepHistory.length > 0 
                  ? (sleepHistory.reduce((s, h) => s + (h.duration_hours || 0), 0) / sleepHistory.length).toFixed(1)
                  : '—'
                }
                <span className="text-[9px] text-text-dim ml-0.5">h</span>
              </p>
              <p className="text-[7px] text-text-dim tracking-[0.3em] mt-1">7-DAY AVG</p>
            </div>
            <div className="bg-obsidian/50 border border-white/[0.04] p-3 text-center">
              <p className="text-lg font-bold text-vm-green font-mono">
                {sleepHistory.filter(h => (h.duration_hours || 0) >= goalHours).length}
                <span className="text-[9px] text-text-dim ml-0.5">/{sleepHistory.length}</span>
              </p>
              <p className="text-[7px] text-text-dim tracking-[0.3em] mt-1">GOALS HIT</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
