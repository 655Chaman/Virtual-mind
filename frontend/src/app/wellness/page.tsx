'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ReadinessModal } from '@/components/ui/ReadinessModal';
import { ScrubNumberInput } from '@/components/ui/ScrubNumberInput';
import { 
  Moon, 
  Zap, 
  Droplets, 
  ArrowLeft, 
  CheckCircle,
  TrendingUp,
  Lock,
  BatteryCharging
} from 'lucide-react';
import { DecryptedText } from '@/components/ui/DecryptedText';
import { triggerHaptic } from '@/lib/utils';
import { api } from '@/lib/api';

// --- Helper Functions ---
function fmtElapsed(minutes: number | null | undefined) {
  if (!minutes) return '0:00';
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  const s = Math.floor((minutes % 1) * 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function computeElapsedMs(startTimeISO: string | null | undefined): number {
  if (!startTimeISO) return 0;
  try {
    let normalized = startTimeISO;
    if (!normalized.endsWith('Z') && !normalized.includes('+') && !normalized.includes('-')) {
      normalized = normalized + 'Z';
    }
    const start = new Date(normalized).getTime();
    return Math.max(0, Date.now() - start);
  } catch {
    return 0;
  }
}

// --- Sleep Lock Overlay Component ---
function SleepLockOverlay({ startTime }: { startTime: string | null }) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const lockDurationMinutes = 45;
  const lockDurationMs = lockDurationMinutes * 60 * 1000;

  useEffect(() => {
    // Attempt to lock Android device
    try {
      if (typeof window !== 'undefined' && (window as any).Android) {
        if ((window as any).Android.lockDevice) {
          (window as any).Android.lockDevice(lockDurationMs);
        }
        if ((window as any).Android.startLockTask) {
          (window as any).Android.startLockTask();
        }
      }
    } catch (e) {
      console.error(e);
    }

    const interval = setInterval(() => {
      const elapsedMs = computeElapsedMs(startTime);
      const remainingMs = Math.max(0, lockDurationMs - elapsedMs);
      
      setProgress(Math.min(100, (elapsedMs / lockDurationMs) * 100));

      const h = Math.floor(remainingMs / 3600000);
      const m = Math.floor((remainingMs % 3600000) / 60000);
      const s = Math.floor((remainingMs % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, lockDurationMs]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col items-center justify-center p-6 no-select" style={{ pointerEvents: 'auto' }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(100,120,255,0.1)_0%,transparent_60%)] pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
        <Lock className="w-16 h-16 text-indigo-500 mb-6 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
        <h1 className="text-2xl font-bold font-heading tracking-[0.3em] text-indigo-400 mb-2 uppercase">PROTOCOL LOCKED</h1>
        <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase mb-12">SYSTEM REGENERATION IN PROGRESS. NO OVERRIDES PERMITTED.</p>
        
        <div className="text-6xl font-black tracking-widest font-mono text-white mb-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
          {timeLeft || '06:00:00'}
        </div>

        <div className="w-full bg-surface2 h-2 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-indigo-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.8)]" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[9px] text-indigo-400 font-mono tracking-widest uppercase">
          {Math.floor(progress)}% OPTIMIZED
        </p>

        {progress >= 100 && (
           <p className="text-[10px] text-vm-green font-mono tracking-widest mt-12 animate-pulse uppercase">
             LOCK EXPIRED. REFRESH OR WAKE.
           </p>
        )}
      </div>
    </div>
  );
}

export default function WellnessDashboard() {
  const router = useRouter();

  const [sleepStatus, setSleepStatus] = useState<any>(null);
  const [isSleepLoading, setIsSleepLoading] = useState(false);
  const [showReadinessModal, setShowReadinessModal] = useState(false);
  const [lastSleepId, setLastSleepId] = useState<number | null>(null);
  const [readinessToday, setReadinessToday] = useState<any>(null);

  const [fastStatus, setFastStatus] = useState<any>(null);
  const [isFastLoading, setIsFastLoading] = useState(false);
  const [targetFastHours, setTargetFastHours] = useState(16);
  const [showFastTargetSelector, setShowFastTargetSelector] = useState(false);

  const [hydration, setHydration] = useState<any>(null);
  const [isHydrationLoading, setIsHydrationLoading] = useState(false);
  const [customHydration, setCustomHydration] = useState('');

  // Live clock
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [sleep, fast, hyd, read] = await Promise.all([
        api.wellness.sleep.today().catch(() => null),
        api.wellness.fast.today().catch(() => null),
        api.wellness.hydration.today().catch(() => null),
        api.wellness.readiness.today().catch(() => null),
      ]);
      setSleepStatus(sleep);
      setFastStatus(fast);
      setHydration(hyd);
      setReadinessToday(read);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    // Process offline sync queue
    const syncOfflineEvents = async () => {
      try {
        const queuedSleepStop = localStorage.getItem('offline_sleep_stop');
        if (queuedSleepStop) {
          await api.wellness.sleep.stop(queuedSleepStop);
          localStorage.removeItem('offline_sleep_stop');
        }
        const queuedFastStop = localStorage.getItem('offline_fast_stop');
        if (queuedFastStop) {
          await api.wellness.fast.stop(queuedFastStop);
          localStorage.removeItem('offline_fast_stop');
        }
      } catch (e) {
        // Still offline, retry later
      }
    };
    syncOfflineEvents();
    window.addEventListener('online', syncOfflineEvents);
    return () => window.removeEventListener('online', syncOfflineEvents);
  }, []);

  // Handlers
  const handleToggleSleep = async () => {
    if (isSleepLoading) return;
    triggerHaptic('heavy');
    setIsSleepLoading(true);
    try {
      if (sleepStatus?.is_sleeping) {
        try {
          const data = await api.wellness.sleep.stop();
          if (data.sleep_id) {
            setLastSleepId(data.sleep_id);
            setShowReadinessModal(true);
          }
        } catch (offlineErr) {
          console.warn("Offline! Queuing sleep stop.");
          localStorage.setItem('offline_sleep_stop', new Date().toISOString());
          setSleepStatus({ ...sleepStatus, is_sleeping: false });
          setShowReadinessModal(true); // Still prompt locally
        }
      } else {
        await api.wellness.sleep.start();
      }
      
      // Attempt to re-fetch if online
      try {
        const updated = await api.wellness.sleep.today();
        setSleepStatus(updated);
      } catch (e) { /* keep local state */ }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSleepLoading(false);
    }
  };

  const handleStartFast = async () => {
    if (isFastLoading) return;
    triggerHaptic('medium');
    setIsFastLoading(true);
    try {
      await api.wellness.fast.start(); // Depending on backend, we could pass target_hours, but we manage visually for now
      const updated = await api.wellness.fast.today();
      setFastStatus(updated);
      setShowFastTargetSelector(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFastLoading(false);
    }
  };

  const handleStopFast = async () => {
    if (isFastLoading) return;
    triggerHaptic('medium');
    setIsFastLoading(true);
    try {
      try {
        await api.wellness.fast.stop();
      } catch (offlineErr) {
        console.warn("Offline! Queuing fast stop.");
        localStorage.setItem('offline_fast_stop', new Date().toISOString());
        setFastStatus({ ...fastStatus, is_fasting: false });
      }
      
      try {
        const updated = await api.wellness.fast.today();
        setFastStatus(updated);
      } catch (e) { /* keep local state */ }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFastLoading(false);
    }
  };

  const handleAddHydration = async (ml: number) => {
    if (isHydrationLoading) return;
    triggerHaptic('light');
    setIsHydrationLoading(true);
    try {
      await api.wellness.hydration.add(ml);
      const updated = await api.wellness.hydration.today();
      setHydration(updated);
      setCustomHydration('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsHydrationLoading(false);
    }
  };

  const isSleeping = sleepStatus?.is_sleeping;
  const isFasting = fastStatus?.is_fasting;

  // Render sleep lock if sleeping
  if (isSleeping) {
    return <SleepLockOverlay startTime={sleepStatus.sleep_start_time} />;
  }

  return (
    <div className="min-h-screen bg-obsidian text-gray-300 font-mono relative overflow-x-hidden no-select pb-24">
      <div className="scanline-overlay pointer-events-none z-50" />

      {showReadinessModal && (
        <ReadinessModal
          sleepId={lastSleepId}
          onComplete={(score) => {
            setShowReadinessModal(false);
            setReadinessToday({ logged: true, score });
          }}
          onDismiss={() => setShowReadinessModal(false)}
        />
      )}

      {/* Floating Header */}
      <header className="fixed top-safe left-0 right-0 p-6 z-40 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button
            onClick={() => { triggerHaptic(); router.push('/home'); }}
            className="w-10 h-10 rounded-full bg-surface border border-surface2 text-text-dim hover:text-vm-glacier flex items-center justify-center transition-colors shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm md:text-base font-heading text-vm-glacier tracking-[0.3em] drop-shadow-[0_0_12px_rgba(34,211,238,0.3)]">
              <DecryptedText text="RECOVERY_PROTOCOL" animateOnHover={true} />
            </h1>
          </div>
        </div>
      </header>

      {/* 1. TOP SECTION: MASSIVE INITIATION BUTTON (SLEEP) */}
      <div className="w-full flex flex-col items-center justify-center relative px-6 pt-32 pb-10 min-h-[50vh]">
        <div className="absolute inset-0 pointer-events-none transition-all duration-1000 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.05)_0%,transparent_60%)]" />
        <div className="z-10 flex flex-col items-center gap-8 w-full max-w-sm">
          <button
            onClick={() => handleToggleSleep()}
            disabled={isSleepLoading}
            className="group relative w-full max-w-[260px] aspect-square rounded-full flex flex-col items-center justify-center gap-4 transition-all duration-500 hover:scale-105"
            style={{ 
              backgroundColor: 'var(--color-obsidian)',
              borderColor: 'rgba(34,211,238,0.3)',
              borderWidth: '1px',
              borderStyle: 'solid',
              boxShadow: '0 0 30px rgba(34,211,238,0.1)'
            }}
          >
            <div className={`absolute inset-2 rounded-full border border-vm-glacier/10`} />
            <Moon className="w-20 h-20 transition-transform duration-500 group-hover:scale-110 text-vm-glacier drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
            <div className="flex flex-col items-center text-center">
              <span className="font-heading text-xl tracking-[0.3em] text-white">
                {isSleepLoading ? '...' : 'SLEEP'}
              </span>
              <p className="text-[12px] tracking-widest font-bold mt-2 text-vm-glacier">
                {sleepStatus?.last_sleep_hours ? `${sleepStatus.last_sleep_hours.toFixed(1)}h last` : 'READY'}
              </p>
            </div>
            <p className="text-[9px] text-text-dim tracking-widest absolute bottom-8 font-bold uppercase">
              CNS RECOVERY
            </p>
          </button>
        </div>
      </div>

      {/* 2. BOTTOM SECTION: MINIMALIST STACK (DEEN STYLE) + WIDGETS */}
      <div className="px-6 max-w-md mx-auto w-full space-y-6">
        
        {/* FASTING STACK ITEM WITH TARGET SELECTOR */}
        <div className="flex flex-col gap-2 relative z-10 font-mono w-full">
          <div className="flex justify-between items-end mb-1 pl-1">
            <h3 className="text-[10px] tracking-[0.3em] text-text-dim uppercase font-bold">
              METABOLIC PROTOCOL
            </h3>
            {isFasting && (
               <span className="text-[9px] text-orange-400 tracking-widest font-bold uppercase">TARGET: {targetFastHours}H</span>
            )}
          </div>

          {!isFasting && showFastTargetSelector ? (
            <div className="bg-surface/50 border border-surface2 p-5 rounded-xl space-y-4 animate-in fade-in zoom-in-95">
              <p className="text-[10px] text-text-dim tracking-widest text-center uppercase">Select Target Window</p>
              <div className="grid grid-cols-4 gap-2">
                {[12, 14, 16, 20].map(h => (
                  <button
                    key={h}
                    onClick={() => { setTargetFastHours(h); triggerHaptic('light'); }}
                    className={`py-3 text-[12px] font-bold tracking-widest rounded-md border ${targetFastHours === h ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'border-surface2 text-text-dim'}`}
                  >
                    {h}H
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowFastTargetSelector(false)} className="flex-1 py-3 text-[10px] tracking-widest border border-surface2 rounded-md text-text-dim">CANCEL</button>
                <button onClick={handleStartFast} className="flex-1 py-3 text-[10px] tracking-widest font-bold bg-orange-500/20 border border-orange-500 text-orange-400 rounded-md">START FAST</button>
              </div>
            </div>
          ) : (
            <div className={`p-5 flex flex-col w-full relative border rounded-xl overflow-hidden ${isFasting ? 'border-orange-500/40 bg-orange-500/10' : 'border-surface2 bg-surface/50'}`}>
              {isFasting && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 shadow-[0_0_15px_rgba(251,146,60,1)]" />
              )}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Zap className={`w-6 h-6 ${isFasting ? 'text-orange-400 animate-pulse' : 'text-text-dim'}`} />
                  <div className="flex flex-col text-left">
                    <span className={`text-[12px] tracking-widest uppercase font-bold ${isFasting ? 'text-orange-400' : 'text-white'}`}>
                      INTERMITTENT FAST
                    </span>
                    <span className="text-[8px] text-text-dim tracking-[0.2em] uppercase mt-1">
                      {isFasting ? 'METABOLIC AUTOPHAGY ACTIVE' : 'START TO PURIFY'}
                    </span>
                  </div>
                </div>
                {isFasting ? (
                  <button onClick={handleStopStopFastWrapper} className="text-[10px] font-bold text-orange-400 tracking-widest border border-orange-500/50 px-3 py-1.5 rounded bg-orange-500/10 active:scale-95">END</button>
                ) : (
                  <button onClick={() => setShowFastTargetSelector(true)} className="text-[10px] font-bold text-white tracking-widest border border-surface2 px-3 py-1.5 rounded hover:bg-surface active:scale-95">START</button>
                )}
              </div>

              {/* Progress bar if fasting */}
              {isFasting && (
                <div className="w-full">
                   <div className="flex justify-between text-[10px] font-mono font-bold tracking-widest mb-2">
                     <span className="text-orange-300">{fmtElapsed(computeElapsedMs(fastStatus.fast_start_time)/60000)}</span>
                     <span className="text-text-dim">{targetFastHours}H TARGET</span>
                   </div>
                   <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-orange-500 transition-all duration-1000 shadow-[0_0_10px_rgba(251,146,60,0.8)]"
                       style={{ width: `${Math.min(100, (computeElapsedMs(fastStatus.fast_start_time) / (targetFastHours * 3600000)) * 100)}%` }}
                     />
                   </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* HYDRATION WIDGET WITH ELECTROLYTES */}
        <div className="flex flex-col gap-2 relative z-10 font-mono w-full">
          <h3 className="text-[10px] tracking-[0.3em] text-text-dim uppercase font-bold mb-1 pl-1">
            HYDRATION SYSTEM
          </h3>
          <div className="bg-surface border border-surface2 p-5 rounded-xl space-y-4 shadow-lg relative overflow-hidden">
            {/* Wave Background Animation */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
              <div className="absolute bottom-0 left-0 right-0 bg-blue-500 transition-all duration-1000 ease-in-out" style={{ height: `${Math.min(100, hydration?.percent ?? 0)}%` }} />
            </div>

            {(hydration?.percent ?? 0) >= 100 && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-vm-green shadow-[0_0_15px_#10D86A]" />
            )}
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <Droplets className={`w-5 h-5 ${(hydration?.percent ?? 0) >= 100 ? 'text-vm-green' : 'text-blue-400'}`} />
                <span className="text-[12px] tracking-[0.2em] font-bold text-white uppercase">INTRACELLULAR FLUID</span>
              </div>
              <span className={`text-lg font-bold tracking-widest ${(hydration?.percent ?? 0) >= 100 ? 'text-vm-green' : 'text-blue-400'}`}>
                {hydration?.today_L ?? 0}L
              </span>
            </div>

            <div className="w-full bg-obsidian border border-surface2 h-2 rounded-full overflow-hidden relative z-10">
              <div
                className={`h-full transition-all duration-1000 ease-out ${(hydration?.percent ?? 0) >= 100 ? 'bg-vm-green' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, hydration?.percent ?? 0)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 relative z-10">
              <button
                onClick={() => handleAddHydration(500)}
                disabled={isHydrationLoading}
                className="py-3 flex flex-col items-center justify-center bg-blue-500/5 border border-blue-500/20 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-all active:scale-95"
              >
                <span className="text-[12px] font-bold tracking-widest">+ 0.5L</span>
                <span className="text-[8px] text-blue-400/60 tracking-widest uppercase mt-1">PURE WATER</span>
              </button>
              <button
                onClick={() => handleAddHydration(500)} // We can visually mark it as electrolytes, logging is same to backend
                disabled={isHydrationLoading}
                className="py-3 flex flex-col items-center justify-center bg-purple-500/5 border border-purple-500/20 rounded-lg text-purple-400 hover:bg-purple-500/20 transition-all active:scale-95"
              >
                <span className="text-[12px] font-bold tracking-widest">+ 0.5L</span>
                <span className="text-[8px] text-purple-400/60 tracking-widest uppercase mt-1">ELECTROLYTES</span>
              </button>
            </div>
            
            <div className="flex gap-2 mt-4 relative z-10">
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="CUSTOM (L)"
                value={customHydration}
                onChange={(e) => setCustomHydration(e.target.value)}
                className="flex-1 bg-surface border border-surface2 rounded-lg p-3 text-xs text-white font-mono focus:outline-none focus:border-blue-500/50"
              />
              <button
                onClick={() => {
                  const val = parseFloat(customHydration);
                  if (!isNaN(val) && val > 0) {
                    handleAddHydration(val * 1000);
                  }
                }}
                disabled={isHydrationLoading || !customHydration}
                className="bg-blue-500 text-obsidian font-bold px-8 rounded-lg text-[10px] tracking-[0.2em] hover:bg-blue-400 disabled:opacity-40 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>

        {/* TELEMETRY WIDGET - ONLY PROGRESS NOW */}
        <div className="w-full mt-6">
          <button
            onClick={() => { triggerHaptic(); router.push('/wellness/progress'); }}
            className="w-full bg-surface border border-surface2 hover:border-vm-glacier/40 p-5 rounded-xl flex items-center justify-between transition-all hover:bg-vm-glacier/5 shadow-lg group"
          >
            <div className="flex items-center gap-4">
               <TrendingUp className="w-6 h-6 text-vm-glacier group-hover:scale-110 transition-transform" />
               <div className="flex flex-col text-left">
                 <span className="text-[11px] font-bold text-vm-glacier tracking-[0.15em] uppercase">
                   RECOVERY ANALYSIS
                 </span>
                 <p className="text-[8px] text-text-dim tracking-[0.2em] uppercase font-mono">
                   LONG-TERM TRENDS
                 </p>
               </div>
            </div>
            <div className="w-8 h-8 rounded-full border border-surface2 flex items-center justify-center text-[10px] font-mono group-hover:border-vm-glacier/40">
              {'>>'}
            </div>
          </button>
        </div>

        {/* READINESS DISPLAY */}
        {readinessToday?.logged && (
          <div className="w-full mt-4 bg-surface border border-vm-glacier/30 p-5 rounded-xl flex items-center justify-between shadow-[0_0_20px_rgba(34,211,238,0.1)] relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-vm-glacier/10 to-transparent pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <CheckCircle className="w-6 h-6 text-vm-glacier" />
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold text-white tracking-[0.15em] uppercase">
                  MORNING READINESS
                </span>
                <span className="text-[9px] text-text-dim tracking-widest uppercase font-mono">
                  CNS & RECOVERY SCORE
                </span>
              </div>
            </div>
            <div className="text-right relative z-10">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-vm-glacier drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">
                  {readinessToday.score}
                </span>
                <span className="text-text-dim text-xs">/10</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function handleStopStopFastWrapper() {
    handleStopFast();
  }
}
