'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LogBanner } from '@/components/ui/LogBanner';
import { PhaseCountdown } from '@/components/ui/PhaseCountdown';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { WeeklyMirror } from '@/components/ui/WeeklyMirror';
import { XPBar } from '@/components/ui/XPBar';
import { AOSProtocolPanel } from '@/components/ui/AOSProtocolPanel';
import { XPHistoryChart } from '@/components/ui/XPHistoryChart';
import { ElesiumPanel } from '@/components/ui/ElesiumPanel';
import { ProtocolStatusGrid } from '@/components/ui/ProtocolStatusGrid';
import { DecryptedText } from '@/components/ui/DecryptedText';
import { GlitchText } from '@/components/ui/GlitchText';
import { ElectricBorder } from '@/components/ui/ElectricBorder';
import { NonNegCheck } from '@/components/ui/NonNegCheck';
import { PillarHistoryChart } from '@/components/ui/PillarHistoryChart';
import { PushNotificationToggle } from '@/components/ui/PushNotificationToggle';
import { ReadinessModal } from '@/components/ui/ReadinessModal';
import { 
  Brain, 
  Terminal, 
  Zap, 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  Dumbbell, 
  Send, 
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Activity,
  Moon,
  Timer,
  ArrowLeft
} from 'lucide-react';
import { api, getLocalDateString } from '@/lib/api';
import { triggerHaptic } from '@/lib/utils';

const CLASSIC_NNS = [
  { key: 'salah_5', label: '5 Salah On Time', icon: '🕌' },
  { key: 'quran_30min', label: '30 Min Quran', icon: '📖' },
  { key: 'deep_work_4hr', label: '4 Hours Deep Work', icon: '🎯' },
  { key: 'physical_training', label: 'Physical Training (1hr)', icon: '⚔️' },
  { key: 'reading_1hr', label: '1 Hour Reading Before Bed', icon: '📚' },
  { key: 'adhkar', label: 'Adhkar Morning & Evening', icon: '☀️' },
  { key: 'no_phone_before_8', label: 'No Phone Before 8 AM', icon: '📵' },
  { key: 'no_sugar', label: 'No Sugar (Weekday)', icon: '🚫' },
];

const AOS_HABITS = [
  { key: 'ice_bath', label: 'Ice Bath (F.M.S.)', icon: '❄️' },
  { key: 'cold_shower', label: 'Cold Shower (NEURO)', icon: '🚿' },
  { key: 'microbursts', label: 'Combat Microbursts (F.M.S.)', icon: '💥' },
  { key: 'combat_training', label: 'Combat Training (OCI)', icon: '🥋' },
  { key: 'memorization_session', label: 'Memorization Session (MSL)', icon: '🧠' },
  { key: 'app_lock_on', label: 'App Lock ON (DAM)', icon: '🔒' },
  { key: 'sleep_on_floor', label: 'Slept on Floor (DAM)', icon: '🪵' },
  { key: 'fajr_without_alarm', label: 'Fajr No Alarm (NEURO)', icon: '🌅' },
];

