'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap, Flame, Clock, TrendingUp, Power, ChevronRight, Award } from 'lucide-react';
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

function getFastPhase(minutes: number): string {
  const hours = minutes / 60.0;
  if (hours < 12)  return "GLYCOGEN BURNING";
  if (hours < 14)  return "FAT BURNING INITIATED";
  if (hours < 16)  return "KETOSIS APPROACHING";
  if (hours < 18)  return "AUTOPHAGY ACTIVE";
  return "DEEP AUTOPHAGY — CELLULAR REPAIR";
}

export default function FastControlCenter() {
  const router = useRouter();
  const [fastStatus, setFastStatus] = useState<any>(null);
  const [fastHistory, setFastHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFastLoading, setIsFastLoading] = useState(false);
  const [, tick] = useState(0);

  // Tick every second
  useEffect(() => {
    const interval = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [status, history] = await Promise.all([
        api.wellness.fast.today().catch(() => null),
        api.wellness.fast.history(7).catch(() => []),
      ]);
      setFastStatus(status);
      setFastHistory(Array.isArray(history) ? history : []);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggleFast = async () => {
    if (isFastLoading) return;
    triggerHaptic('heavy');
    setIsFastLoading(true);
    try {
      if (fastStatus?.is_fasting) {
        await api.wellness.fast.stop();
      } else {
        await api.wellness.fast.start();
      }
      const updated = await api.wellness.fast.today();
      setFastStatus(updated);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsFastLoading(false);
    }
  };

  const isFasting = fastStatus?.is_fasting;
  const elapsedMinutes = isFasting ? computeElapsedMin(fastStatus?.fast_start_time) : 0;
  const elapsedHours = elapsedMinutes / 60;
  const goalHours = 16;
  const progressPct = Math.min(100, (elapsedHours / goalHours) * 100);
  const remainingMinutes = Math.max(0, goalHours * 60 - elapsedMinutes);
  const overageMinutes = Math.max(0, elapsedMinutes - goalHours * 60);

  // SVG Circular Progress
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center font-mono gap-6">
        <div className="scanline-overlay" />
        <div className="w-16 h-16 border border-orange-400/20 border-t-orange-400/80 rounded-full animate-spin" />
        <p className="text-text-dim text-xs tracking-[0.4em] animate-pulse">INIT FAST SYSTEM...</p>
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
          className="p-2 -ml-2 text-text-dim hover:text-orange-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-orange-400 font-mono font-bold tracking-[0.3em] text-base"> FAST SYSTEM</h1>
          <p className="text-[9px] text-text-dim tracking-widest mt-0.5">METABOLISM · AUTOPHAGY · PROTOCOL</p>
        </div>
        <Zap className="w-4 h-4 text-orange-400/50" />
      </header>

      <div className="px-4 pt-6 space-y-6">

        {/* ── MAIN FAST TIMER ───────────────────────────────────── */}
        <div 
          className={`relative overflow-hidden p-6 border transition-all duration-500 ${
            isFasting 
              ? 'border-orange-500/40 bg-orange-950/10' 
              : 'border-white/[0.06] bg-surface'
          }`}
          style={{
            boxShadow: isFasting ? '0 0 40px rgba(251,146,60,0.1), inset 0 0 20px rgba(251,146,60,0.03)' : 'none',
          }}
        >
          {isFasting && (
            <div className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(251,146,60,0.06) 0%, transparent 70%)',
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
                {isFasting && (
                  <circle
                    cx="112" cy="112" r={radius}
                    className="fill-none transition-all duration-1000 ease-linear"
                    stroke="rgba(251, 146, 60, 0.7)"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(251, 146, 60, 0.4))',
                    }}
                  />
                )}
              </svg>
              
              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isFasting ? (
                  <>
                    <Flame className="w-6 h-6 text-orange-400 mb-2 animate-pulse" />
                    <span className="text-4xl font-bold text-orange-300 tracking-tight tabular-nums font-mono"
                      style={{ textShadow: '0 0 20px rgba(251,146,60,0.5)' }}
                    >
                      {remainingMinutes > 0 ? formatDuration(remainingMinutes) : `+${formatDuration(overageMinutes)}`}
                    </span>
                    <span className="text-[7px] text-orange-400/80 font-bold tracking-[0.2em] mt-2 max-w-[140px] text-center uppercase leading-tight">
                      {remainingMinutes > 0 ? getFastPhase(elapsedMinutes) : "GOAL COMPLETE"}
                    </span>
                    <span className="text-[9px] text-orange-300/80 mt-1.5 font-bold">
                      {elapsedHours.toFixed(1)}h elapsed
                    </span>
                  </>
                ) : (
                  <>
                    <Flame className="w-8 h-8 text-text-dim/30 mb-3" />
                    <span className="text-2xl font-bold text-white/50 tracking-widest">
                      {fastStatus?.last_fast_hours 
                        ? `${fastStatus.last_fast_hours.toFixed(1)}h`
                        : '—'
                      }
                    </span>
                    <span className="text-[8px] text-text-dim tracking-[0.3em] mt-2">
                      LAST FAST SESSION
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Toggle Button */}
            <button
              onClick={handleToggleFast}
              disabled={isFastLoading}
              className={`w-full max-w-xs py-4 font-bold text-xs tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 ${
                isFasting
                  ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-orange-500/30 shadow-[0_0_15px_rgba(251,146,60,0.15)]'
                  : 'bg-orange-600 text-white hover:bg-orange-500 shadow-[0_0_20px_rgba(251,146,60,0.25)]'
              }`}
            >
              <Power className="w-4 h-4" />
              {isFasting ? 'BREAK FAST — LOG COMPLETED' : 'START FASTING WINDOW'}
            </button>
          </div>
        </div>

        {/* ── FAST PHASE INSIGHTS ───────────────────────────────── */}
        {isFasting && (
          <div className="bg-surface border border-orange-500/20 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-300 tracking-wider">
              <Award className="w-4 h-4" />
              CURRENT CELLULAR STAGE
            </div>
            <p className="text-[10px] text-white leading-relaxed">
              {elapsedHours < 12 && "Your body is burning through leftover glycogen stores. Insulin levels are dropping rapidly."}
              {elapsedHours >= 12 && elapsedHours < 14 && "Glycogen is depleted. Glucagon rises, switching your body to burn pure fat for fuel."}
              {elapsedHours >= 14 && elapsedHours < 16 && "Ketone production increases. Your brain switches to clean-burning ketones, boosting clarity."}
              {elapsedHours >= 16 && elapsedHours < 18 && "Autophagy begins! Your cells are clearing out old organelles, starting cellular cleanup."}
              {elapsedHours >= 18 && "Deep Autophagy is active. Max metabolic health, high growth hormone, and cellular regeneration are peaking."}
            </p>
          </div>
        )}

        {/* ── FAST HISTORY ───────────────────────────────────────── */}
        <div className="bg-surface border border-white/[0.06] p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] tracking-[0.3em] font-bold text-orange-300 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              LAST 7 SESSIONS
            </h3>
            <button
              onClick={() => router.push('/wellness/progress')}
              className="text-[9px] text-text-dim hover:text-orange-300 flex items-center gap-1 transition-colors"
            >
              VIEW ALL <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {fastHistory.length === 0 ? (
            <p className="text-text-dim text-[10px] tracking-widest text-center py-6">NO FAST SESSIONS LOGGED YET</p>
          ) : (
            <div className="space-y-2">
              {fastHistory.slice(0, 7).map((session: any, i: number) => {
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
                        className={`h-full transition-all duration-500 ${goalHit ? 'bg-orange-500' : 'bg-orange-500/40'}`}
                        style={{ width: `${pct}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[8px] font-mono text-white/60">{hours.toFixed(1)}h</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 flex items-center justify-center text-[10px] ${goalHit ? 'text-vm-green' : 'text-text-dim/30'}`}>
                      {goalHit ? '' : '·'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── FAST INSIGHTS ────────────────────────────────────── */}
        <div className="bg-surface border border-white/[0.06] p-4">
          <h3 className="text-[10px] tracking-[0.3em] font-bold text-orange-300 flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            FAST INTELLIGENCE
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-obsidian/50 border border-white/[0.04] p-3 text-center">
              <p className="text-lg font-bold text-orange-300 font-mono">
                {fastStatus?.last_fast_hours?.toFixed(1) || '—'}
                <span className="text-[9px] text-text-dim ml-0.5">h</span>
              </p>
              <p className="text-[7px] text-text-dim tracking-[0.3em] mt-1">LAST SESSION</p>
            </div>
            <div className="bg-obsidian/50 border border-white/[0.04] p-3 text-center">
              <p className="text-lg font-bold text-orange-300 font-mono">
                {goalHours}<span className="text-[9px] text-text-dim ml-0.5">h</span>
              </p>
              <p className="text-[7px] text-text-dim tracking-[0.3em] mt-1">FASTING GOAL</p>
            </div>
            <div className="bg-obsidian/50 border border-white/[0.04] p-3 text-center">
              <p className="text-lg font-bold text-gold font-mono">
                {fastHistory.length > 0 
                  ? (fastHistory.reduce((s, h) => s + (h.duration_hours || 0), 0) / fastHistory.length).toFixed(1)
                  : '—'
                }
                <span className="text-[9px] text-text-dim ml-0.5">h</span>
              </p>
              <p className="text-[7px] text-text-dim tracking-[0.3em] mt-1">7-DAY AVG</p>
            </div>
            <div className="bg-obsidian/50 border border-white/[0.04] p-3 text-center">
              <p className="text-lg font-bold text-vm-green font-mono">
                {fastHistory.filter(h => (h.duration_hours || 0) >= goalHours).length}
                <span className="text-[9px] text-text-dim ml-0.5">/{fastHistory.length}</span>
              </p>
              <p className="text-[7px] text-text-dim tracking-[0.3em] mt-1">GOALS HIT</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
