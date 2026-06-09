'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ElectricBorder } from '@/components/ui/ElectricBorder';
import { ReadinessModal } from '@/components/ui/ReadinessModal';
import { ScrubNumberInput } from '@/components/ui/ScrubNumberInput';
import { Moon, Zap, Droplets, Timer, ArrowLeft, Activity } from 'lucide-react';
import { triggerHaptic } from '@/lib/utils';
import { api } from '@/lib/api';

function fmtElapsed(minutes: number | null | undefined) {
  if (!minutes) return '0:00';
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  const s = Math.floor((minutes % 1) * 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Compute elapsed minutes from an ISO start_time string (client-side, second-accurate) */
function computeElapsed(startTimeISO: string | null | undefined): number | null {
  if (!startTimeISO) return null;
  try {
    let normalized = startTimeISO;
    if (!normalized.endsWith('Z') && !normalized.includes('+') && !normalized.includes('-')) {
      normalized = normalized + 'Z';
    }
    const start = new Date(normalized).getTime();
    return (Date.now() - start) / 60000;
  } catch {
    return null;
  }
}

export default function WellnessPage() {
  const router = useRouter();

  const [sleepStatus, setSleepStatus] = useState<any>(null);
  const [isSleepLoading, setIsSleepLoading] = useState(false);
  const [showReadinessModal, setShowReadinessModal] = useState(false);
  const [lastSleepId, setLastSleepId] = useState<number | null>(null);
  const [readinessToday, setReadinessToday] = useState<any>(null);

  const [fastStatus, setFastStatus] = useState<any>(null);
  const [isFastLoading, setIsFastLoading] = useState(false);

  const [hydration, setHydration] = useState<any>(null);
  const [isHydrationLoading, setIsHydrationLoading] = useState(false);
  const [customHydration, setCustomHydration] = useState('');

  // Live clock for elapsed timers
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

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleToggleSleep = async () => {
    if (isSleepLoading) return;
    triggerHaptic('heavy');
    setIsSleepLoading(true);
    try {
      if (sleepStatus?.is_sleeping) {
        const data = await api.wellness.sleep.stop();
        if (data.sleep_id) {
          setLastSleepId(data.sleep_id);
          setShowReadinessModal(true);
        }
      } else {
        await api.wellness.sleep.start();
      }
      const updated = await api.wellness.sleep.today();
      setSleepStatus(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSleepLoading(false);
    }
  };

  const handleToggleFast = async () => {
    if (isFastLoading) return;
    triggerHaptic('medium');
    setIsFastLoading(true);
    try {
      if (fastStatus?.is_fasting) {
        await api.wellness.fast.stop();
      } else {
        await api.wellness.fast.start();
      }
      const updated = await api.wellness.fast.today();
      setFastStatus(updated);
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
      // Fetch the full status again to get percent and other fields properly instead of just the add response
      const updated = await api.wellness.hydration.today();
      setHydration(updated);
      setCustomHydration(''); // clear custom input on success
    } catch (err) {
      console.error(err);
    } finally {
      setIsHydrationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-gray-300 font-mono relative pb-10 overflow-x-hidden">
      <div className="scanline-overlay" />

      {/* Readiness modal */}
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

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-obsidian/95 backdrop-blur-sm border-b border-white/[0.04] px-4 py-4 pt-safe flex items-center gap-3">
        <button
          id="wellness-back-btn"
          onClick={() => { triggerHaptic('light'); router.push('/home'); }}
          className="p-2 -ml-2 text-text-dim hover:text-vm-glacier transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-vm-glacier font-mono font-bold tracking-[0.3em] text-base">💤 WELLNESS</h1>
          <p className="text-[9px] text-text-dim tracking-widest mt-0.5">RECOVERY · BODY · PERFORMANCE</p>
        </div>
        <Activity className="w-4 h-4 text-text-dim/50" />
      </header>

      <div className="px-4 pt-8 space-y-4">

        {/* ── PROGRESS NAVIGATION (ON TOP) ─────────────────────────────────── */}
        <div className="pb-2">
          <button
            onClick={() => { triggerHaptic('light'); router.push('/wellness/progress'); }}
            className="w-full bg-surface border border-vm-glacier/20 p-5 text-left transition-all hover:border-vm-glacier/40 hover:bg-vm-glacier/5 active:scale-[0.98] group flex items-center justify-between"
          >
            <div>
              <p className="text-[10px] font-bold text-vm-glacier tracking-[0.3em]">📊 WELLNESS PROGRESS DASHBOARD</p>
              <p className="text-[8px] text-text-dim tracking-widest mt-1">7D · 14D · 30D · 3M · 6M · 1Y DETAILED ANALYTICS</p>
            </div>
            <Activity className="w-5 h-5 text-vm-glacier group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] transition-all" />
          </button>
        </div>

        {/* ── SLEEP ──────────────────────────────────────────────────────── */}
        <ElectricBorder color={sleepStatus?.is_sleeping ? 'rgba(100,120,255,0.5)' : 'rgba(34,211,238,0.3)'}>
          <div
            className="w-full bg-surface p-5 flex items-center justify-between gap-4 relative overflow-hidden transition-colors hover:bg-surface2/[0.7]"
          >
            <div className="absolute inset-0 pointer-events-none"
              style={{
                background: sleepStatus?.is_sleeping
                  ? 'radial-gradient(ellipse at left center, rgba(100,120,255,0.08) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse at left center, rgba(34,211,238,0.04) 0%, transparent 70%)',
              }}
            />
            {/* Left side: details (clickable to view history) */}
            <div 
              onClick={() => { triggerHaptic('light'); router.push('/wellness/sleep'); }}
              className="flex-1 flex items-center gap-4 cursor-pointer z-10"
            >
              <Moon
                className={`w-8 h-8 shrink-0 ${sleepStatus?.is_sleeping ? 'text-indigo-400 animate-pulse' : 'text-vm-glacier/50'}`}
              />
              <div>
                <p className={`text-[10px] tracking-[0.4em] font-bold mb-1 ${sleepStatus?.is_sleeping ? 'text-indigo-300' : 'text-text-dim'}`}>
                  {sleepStatus?.is_sleeping ? 'DEEP SLEEP ACTIVE' : 'SLEEP SYSTEM'}
                </p>
                <p className={`text-2xl font-bold tracking-widest ${sleepStatus?.is_sleeping ? 'text-indigo-300 drop-shadow-[0_0_10px_rgba(100,120,255,0.7)]' : 'text-white'}`}>
                  {sleepStatus?.is_sleeping
                    ? fmtElapsed(computeElapsed(sleepStatus.sleep_start_time) ?? sleepStatus.elapsed_minutes)
                    : (sleepStatus?.last_sleep_hours ? `${sleepStatus.last_sleep_hours.toFixed(1)}h last` : '—')}
                </p>
                <p className="text-[9px] text-text-dim tracking-widest mt-0.5">
                  TAP TO VIEW HISTORY
                </p>
              </div>
            </div>

            {/* Right side: direct toggle button */}
            <div className="z-10 flex flex-col items-end gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleSleep(); }}
                disabled={isSleepLoading}
                className={`px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase border transition-all duration-200 active:scale-95 disabled:opacity-40 rounded-sm ${
                  sleepStatus?.is_sleeping
                    ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 hover:bg-indigo-600/30 hover:border-indigo-400 drop-shadow-[0_0_10px_rgba(100,120,255,0.25)]'
                    : 'bg-vm-glacier/10 border-vm-glacier/40 text-vm-glacier hover:bg-vm-glacier/20 hover:border-vm-glacier/60'
                }`}
              >
                {isSleepLoading ? '...' : (sleepStatus?.is_sleeping ? 'WAKE UP' : 'START SLEEP')}
              </button>
              {readinessToday?.logged && (
                <div className="text-right mt-1">
                  <p className="text-[8px] text-text-dim tracking-widest">READINESS</p>
                  <p className="text-sm font-bold text-vm-glacier">{readinessToday.score}<span className="text-[10px]">/10</span></p>
                </div>
              )}
            </div>
          </div>
        </ElectricBorder>

        {/* ── FASTING ────────────────────────────────────────────────────── */}
        <ElectricBorder color={fastStatus?.is_fasting ? 'rgba(251,146,60,0.5)' : 'rgba(34,211,238,0.25)'}>
          <div
            className="w-full bg-surface p-5 flex items-center justify-between gap-4 relative overflow-hidden transition-colors hover:bg-surface2/[0.7]"
          >
            <div className="absolute inset-0 pointer-events-none"
              style={{
                background: fastStatus?.is_fasting
                  ? 'radial-gradient(ellipse at left center, rgba(251,146,60,0.08) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse at left center, rgba(34,211,238,0.03) 0%, transparent 70%)',
              }}
            />
            {/* Left side: click to details */}
            <div
              onClick={() => { triggerHaptic('light'); router.push('/wellness/fast'); }}
              className="flex-1 flex items-center gap-4 cursor-pointer z-10"
            >
              <Zap
                className={`w-8 h-8 shrink-0 ${fastStatus?.is_fasting ? 'text-orange-400 animate-pulse' : 'text-vm-glacier/50'}`}
              />
              <div>
                <p className={`text-[10px] tracking-[0.4em] font-bold mb-1 ${fastStatus?.is_fasting ? 'text-orange-300' : 'text-text-dim'}`}>
                  {fastStatus?.is_fasting ? 'FASTING ACTIVE' : 'INTERMITTENT FAST'}
                </p>
                <p className={`text-2xl font-bold tracking-widest ${fastStatus?.is_fasting ? 'text-orange-300 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]' : 'text-white'}`}>
                  {fastStatus?.is_fasting
                    ? fmtElapsed(computeElapsed(fastStatus.fast_start_time) ?? fastStatus.elapsed_minutes)
                    : (fastStatus?.last_fast_hours ? `${fastStatus.last_fast_hours.toFixed(1)}h last` : '—')}
                </p>
                <p className="text-[9px] text-text-dim tracking-widest mt-0.5">
                  TAP TO VIEW HISTORY
                </p>
              </div>
            </div>

            {/* Right side: direct toggle button */}
            <div className="z-10 flex flex-col items-end gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleFast(); }}
                disabled={isFastLoading}
                className={`px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase border transition-all duration-200 active:scale-95 disabled:opacity-40 rounded-sm ${
                  fastStatus?.is_fasting
                    ? 'bg-orange-950/40 border-orange-500/50 text-orange-300 hover:bg-orange-600/30 hover:border-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.25)]'
                    : 'bg-vm-glacier/10 border-vm-glacier/40 text-vm-glacier hover:bg-vm-glacier/20 hover:border-vm-glacier/60'
                }`}
              >
                {isFastLoading ? '...' : (fastStatus?.is_fasting ? 'END FAST' : 'START FAST')}
              </button>
            </div>
          </div>
        </ElectricBorder>

        {/* ── HYDRATION ──────────────────────────────────────────────────── */}
        <div className="bg-surface border border-white/[0.06] p-5 space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className={`w-5 h-5 ${(hydration?.percent ?? 0) >= 100 ? 'text-vm-glacier' : 'text-blue-400'}`} />
              <span className="text-[10px] tracking-[0.4em] font-bold text-text-dim">HYDRATION</span>
            </div>
            <span className={`text-sm font-bold ${(hydration?.percent ?? 0) >= 100 ? 'text-vm-glacier' : 'text-blue-300'}`}>
              {hydration?.today_L ?? 0}L / {hydration?.goal_L ?? 3}L
            </span>
          </div>

          {/* Big progress bar */}
          <div className="w-full bg-obsidian border border-white/[0.06] h-3 relative overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${(hydration?.percent ?? 0) >= 100 ? 'bg-vm-green' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, hydration?.percent ?? 0)}%` }}
            />
            {/* Percentage label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[8px] font-mono tracking-widest text-white/40">
                {Math.round(hydration?.percent ?? 0)}%
              </span>
            </div>
          </div>

          {/* Quick tap buttons */}
          <div className="grid grid-cols-2 gap-2">
            {[500, 1000].map(ml => (
              <button
                key={ml}
                id={`wellness-hydration-${ml}`}
                onClick={() => handleAddHydration(ml)}
                disabled={isHydrationLoading}
                className="py-3 border border-blue-500/30 text-blue-300 text-[12px] tracking-widest hover:bg-blue-500/10 active:bg-blue-500/20 transition-colors disabled:opacity-40 font-mono"
              >
                +{ml / 1000}L
              </button>
            ))}
          </div>

          {/* Custom entry */}
          <div className="flex gap-2">
            <ScrubNumberInput
              step={0.1}
              min={0}
              sensitivity={15}
              placeholder="Custom e.g. 1.5"
              value={customHydration === '' ? '' : Number(customHydration)}
              onChangeValue={(val) => setCustomHydration(val.toString())}
              className="flex-1 bg-black/40 border border-white/10 p-3 text-sm text-white font-mono focus:outline-none focus:border-blue-500/50"
            />
            <button
              onClick={() => {
                const val = parseFloat(customHydration);
                if (!isNaN(val) && val > 0) {
                  handleAddHydration(val * 1000);
                }
              }}
              disabled={isHydrationLoading || !customHydration}
              className="bg-blue-600/20 border border-blue-500/30 text-blue-300 px-6 font-mono text-[10px] tracking-widest hover:bg-blue-600/40 disabled:opacity-40 transition-colors"
            >
              LOG (L)
            </button>
          </div>
        </div>

        {/* ── READINESS SUMMARY ─────────────────────────────────────────── */}
        {readinessToday?.logged && (
          <div className="bg-surface border border-vm-glacier/20 p-4 flex items-center gap-4">
            <div className="text-3xl">🌅</div>
            <div className="flex-1">
              <p className="text-[10px] text-text-dim tracking-[0.4em] font-bold">MORNING READINESS</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold text-vm-glacier">{readinessToday.score}</span>
                <span className="text-text-dim text-sm">/10</span>
              </div>
            </div>
            <div className="text-[9px] text-text-dim tracking-widest text-right">
              LOGGED<br />TODAY
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