const PILLAR_META: Record<string, { color: string; icon: string; label: string }> = {
  DEEN:      { color: 'text-gold border-gold/40 hover:bg-gold/10',        icon: '🕌', label: 'Deen' },
  ELESIUM:   { color: 'text-vm-blue border-vm-blue/40 hover:bg-vm-blue/10', icon: '⚡', label: 'Elesium' },
  INFLUENCE: { color: 'text-purple-400 border-purple-500/40 hover:bg-purple-500/10', icon: '🎯', label: 'Influence' },
  SELF:      { color: 'text-vm-green border-vm-green/40 hover:bg-vm-green/10', icon: '🧠', label: 'Self' },
};

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8001`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
};
const API_BASE = getApiBase();

export default function CommandCenter() {
  const router = useRouter();
  
  // States
  const [data, setData] = useState<any>(null);
  const [aosData, setAosData] = useState<any>(null);
  const [xpData, setXpData] = useState<any>(null);
  const [xpHistory, setXpHistory] = useState<any[]>([]);
  const [penaltyData, setPenaltyData] = useState<any>(null);
  const [perkData, setPerkData] = useState<any>(null);
  const [elesiumData, setElesiumData] = useState<any>(null);
  const [workoutToday, setWorkoutToday] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // Wellness tracking
  const [sleepStatus, setSleepStatus] = useState<any>(null);
  const [isSleepActionLoading, setIsSleepActionLoading] = useState(false);
  const [showReadinessModal, setShowReadinessModal] = useState(false);
  const [lastSleepId, setLastSleepId] = useState<number | null>(null);
  const [readinessToday, setReadinessToday] = useState<any>(null);
  // Fasting
  const [fastStatus, setFastStatus] = useState<any>(null);
  const [isFastActionLoading, setIsFastActionLoading] = useState(false);
  // Deep work
  const [deepwork, setDeepwork] = useState<any>(null);
  const [isDeepworkActionLoading, setIsDeepworkActionLoading] = useState(false);
  // Live timer refs
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  // Redesign linear flow additions
  const [todayLog, setTodayLog] = useState<any>(null);
  const [nns, setNns] = useState<Record<string, boolean>>({});
  const [thoughtInput, setThoughtInput] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureResponse, setCaptureResponse] = useState('');
  const [captureMode, setCaptureMode] = useState('');
  const [showTelemetry, setShowTelemetry] = useState(false);

  const cleanResponseText = (text: string) => {
    return text.replace(/^[💬⚠️🧠🎯🕌]\s*\[\w+ MODE\]\s*/u, '');
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const todayStr = getLocalDateString();
    
    try {
      const [status, streakResult, activeFlawsResult, mirrorResult, logToday, workoutTodayData] = await Promise.all([
        api.status(),
        api.logs.streak(),
        api.flaws.mostActive().catch(() => []),
        api.patterns.latest().catch(() => null),
        api.logs.today().catch(() => null),
        api.workout.today().catch(() => null)
      ]);

      const topFlawNames = Array.isArray(activeFlawsResult)
        ? activeFlawsResult.map((f: any) => typeof f === 'string' ? f : f.name || `Flaw #${f.id}`)
        : [];

      setData({
        status: status.status,
        loggedToday: !status.is_locked,
        currentDay: status.phase_day,
        totalDays: 90,
        streaks: streakResult.pillar_streaks || { DEEN: 0, ELESIUM: 0, INFLUENCE: 0, SELF: 0 },
        overallStreak: streakResult.overall_streak || 0,
        longestStreak: streakResult.longest_streak_ever || 0,
        totalLoggedDays: streakResult.total_logged_days || 0,
        topFlaws: topFlawNames.length > 0 ? topFlawNames : ['No major flaws detected recently.'],
        latestMirror: mirrorResult && !mirrorResult.error ? mirrorResult : null,
        daysToCheckpoint: streakResult.days_to_checkpoint || 0,
      });

      if (logToday && !logToday.error && logToday.date === todayStr) {
        setTodayLog(logToday);
        setNns(logToday.non_negotiables || {});
      } else {
        setTodayLog(null);
        setNns({});
      }
      setWorkoutToday(workoutTodayData?.workout);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }

    // Load A.O.S. + XP data independently
    try {
      const [aos, xp, xpHist, penalties, perks, sleepData, fastData, dwData, readData] = await Promise.all([
        api.aos.status().catch(() => null),
        api.xp.today().catch(() => null),
        api.xp.history(30).catch(() => []),
        api.aos.penalties().catch(() => null),
        api.aos.perks().catch(() => null),
        fetch(`${API_BASE}/api/wellness/sleep/today`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/api/wellness/fast/today`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/api/wellness/deepwork/today`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/api/wellness/readiness/today`).then(r => r.json()).catch(() => null),
      ]);
      setAosData(aos);
      setXpData(xp);
      setXpHistory(Array.isArray(xpHist) ? xpHist : []);
      setPenaltyData(penalties);
      setPerkData(perks);
      setSleepStatus(sleepData);
      setFastStatus(fastData);
      setDeepwork(dwData);
      setReadinessToday(readData);
    } catch (err) {
      console.error('A.O.S. data load failed', err);
    }

    // Load Elesium data
    try {
      const elesium = await (api as any).elesium?.summary?.().catch(() => null);
      setElesiumData(elesium);
    } catch { /* non-critical */ }

    setLastRefresh(new Date());
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Handle toggle sleep — on wake up, open readiness modal
  const handleToggleSleep = async () => {
    if (isSleepActionLoading) return;
    triggerHaptic('heavy');
    setIsSleepActionLoading(true);
    try {
      const endpoint = sleepStatus?.is_sleeping ? '/api/wellness/sleep/stop' : '/api/wellness/sleep/start';
      const stopRes = await fetch(`${API_BASE}${endpoint}`, { method: 'POST' });
      const stopData = await stopRes.json();
      // If we just woke up, capture the sleep_id and show readiness modal
      if (sleepStatus?.is_sleeping && stopData.sleep_id) {
        setLastSleepId(stopData.sleep_id);
        setShowReadinessModal(true);
      }
      const res = await fetch(`${API_BASE}/api/wellness/sleep/today`);
      setSleepStatus(await res.json());
    } catch (err) {
      console.warn('Failed to toggle sleep', err);
    } finally {
      setIsSleepActionLoading(false);
    }
  };

  // Fast toggle
  const handleToggleFast = async () => {
    if (isFastActionLoading) return;
    triggerHaptic('medium');
    setIsFastActionLoading(true);
    try {
      const endpoint = fastStatus?.is_fasting ? '/api/wellness/fast/stop' : '/api/wellness/fast/start';
      await fetch(`${API_BASE}${endpoint}`, { method: 'POST' });
      const res = await fetch(`${API_BASE}/api/wellness/fast/today`);
      setFastStatus(await res.json());
    } catch (err) {
      console.warn('Failed to toggle fast', err);
    } finally {
      setIsFastActionLoading(false);
    }
  };

  // Deep work toggle
  const handleToggleDeepwork = async () => {
    if (isDeepworkActionLoading) return;
    triggerHaptic('heavy');
    setIsDeepworkActionLoading(true);
    try {
      const endpoint = deepwork?.is_active ? '/api/wellness/deepwork/stop' : '/api/wellness/deepwork/start';
      await fetch(`${API_BASE}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label: '' }) });
      const res = await fetch(`${API_BASE}/api/wellness/deepwork/today`);
      setDeepwork(await res.json());
    } catch (err) {
      console.warn('Failed to toggle deepwork', err);
    } finally {
      setIsDeepworkActionLoading(false);
    }
  };

  // Format elapsed time helper
  const fmtElapsed = (minutes: number | null | undefined) => {
    if (!minutes) return '0:00';
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return h > 0 ? `${h}h ${m.toString().padStart(2,'0')}m` : `${m}m`;
  };

  // Handle checking off habits directly
  const handleHabitToggle = async (key: string, checked: boolean) => {
    triggerHaptic(checked ? 'success' : 'light');
    const updatedNns = { ...nns, [key]: checked };
    setNns(updatedNns);

    try {
      const todayStr = getLocalDateString();
      const logData = {
        date: todayStr,
        timestamp: new Date().toISOString(),
        text: todayLog?.text || "Quick check-in habit update",
        pillars: todayLog?.pillars || ["SELF"],
        non_negotiables: {
          salah_5: false,
          quran_30min: false,
          deep_work_4hr: false,
          physical_training: false,
          reading_1hr: false,
          adhkar: false,
          no_phone_before_8: false,
          no_sugar: false,
          ice_bath: false,
          cold_shower: false,
          microbursts: false,
          combat_training: false,
          memorization_session: false,
          app_lock_on: false,
          sleep_on_floor: false,
          fajr_without_alarm: false,
          ...updatedNns
        },
        flaw_triggers: todayLog?.flaw_triggers || [],
        work_done: todayLog?.work_done || "",
        lessons_learned: todayLog?.lessons_learned || "",
        no_sales_today: todayLog?.no_sales_today || false,
        no_clients_today: todayLog?.no_clients_today || false,
      };
      
      const result = await api.logs.submit(logData);
      setTodayLog({
        ...logData,
        xp_earned: result.xp_earned,
        active_penalties: result.active_penalties,
        perks_unlocked: result.perks_unlocked,
      });

      // Quick reload to update XP bars and diagnostics in background
      const [xp, status] = await Promise.all([
        api.xp.today().catch(() => null),
        api.status().catch(() => null)
      ]);
      setXpData(xp);
      if (status) {
        setData((prev: any) => prev ? { ...prev, loggedToday: !status.is_locked } : null);
      }
    } catch (err) {
      console.error('Failed to update non-negotiables', err);
    }
  };

  // Quick Ingestion Thought Capture Stream Parser
  const handleCaptureThought = async () => {
    triggerHaptic('medium');
    if (!thoughtInput.trim() || isCapturing) return;
    const userMessage = thoughtInput.trim();
    setThoughtInput('');
    setIsCapturing(true);
    setCaptureResponse('');
    setCaptureMode('');

    try {
      const response = await fetch(`${API_BASE}/api/chat/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        setCaptureResponse(`ERROR: API returned ${response.status}. Check backend.`);
        setIsCapturing(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let aiText = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.error) {
                  aiText += `\n[ERROR: ${data.error}]`;
                } else if (data.text) {
                  aiText += data.text;
                }
                setCaptureResponse(aiText);
                const match = aiText.match(/\[(\w+) MODE\]/);
                if (match) setCaptureMode(match[1]);
              } catch { /* ignore partial JSON */ }
            }
          }
        }
      }
    } catch (e) {
      setCaptureResponse('ERROR: NETWORK CONNECTION TIMED OUT.');
    } finally {
      setIsCapturing(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center font-mono gap-6">
        <div className="scanline-overlay" />
        <div className="relative">
          <div className="w-16 h-16 border border-gold/20 border-t-gold/80 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-gold/60 text-[10px] tracking-widest">VM</div>
        </div>
        <p className="text-text-dim text-xs tracking-[0.4em] animate-pulse">
          {!loading && !data ? 'SYSTEM OFFLINE // CHECK CONNECTION' : 'BOOTING OPERATOR KERNEL...'}
        </p>
        {!loading && !data && (
          <button onClick={loadData} className="mt-4 px-4 py-2 border border-gold/40 text-gold text-xs tracking-widest hover:bg-gold/10 transition-colors">
            FORCE REBOOT
          </button>
        )}
      </div>
    );
  }

  const criticalPenalties = penaltyData?.penalties?.filter((p: any) => p.severity === 'critical') ?? [];
  const hasCritical = criticalPenalties.length > 0;

  return (
    <div className="min-h-screen bg-obsidian text-gray-300 font-mono relative pb-28 no-select overflow-x-hidden">
      <div className="scanline-overlay" />

      {/* Morning Readiness Modal — shows after waking up */}
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

      {/* Sticky Critical Penalty Alert removed per user request */}

      <div className="w-full px-4 pt-safe pb-12 space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-surface2 pb-5 gap-4">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-3 flex items-center gap-2 text-[10px] tracking-widest text-text-dim hover:text-gold transition-colors uppercase font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> BACK
            </button>
            <h1 className="text-3xl font-heading text-gold tracking-[0.2em] drop-shadow-[0_0_12px_rgba(201,168,76,0.3)] animate-fade-up">
              <DecryptedText text="COMMAND CENTER" animateOnHover={true} />
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="status-dot-active" />
              <p className="text-[10px] text-text-dim tracking-widest">
                VIRTUAL MIND 2.0 // PHASE 0 DAY {data?.currentDay ?? '—'} // {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <PushNotificationToggle compact />
            <button
              id="refresh-btn"
              onClick={loadData}
              className="px-3 py-3 md:py-2 bg-surface hover:bg-surface2 border border-surface2 flex items-center justify-center gap-2 text-xs transition-colors text-text-dim hover:text-gold flex-1 min-w-[100px]"
            >
              <RefreshCw className="w-3.5 h-3.5" /> REFRESH
            </button>
            <button
              id="terminal-btn"
              onClick={() => router.push('/chat?from=command')}
              className="px-4 py-3 md:py-2 bg-surface hover:bg-surface2 border border-surface2 flex items-center justify-center gap-2 text-xs transition-colors hover:text-gold flex-1 min-w-[120px]"
            >
              <Terminal className="w-3.5 h-3.5" /> FULL TERMINAL
            </button>
            <button
              id="workout-tracker-btn"
              onClick={() => router.push('/workout')}
              className="px-4 py-3 md:py-2 bg-gold/10 hover:bg-gold/20 border border-gold/40 flex items-center justify-center gap-2 text-sm font-bold transition-colors text-gold flex-1 min-w-[100px]"
            >
              <Dumbbell className="w-4 h-4" /> WORKOUT
            </button>
            <button
              id="secure-reflection-btn"
              onClick={() => router.push('/log')}
              className="px-4 py-3 md:py-2 bg-gold/10 hover:bg-gold/20 border border-gold/40 flex items-center justify-center gap-2 text-sm font-bold transition-colors text-gold flex-1 min-w-[160px]"
            >
              <Brain className="w-4 h-4" /> SECURE REFLECTION
            </button>
          </div>
        </header>

        {/* 0. PUSH NOTIFICATION ONBOARDING (shown until subscribed) */}
        <PushNotificationToggle />

        {/* 1. KEY TELEMETRY ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-up-delay-1">
          {/* North Star Metric Card removed per user request */}

          {/* Workout Split Status Card */}
          <ElectricBorder color="rgba(201,168,76,0.5)">
            <div className="bg-surface p-6 flex flex-col items-center justify-center relative overflow-hidden h-[180px] cursor-pointer hover:bg-surface2 transition-colors group" onClick={() => router.push('/workout')}>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.04)_0%,transparent_70%)] pointer-events-none" />
              <h2 className="text-text-dim tracking-[0.5em] text-xs font-bold mb-2 z-10 text-center flex items-center gap-1.5 justify-center">
                <Dumbbell className="w-3.5 h-3.5 text-gold-dim group-hover:animate-bounce" /> DAILY ROUTINE
              </h2>
              <div className="text-2xl font-bold tracking-widest text-white z-10 text-center mb-1 group-hover:text-gold transition-colors">
                {workoutToday ? workoutToday.split_name : 'REST DAY'}
              </div>
              <div className="text-[10px] text-gold z-10 font-mono tracking-widest uppercase mt-1">
                {workoutToday?.is_rest_day ? 'REST DAY // ACTIVE RECOVERY' : 'TAP TO LOG WORKOUT'}
              </div>
            </div>
          </ElectricBorder>

          {/* Sleep Tracker Card */}
          <ElectricBorder color={sleepStatus?.is_sleeping ? "rgba(100,100,255,0.5)" : "rgba(201,168,76,0.5)"}>
            <div className="bg-surface p-6 flex flex-col items-center justify-center relative overflow-hidden h-[180px] cursor-pointer hover:bg-surface2 transition-colors group" onClick={isSleepActionLoading ? undefined : handleToggleSleep}>
              <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,${sleepStatus?.is_sleeping ? 'rgba(100,100,255,0.06)' : 'rgba(201,168,76,0.04)'}_0%,transparent_70%)] pointer-events-none`} />
              <h2 className="text-text-dim tracking-[0.5em] text-xs font-bold mb-2 z-10 text-center flex items-center gap-1.5 justify-center">
                <Moon className={`w-3.5 h-3.5 ${sleepStatus?.is_sleeping ? 'text-blue-400 animate-pulse' : 'text-gold-dim group-hover:animate-bounce'}`} /> 
                {sleepStatus?.is_sleeping ? 'DEEP SLEEP ACTIVE' : 'SLEEP SYSTEM'}
              </h2>
              <div className={`text-2xl font-bold tracking-widest z-10 text-center mb-1 transition-colors ${sleepStatus?.is_sleeping ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(100,100,255,0.6)]' : 'text-white group-hover:text-gold'}`}>
                {sleepStatus?.is_sleeping ? 'WAKE UP' : 'GO TO SLEEP'}
              </div>
              <div className={`text-[10px] z-10 font-mono tracking-widest uppercase mt-1 ${sleepStatus?.is_sleeping ? 'text-blue-300' : 'text-text-dim'}`}>
                {sleepStatus?.is_sleeping 
                  ? 'TAP TO LOG WAKE TIME' 
                  : (sleepStatus?.last_sleep_hours ? `LAST SLEEP: ${sleepStatus.last_sleep_hours.toFixed(1)} HRS` : 'TAP TO INITIATE SLEEP')}
              </div>
            </div>
          </ElectricBorder>
        </div>

        {/* WELLNESS ROW: Fasting + Deep Work */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-up-delay-1">
          {/* Fasting Card */}
          <ElectricBorder color={fastStatus?.is_fasting ? "rgba(255,165,0,0.5)" : "rgba(201,168,76,0.3)"}>
            <div
              className="bg-surface p-6 flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[200px] cursor-pointer hover:bg-surface2 transition-colors group"
              onClick={isFastActionLoading ? undefined : handleToggleFast}
            >
              <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,${fastStatus?.is_fasting ? 'rgba(255,165,0,0.05)' : 'rgba(201,168,76,0.03)'}_0%,transparent_70%)] pointer-events-none`} />
              
              <h2 className="text-text-dim tracking-[0.5em] text-xs font-bold mb-3 z-10 text-center flex items-center gap-1.5 justify-center">
                <Zap className={`w-3.5 h-3.5 ${fastStatus?.is_fasting ? 'text-orange-400 animate-pulse' : 'text-gold-dim'}`} />
                {fastStatus?.is_fasting ? 'FASTING ACTIVE' : 'INTERMITTENT FAST'}
              </h2>
              
              <div className={`text-3xl font-bold tracking-widest z-10 text-center mb-1 transition-colors ${
                fastStatus?.is_fasting ? 'text-orange-300 drop-shadow-[0_0_12px_rgba(255,165,0,0.5)]' : 'text-white group-hover:text-gold'
              }`}>
                {fastStatus?.is_fasting
                  ? fmtElapsed(fastStatus.elapsed_minutes)
                  : (fastStatus?.last_fast_hours ? `${fastStatus.last_fast_hours.toFixed(1)}h last` : 'TAP TO START')}
              </div>
              
              <div className={`text-[10px] z-10 font-mono tracking-widest uppercase mt-1 ${
                fastStatus?.is_fasting ? 'text-orange-200/80' : 'text-text-dim'
              }`}>
                {fastStatus?.is_fasting ? (fastStatus.fast_phase || 'CALCULATING') : '16:8 PROTOCOL'}
              </div>
            </div>
          </ElectricBorder>

          {/* Deep Work Flow Engine */}
          <ElectricBorder color={deepwork?.is_active ? "rgba(120,255,120,0.5)" : "rgba(201,168,76,0.3)"}>
            <div
              className="bg-surface p-6 flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[200px] cursor-pointer hover:bg-surface2 transition-colors group"
              onClick={isDeepworkActionLoading ? undefined : handleToggleDeepwork}
            >
              <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,${deepwork?.is_active ? 'rgba(120,255,120,0.05)' : 'rgba(201,168,76,0.03)'}_0%,transparent_70%)] pointer-events-none`} />
              <h2 className="text-text-dim tracking-[0.5em] text-xs font-bold mb-3 z-10 text-center flex items-center gap-1.5 justify-center">
                <Timer className={`w-3.5 h-3.5 ${deepwork?.is_active ? 'text-vm-green animate-pulse' : 'text-gold-dim'}`} />
                {deepwork?.is_active ? 'FLOW STATE ACTIVE' : 'DEEP WORK ENGINE'}
              </h2>
              <div className={`text-3xl font-bold tracking-widest z-10 text-center mb-1 transition-colors ${
                deepwork?.is_active
                  ? 'text-vm-green drop-shadow-[0_0_12px_rgba(120,255,120,0.5)]'
                  : 'text-white group-hover:text-gold'
              }`}>
                {deepwork?.is_active
                  ? fmtElapsed(deepwork.elapsed_minutes)
                  : (deepwork?.total_hours_today > 0 ? `${deepwork.total_hours_today.toFixed(1)}h today` : 'ENTER FLOW')}
              </div>
              <div className={`text-[10px] z-10 font-mono tracking-widest uppercase mt-1 ${
                deepwork?.is_active ? 'text-vm-green/70' : 'text-text-dim'
              }`}>
                {deepwork?.is_active
                  ? 'TAP TO END SESSION'
                  : (deepwork?.goal_hit ? '🏆 4HR GOAL HIT TODAY' : `GOAL: 4H — TODAY: ${deepwork?.total_hours_today?.toFixed(1) ?? 0}H`)}
              </div>
              {/* Sessions count */}
              {(deepwork?.sessions_today ?? 0) > 0 && !deepwork?.is_active && (
                <div className="text-[9px] text-text-dim tracking-widest mt-2 z-10">
                  {deepwork.sessions_today} SESSION{deepwork.sessions_today > 1 ? 'S' : ''} COMPLETED
                </div>
              )}
            </div>
          </ElectricBorder>
        </div>

        {/* 2. INSTANT THOUGHT CAPTURE (Frictionless Input) */}
        <div className="bg-surface border border-surface2 p-5 animate-fade-up-delay-1">
          <h3 className="text-gold font-bold mb-3 tracking-widest text-xs flex items-center gap-2">
            <Terminal className="w-4 h-4 text-gold" /> QUICK CONSCIOUSNESS CAPTURE
          </h3>
          <div className="flex bg-obsidian border border-surface2 focus-within:border-gold/40 transition-colors">
            <textarea
              id="quick-thought-input"
              rows={2}
              className="flex-1 bg-transparent p-3 border-none outline-none text-gray-200 placeholder-text-dim/40 text-sm resize-none"
              placeholder="Dictate or type raw thoughts here to log immediately... (Press Ctrl+Enter or click Send)"
              value={thoughtInput}
              onChange={e => setThoughtInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleCaptureThought();
                }
              }}
              disabled={isCapturing}
            />
            <button
              id="quick-capture-send-btn"
              onClick={handleCaptureThought}
              disabled={isCapturing || !thoughtInput.trim()}
              className="px-4 text-gold hover:text-gold-bright disabled:opacity-30 transition-colors flex items-center justify-center border-l border-surface2"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Inline Console Output */}
          {captureResponse && (
            <div className="mt-4 p-4 bg-obsidian border border-surface2 font-mono text-xs text-left relative overflow-hidden">
              <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[9px] tracking-widest opacity-60">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                NEURAL RESPONSE
              </div>
              <div className="text-[10px] tracking-[0.2em] mb-1.5 text-gold-dim">
                {captureMode ? `${captureMode} MODE` : 'VIRTUAL MIND'} //
              </div>
              <p className={`whitespace-pre-wrap leading-relaxed ${
                captureMode === 'ACCOUNTABILITY' ? 'text-vm-red' : 
                captureMode === 'SPIRITUAL' ? 'text-gold-bright' : 
                'text-gray-300'
              }`}>
                {cleanResponseText(captureResponse)}
              </p>
            </div>
          )}
        </div>

        {/* 2.5. PILLAR COMPLIANCE METRICS TRENDS */}
        <div className="animate-fade-up-delay-2">
          <PillarHistoryChart />
        </div>

        {/* 3. EXECUTION BLOCK ("What I Need To Be Doing") */}
        <div className="bg-surface border border-surface2 p-6 space-y-6 animate-fade-up-delay-2">
          <div className="flex justify-between items-center border-b border-surface2 pb-3">
            <div>
              <h3 className="text-gold font-bold tracking-widest text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-vm-green" /> ACTIVE DAILY TASKS (CHECK-IN)
              </h3>
              <p className="text-[10px] text-text-dim tracking-widest mt-0.5">TAPPING CODES PERSISTS AND RECALCULATES XP INSTANTLY</p>
            </div>
            {xpData && (
              <div className="text-right">
                <div className="text-sm font-bold text-gold">{xpData.total_xp ?? 0} XP Today</div>
                <div className="text-[9px] text-text-dim tracking-widest">Target: 200 XP</div>
              </div>
            )}
          </div>

          {/* Quick Habits Check */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Column A: Core Non-Negotiables */}
            <div className="space-y-3">
              <h4 className="text-gold-dim font-bold text-[10px] tracking-[0.3em] uppercase border-b border-surface2 pb-1.5 flex items-center justify-between">
                <span>Core non-negotiables</span>
                <span className="text-[9px] lowercase font-normal italic text-text-dim">40 XP each</span>
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {CLASSIC_NNS.map(n => (
                  <NonNegCheck
                    key={n.key}
                    label={`${n.icon} ${n.label}`}
                    checked={nns[n.key] || false}
                    onChange={(checked) => handleHabitToggle(n.key, checked)}
                  />
                ))}
              </div>
            </div>

            {/* Column B: A.O.S. Protocols */}
            <div className="space-y-3">
              <h4 className="text-gold-dim font-bold text-[10px] tracking-[0.3em] uppercase border-b border-surface2 pb-1.5 flex items-center justify-between">
                <span>A.O.S. Habits</span>
                <span className="text-[9px] lowercase font-normal italic text-text-dim">10-25 XP each</span>
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {AOS_HABITS.map(n => (
                  <NonNegCheck
                    key={n.key}
                    label={`${n.icon} ${n.label}`}
                    checked={nns[n.key] || false}
                    onChange={(checked) => handleHabitToggle(n.key, checked)}
                  />
                ))}
              </div>
            </div>

          </div>

          {/* End-Of-Day Logging Action Callout */}
          <div className="bg-obsidian border border-surface2 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Zap className={`w-5 h-5 shrink-0 ${data?.loggedToday ? 'text-vm-green' : 'text-gold animate-pulse'}`} />
              <div>
                <p className="text-xs font-bold text-gray-200">
                  {data?.loggedToday ? 'REFLECTIONS LOCKED FOR TODAY' : 'END OF DAY REFLECTION MANDATORY'}
                </p>
                <p className="text-[10px] text-text-dim tracking-wide mt-0.5">
                  {data?.loggedToday 
                    ? 'Your daily mirror is secured. You can update narrative in secure reflection.' 
                    : 'A.O.S. requires a minimum 250-character reflective journal to fully secure XP.'}
                </p>
              </div>
            </div>
            <button
              id="linear-reflection-btn"
              onClick={() => router.push('/log')}
              className={`w-full md:w-auto px-6 py-2.5 text-xs font-bold tracking-widest border transition-colors ${
                data?.loggedToday 
                  ? 'border-surface2 hover:border-gold/40 text-text-dim hover:text-gold' 
                  : 'border-gold/60 bg-gold/10 hover:bg-gold/20 text-gold'
              }`}
            >
              {data?.loggedToday ? 'REVIEW REFLECTION' : 'SECURE DAY NOW'}
            </button>
          </div>
        </div>

        {/* 4. GUARDRAILS BLOCK ("What I Must Avoid") */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-up-delay-3">
          
          {/* Active Vulnerabilities */}
          <div className="bg-surface border border-surface2 p-5 hover-lift">
            <h3 className="text-vm-red font-bold tracking-widest text-xs border-b border-surface2 pb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-vm-red shrink-0" />
              <GlitchText text="ACTIVE VULNERABILITIES" />
            </h3>
            <ul className="space-y-1.5 mt-4">
              {data?.topFlaws.map((flaw: string, idx: number) => {
                const isCritical = flaw.includes('CRITICAL') || flaw.includes('Preparation-as-Progress');
                return (
                  <li key={idx} className={`${
                    isCritical 
                      ? 'bg-vm-red/20 border-vm-red/80 text-vm-red animate-pulse shadow-[0_0_10px_rgba(201,76,76,0.3)]' 
                      : 'bg-obsidian border-vm-red/20 text-vm-red/80'
                    } border p-3 text-xs leading-tight transition-colors font-bold`}
                  >
                    {flaw}
                  </li>
                );
              })}
            </ul>
            <button
              id="mirror-patterns-btn"
              onClick={() => router.push('/patterns')}
              className="mt-4 w-full py-2 bg-obsidian border border-surface2 hover:border-gold/40 text-text-dim hover:text-gold transition-colors text-xs tracking-widest"
            >
              FULL MIRROR & COGNITIVE ANALYSIS
            </button>
          </div>

          {/* Active Penalties & Perks */}
          <div className="bg-surface border border-surface2 p-5 hover-lift flex flex-col justify-between">
            <div>
              <h3 className="text-gold font-bold tracking-widest text-xs border-b border-surface2 pb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-gold" /> BEHAVIORAL CONSEQUENCES
              </h3>
              
              {/* Penalties list */}
              <div className="mt-4 space-y-2">
                {penaltyData?.penalties?.length > 0 ? (
                  penaltyData.penalties.map((p: any) => (
                    <div key={p.type} className="text-vm-red text-xs border border-vm-red/20 bg-vm-red/5 p-3 flex items-start gap-2.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{p.description}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-vm-green text-xs border border-vm-green/20 bg-vm-green/5 p-3 flex items-start gap-2.5 font-bold">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>No active behavioral penalties. Compliance index is clean.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Perks list */}
            {perkData?.perks?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-surface2">
                <p className="text-[10px] text-text-dim tracking-[0.2em] uppercase mb-2">Unlocked Perks</p>
                <div className="flex flex-wrap gap-2">
                  {perkData.perks.map((perk: any) => (
                    <span key={perk.name} className="px-2 py-1 bg-gold/5 border border-gold/30 text-gold text-[9px] tracking-wider font-bold">
                      🏆 {perk.name.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* 5. ACCORDION: EXPANDABLE TELEMETRY (Streaks, XP charts, A.O.S. metrics) */}
        <div className="border border-surface2 bg-surface">
          <button
            id="toggle-telemetry-btn"
            onClick={() => setShowTelemetry(!showTelemetry)}
            className="w-full px-5 py-4 flex justify-between items-center hover:bg-surface2 transition-colors font-bold text-xs tracking-widest text-gold-dim hover:text-gold"
          >
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4" /> HISTORICAL DIAGNOSTICS & SYSTEM TELEMETRY
            </span>
            {showTelemetry ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showTelemetry && (
            <div className="p-5 border-t border-surface2 space-y-8 animate-fade-up">
              
              {/* Streaks & Logged count */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(data.streaks).map(([pillar, streak]: [string, any]) => {
                  const meta = PILLAR_META[pillar] ?? { color: 'text-text-dim border-surface2', icon: '•', label: pillar };
                  return (
                    <div
                      key={pillar}
                      id={`telemetry-pillar-${pillar.toLowerCase()}`}
                      onClick={() => router.push(`/folder/${pillar.toLowerCase()}`)}
                      className={`bg-obsidian border p-4 cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center gap-3 relative overflow-hidden hover-lift ${meta.color}`}
                    >
                      <span className="text-xl">{meta.icon}</span>
                      <StreakBadge count={streak} pillar={pillar} />
                      <span className="text-[10px] tracking-widest opacity-60">{meta.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Overall streaks stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'OVERALL STREAK', value: data.overallStreak },
                  { label: 'LONGEST EVER', value: data.longestStreak },
                  { label: 'DAYS LOGGED', value: data.totalLoggedDays },
                ].map(s => (
                  <div key={s.label} className="bg-obsidian border border-surface2 p-4 text-center hover-lift">
                    <div className="text-2xl font-heading text-gold">{s.value}</div>
                    <div className="text-[10px] text-text-dim tracking-widest mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* XP History & A.O.S. Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* XP History Chart */}
                {xpHistory.length > 0 && (
                  <div className="bg-obsidian border border-surface2 p-5 hover-lift">
                    <h3 className="text-gold font-bold mb-4 flex items-center gap-2 text-xs tracking-widest">
                      <TrendingUp className="w-4 h-4" /> XP HISTORY (30D)
                    </h3>
                    <XPHistoryChart history={xpHistory} target={200} />
                  </div>
                )}

                {/* A.O.S. Status Grid */}
                {aosData && (
                  <div className="bg-obsidian border border-surface2 p-5 hover-lift">
                    <h3 className="text-gold font-bold mb-4 flex items-center gap-2 tracking-widest text-xs border-b border-surface2 pb-2">
                      <Shield className="w-4 h-4" /> A.O.S. PROTOCOLS STATUS
                    </h3>
                    <ProtocolStatusGrid
                      protocols={aosData.protocols ?? {}}
                      summary={aosData.summary ?? { active: 0, breached: 0, partial: 0, skipped: 0, aos_health_score: 0, is_ramadan: false }}
                    />
                  </div>
                )}

              </div>

              {/* Elesium Panel & Phase Countdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Elesium detailed metrics */}
                <div className="bg-obsidian border border-vm-blue/20 p-5 hover-lift">
                  <h3 className="text-vm-blue font-bold mb-4 flex items-center gap-2 tracking-widest text-xs border-b border-vm-blue/20 pb-2">
                    <TrendingUp className="w-4 h-4" /> ⚡ ELESIUM — PILLAR 2
                  </h3>
                  <ElesiumPanel data={elesiumData} />
                </div>

                {/* Phase countdown details */}
                <div className="bg-obsidian border border-surface2 p-5 hover-lift flex flex-col justify-between">
                  <PhaseCountdown currentDay={data?.currentDay ?? 0} totalDays={90} />
                </div>

              </div>

            </div>
          )}
        </div>

        {/* Dynamic Pattern Analysis reflection */}
        {data?.latestMirror && (
          <div className="bg-surface border border-surface2 p-5 hover-lift animate-fade-up-delay-3">
            <h3 className="text-gold font-bold mb-4 flex items-center gap-2 text-xs tracking-widest">
              <Brain className="w-4 h-4" /> RECENT PATTERN ANALYSIS
            </h3>
            <WeeklyMirror data={data.latestMirror} />
          </div>
        )}

      </div>
    </div>
  );
}
