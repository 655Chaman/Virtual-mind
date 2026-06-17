'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Timer, Brain, Clock, TrendingUp, Power, ChevronRight, Play, Square, Tag } from 'lucide-react';
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

export default function DeepWorkControlCenter() {
  const router = useRouter();
  const [dwStatus, setDwStatus] = useState<any>(null);
  const [dwHistory, setDwHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDwLoading, setIsDwLoading] = useState(false);
  const [sessionLabel, setSessionLabel] = useState('');
  const [showFrictionModal, setShowFrictionModal] = useState(false);
  const [journalEntry, setJournalEntry] = useState('');
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
        api.wellness.deepwork.today().catch(() => null),
        api.wellness.deepwork.history(7).catch(() => []),
      ]);
      setDwStatus(status);
      setDwHistory(Array.isArray(history) ? history : []);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggleDeepwork = async () => {
    if (isDwLoading) return;
    triggerHaptic('heavy');
    setIsDwLoading(true);
    try {
      if (dwStatus?.is_active) {
        await api.wellness.deepwork.stop(sessionLabel);
        setSessionLabel('');
      } else {
        setShowFrictionModal(true);
        setIsDwLoading(false);
        return; // Wait for modal submission
      }
      const updated = await api.wellness.deepwork.today();
      setDwStatus(updated);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDwLoading(false);
    }
  };

  const handleStartDeepWorkWithJournal = async () => {
    // Basic validation: Check if there's enough length (~3 short sentences)
    if (journalEntry.trim().length < 50) {
      alert("Go deeper. Write at least 3 sentences about what you're feeling right now.");
      return;
    }
    setIsDwLoading(true);
    try {
      await api.wellness.deepwork.start(journalEntry);
      setShowFrictionModal(false);
      setJournalEntry('');
      const updated = await api.wellness.deepwork.today();
      setDwStatus(updated);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDwLoading(false);
    }
  };

  const isActive = dwStatus?.is_active;
  const elapsedMinutes = isActive ? computeElapsedMin(dwStatus?.session_start) : 0;
  const elapsedHours = elapsedMinutes / 60;
  
  // Daily total is completed minutes today + active elapsed minutes
  const totalMinutesToday = (dwStatus?.total_minutes_today || 0) + (isActive ? elapsedMinutes : 0);
  const totalHoursToday = totalMinutesToday / 60;
  const goalHours = 4;
  const progressPct = Math.min(100, (totalHoursToday / goalHours) * 100);

  // SVG Circular Progress
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center font-mono gap-6">
        <div className="scanline-overlay" />
        <div className="w-16 h-16 border border-vm-green/20 border-t-vm-green/80 rounded-full animate-spin" />
        <p className="text-text-dim text-xs tracking-[0.4em] animate-pulse">INIT FLOW STATE ENGINE...</p>
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
          className="p-2 -ml-2 text-text-dim hover:text-vm-green transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-vm-green font-mono font-bold tracking-[0.3em] text-base"> FLOW STATE</h1>
          <p className="text-[9px] text-text-dim tracking-widest mt-0.5">FOCUS · PRODUCTIVITY · EMPIRE</p>
        </div>
        <Timer className="w-4 h-4 text-vm-green/50" />
      </header>

      <div className="px-4 pt-6 space-y-6">

        {/* ── MAIN DEEP WORK TIMER ───────────────────────────────── */}
        <div 
          className={`relative overflow-hidden p-6 border transition-all duration-500 ${
            isActive 
              ? 'border-vm-green/40 bg-vm-green/5' 
              : 'border-white/[0.06] bg-surface'
          }`}
          style={{
            boxShadow: isActive ? '0 0 40px rgba(76,170,110,0.1), inset 0 0 20px rgba(76,170,110,0.03)' : 'none',
          }}
        >
          {isActive && (
            <div className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(76,170,110,0.06) 0%, transparent 70%)',
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
                {/* Progress circle representing today's cumulative progress towards 4h goal */}
                <circle
                  cx="112" cy="112" r={radius}
                  className="fill-none transition-all duration-1000 ease-linear"
                  stroke={progressPct >= 100 ? "rgba(201, 168, 76, 0.8)" : "rgba(76, 170, 110, 0.7)"}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    filter: `drop-shadow(0 0 8px ${progressPct >= 100 ? 'rgba(201, 168, 76, 0.4)' : 'rgba(76, 170, 110, 0.4)'})`,
                  }}
                />
              </svg>
              
              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isActive ? (
                  <>
                    <Brain className="w-6 h-6 text-vm-green mb-2 animate-pulse" />
                    <span className="text-4xl font-bold text-vm-green tracking-tight tabular-nums font-mono"
                      style={{ textShadow: '0 0 20px rgba(76,170,110,0.5)' }}
                    >
                      {formatDuration(elapsedMinutes)}
                    </span>
                    <span className="text-[8px] text-vm-green/60 tracking-[0.3em] mt-2 uppercase font-bold">
                      FLOW STATE ACTIVE
                    </span>
                    <span className="text-[9px] text-gold mt-1.5 font-bold">
                      TODAY: {totalHoursToday.toFixed(1)}h / {goalHours}h
                    </span>
                  </>
                ) : (
                  <>
                    <Brain className="w-8 h-8 text-text-dim/30 mb-3" />
                    <span className="text-2xl font-bold text-white/50 tracking-widest">
                      {dwStatus?.total_hours_today ? `${dwStatus.total_hours_today.toFixed(1)}h` : '0.0h'}
                    </span>
                    <span className="text-[8px] text-text-dim tracking-[0.3em] mt-2">
                      COMPLETED TODAY
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Session Labelling */}
            {isActive && (
              <div className="w-full max-w-xs mb-4 flex items-center bg-black/40 border border-vm-green/30 p-2 gap-2">
                <Tag className="w-4 h-4 text-vm-green shrink-0" />
                <input
                  type="text"
                  placeholder="Task tag (e.g. Coding, Sales)"
                  value={sessionLabel}
                  onChange={(e) => setSessionLabel(e.target.value)}
                  className="bg-transparent border-0 text-xs text-white placeholder-text-dim focus:outline-none w-full font-mono"
                />
              </div>
            )}

            {/* Toggle Button */}
            <button
              onClick={handleToggleDeepwork}
              disabled={isDwLoading}
              className={`w-full max-w-xs py-4 font-bold text-xs tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 ${
                isActive
                  ? 'bg-vm-green/20 border border-vm-green/40 text-vm-green hover:bg-vm-green/30 shadow-[0_0_15px_rgba(76,170,110,0.15)]'
                  : 'bg-vm-green text-black hover:bg-vm-green/90 shadow-[0_0_20px_rgba(76,170,110,0.25)] font-bold'
              }`}
            >
              {isActive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              {isActive ? 'STOP SESSION — SAVE' : 'START FLOW'}
            </button>
          </div>
        </div>

        {/* ── DAILY SUMMARY & TARGETS ───────────────────────────── */}
        <div className="bg-surface border border-white/[0.06] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-vm-green/20 bg-vm-green/5 flex items-center justify-center text-lg"></div>
            <div>
              <p className="text-[10px] text-text-dim tracking-widest font-bold">DAILY FLOW STATUS</p>
              <p className="text-xs font-bold text-white mt-0.5">
                {totalHoursToday >= goalHours ? '4HR FOCUS TARGET ACHIEVED!' : `Focus goal remaining: ${Math.max(0, goalHours - totalHoursToday).toFixed(1)}h`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[8px] text-text-dim tracking-widest">SESSIONS</p>
            <p className="text-lg font-bold text-vm-green">{dwStatus?.sessions_today ?? 0}</p>
          </div>
        </div>

        {/* ── DEEP WORK HISTORY ──────────────────────────────────── */}
        <div className="bg-surface border border-white/[0.06] p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] tracking-[0.3em] font-bold text-vm-green flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              LAST 7 DAYS HISTORY
            </h3>
            <button
              onClick={() => router.push('/wellness/progress')}
              className="text-[9px] text-text-dim hover:text-vm-green flex items-center gap-1 transition-colors"
            >
              VIEW ALL <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {dwHistory.length === 0 ? (
            <p className="text-text-dim text-[10px] tracking-widest text-center py-6">NO DEEP WORK LOGGED YET</p>
          ) : (
            <div className="space-y-2">
              {dwHistory.slice(0, 7).map((session: any, i: number) => {
                const hours = session.total_hours || 0;
                const goalHit = hours >= goalHours;
                const pct = Math.min(100, (hours / goalHours) * 100);
                const startDate = new Date(session.date);
                
                return (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.03] last:border-0">
                    <div className="w-16 text-[9px] text-text-dim font-mono shrink-0">
                      {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1 bg-obsidian border border-white/[0.04] h-5 relative overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${goalHit ? 'bg-vm-green' : 'bg-vm-green/40'}`}
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

        {/* ── FOCUS INTELLIGENCE ────────────────────────────────── */}
        <div className="bg-surface border border-white/[0.06] p-4">
          <h3 className="text-[10px] tracking-[0.3em] font-bold text-vm-green flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            FLOW STATE INTELLIGENCE
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-obsidian/50 border border-white/[0.04] p-3 text-center">
              <p className="text-lg font-bold text-vm-green font-mono">
                {dwStatus?.total_hours_today?.toFixed(1) || '0.0'}
                <span className="text-[9px] text-text-dim ml-0.5">h</span>
              </p>
              <p className="text-[7px] text-text-dim tracking-[0.3em] mt-1">COMPLETED TODAY</p>
            </div>
            <div className="bg-obsidian/50 border border-white/[0.04] p-3 text-center">
              <p className="text-lg font-bold text-vm-green font-mono">
                {goalHours}<span className="text-[9px] text-text-dim ml-0.5">h</span>
              </p>
              <p className="text-[7px] text-text-dim tracking-[0.3em] mt-1">DAILY TARGET</p>
            </div>
            <div className="bg-obsidian/50 border border-white/[0.04] p-3 text-center">
              <p className="text-lg font-bold text-gold font-mono">
                {dwHistory.length > 0 
                  ? (dwHistory.reduce((s, h) => s + (h.total_hours || 0), 0) / dwHistory.length).toFixed(1)
                  : '—'
                }
                <span className="text-[9px] text-text-dim ml-0.5">h</span>
              </p>
              <p className="text-[7px] text-text-dim tracking-[0.3em] mt-1">7-DAY AVG</p>
            </div>
            <div className="bg-obsidian/50 border border-white/[0.04] p-3 text-center">
              <p className="text-lg font-bold text-vm-green font-mono">
                {dwHistory.filter(h => (h.total_hours || 0) >= goalHours).length}
                <span className="text-[9px] text-text-dim ml-0.5">/{dwHistory.length}</span>
              </p>
              <p className="text-[7px] text-text-dim tracking-[0.3em] mt-1">DAILY GOALS HIT</p>
            </div>
          </div>
        </div>

      </div>

      {/* Friction Journal Modal */}
      {showFrictionModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md border border-vm-green/30 bg-obsidian p-6 shadow-[0_0_40px_rgba(76,170,110,0.1)]">
            <h2 className="text-vm-green font-bold tracking-widest mb-2 text-center flex items-center justify-center gap-2">
              <Brain className="w-5 h-5 animate-pulse" />
              FRICTION JOURNAL
            </h2>
            <p className="text-text-dim text-[10px] tracking-widest mb-6 text-center uppercase">
              Before you escape into work, what are you feeling? <br/>
              Sit with the stillness. Minimum 3 sentences.
            </p>
            
            <textarea
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              placeholder="I am feeling..."
              className="w-full h-32 bg-black/50 border border-white/10 text-xs p-3 text-white placeholder-text-dim focus:outline-none focus:border-vm-green/50 font-mono mb-4 resize-none"
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowFrictionModal(false)}
                className="flex-1 py-3 bg-red-500/10 border border-red-500/40 text-red-500 text-[10px] tracking-[0.2em] font-bold hover:bg-red-500/20"
              >
                CANCEL
              </button>
              <button
                onClick={handleStartDeepWorkWithJournal}
                className="flex-1 py-3 bg-vm-green/20 border border-vm-green/40 text-vm-green text-[10px] tracking-[0.2em] font-bold hover:bg-vm-green/30 disabled:opacity-50"
              >
                ENTER FLOW STATE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
