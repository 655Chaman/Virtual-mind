'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Zap, 
  Brain, 
  Dumbbell, 
  Moon, 
  Timer, 
  RefreshCw,
  ArrowLeft,
  
  Target,
  Sun
} from 'lucide-react';
import { api, getLocalDateString } from '@/lib/api';
import { triggerHaptic } from '@/lib/utils';
import { NonNegCheck } from '@/components/ui/NonNegCheck';

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8001`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
};
const API_BASE = getApiBase();

export default function CommandCenter() {
  const router = useRouter();
  
  // Data States
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nns, setNns] = useState<Record<string, boolean>>({});
  const [todayLog, setTodayLog] = useState<any>(null);
  
  // Wellness States
  const [sleepStatus, setSleepStatus] = useState<any>(null);
  const [fastStatus, setFastStatus] = useState<any>(null);
  const [deepwork, setDeepwork] = useState<any>(null);
  
  // Action Loadings
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Live timer tick
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 60000); // 1 min update
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const todayStr = getLocalDateString();
    
    try {
      const [status, logToday, sleepData, fastData, dwData] = await Promise.all([
        api.status(),
        api.logs.today().catch(() => null),
        fetch(`${API_BASE}/api/wellness/sleep/today`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/api/wellness/fast/today`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/api/wellness/deepwork/today`).then(r => r.json()).catch(() => null),
      ]);

      setData({
        status: status.status,
        loggedToday: !status.is_locked,
        currentDay: status.phase_day,
      });

      if (logToday && !logToday.error && logToday.date === todayStr) {
        setTodayLog(logToday);
        setNns(logToday.non_negotiables || {});
      } else {
        setTodayLog(null);
        setNns({});
      }

      setSleepStatus(sleepData);
      setFastStatus(fastData);
      setDeepwork(dwData);
    } catch (err) {
      console.error('Failed to fetch command center data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Wellness Toggles
  const handleToggle = async (type: 'sleep' | 'fast' | 'deepwork') => {
    if (isActionLoading) return;
    triggerHaptic('heavy');
    setIsActionLoading(true);
    try {
      let endpoint = '';
      let body = undefined;
      
      if (type === 'sleep') endpoint = sleepStatus?.is_sleeping ? '/api/wellness/sleep/stop' : '/api/wellness/sleep/start';
      if (type === 'fast') endpoint = fastStatus?.is_fasting ? '/api/wellness/fast/stop' : '/api/wellness/fast/start';
      if (type === 'deepwork') {
        endpoint = deepwork?.is_active ? '/api/wellness/deepwork/stop' : '/api/wellness/deepwork/start';
        body = JSON.stringify({ label: '' });
      }

      await fetch(`${API_BASE}${endpoint}`, { 
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body
      });
      
      // Refresh just the specific state to be fast
      const res = await fetch(`${API_BASE}/api/wellness/${type}/today`);
      const newData = await res.json();
      if (type === 'sleep') setSleepStatus(newData);
      if (type === 'fast') setFastStatus(newData);
      if (type === 'deepwork') setDeepwork(newData);
    } catch (err) {
      console.warn(`Failed to toggle ${type}`, err);
    } finally {
      setIsActionLoading(false);
    }
  };

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
          ...updatedNns
        },
        flaw_triggers: todayLog?.flaw_triggers || [],
      };
      
      const result = await api.logs.submit(logData);
      setTodayLog({ ...logData, xp_earned: result.xp_earned });
    } catch (err) {
      console.error('Failed to update non-negotiables', err);
    }
  };

  const fmtElapsed = (minutes: number | null | undefined) => {
    if (!minutes) return '0h 0m';
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center font-mono">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/60 animate-spin mb-4" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-gray-300 font-sans relative pb-32 overflow-x-hidden selection:bg-white/10">
      
      {/* Absolute Minimalism - No background glows, purely structural */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-16 space-y-16">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10 animate-fade-up">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-8 flex items-center gap-2 text-[10px] tracking-[0.2em] text-white/30 hover:text-white transition-colors uppercase font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return
            </button>
            <h1 className="text-4xl md:text-5xl font-light text-white tracking-wide">
              Command Center
            </h1>
            <div className="flex items-center gap-3 mt-4 text-white/50">
              <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
              <p className="text-xs tracking-[0.1em] font-medium">
                Day {data?.currentDay ?? '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/log')}
              className={`px-8 py-3.5 rounded-full flex items-center gap-2 text-xs font-semibold tracking-wide transition-all ${
                data?.loggedToday 
                  ? 'bg-white/5 text-white/50 hover:bg-white/10' 
                  : 'bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
              }`}
            >
              <Brain className="w-4 h-4" /> 
              {data?.loggedToday ? 'Review Reflection' : 'Secure Day'}
            </button>
            <button
              onClick={loadData}
              className="p-3.5 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-all text-white/60 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* --- PILLAR GRID (Extreme Curves & Minimalism) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
          
          {/* ======================= */}
          {/* 1. DEEN PILLAR          */}
          {/* ======================= */}
          <section className="bg-white/[0.02] rounded-[2.5rem] overflow-hidden animate-fade-up-delay-1 transition-colors hover:bg-white/[0.03]">
            <div className="p-8 md:p-10 pb-6 flex items-center gap-5">
              <div className="p-4 bg-gold/10 rounded-2xl text-gold">
                <Sun className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-light text-white tracking-wide">Deen</h2>
                <p className="text-xs text-gold/60 tracking-wider mt-1 font-medium">Spiritual Foundation</p>
              </div>
            </div>
            
            <div className="px-8 md:px-10 pb-10 space-y-5">
              <NonNegCheck
                label="5 Salah On Time"
                checked={nns['salah_5'] || false}
                onChange={(checked) => handleHabitToggle('salah_5', checked)}
              />
              <NonNegCheck
                label="30 Min Quran"
                checked={nns['quran_30min'] || false}
                onChange={(checked) => handleHabitToggle('quran_30min', checked)}
              />
              <NonNegCheck
                label="Adhkar Morning & Evening"
                checked={nns['adhkar'] || false}
                onChange={(checked) => handleHabitToggle('adhkar', checked)}
              />
            </div>
          </section>

          {/* ======================= */}
          {/* 2. RECOVERY & SELF      */}
          {/* ======================= */}
          <section className="bg-white/[0.02] rounded-[2.5rem] overflow-hidden animate-fade-up-delay-1 transition-colors hover:bg-white/[0.03]">
            <div className="p-8 md:p-10 pb-6 flex items-center gap-5">
              <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-light text-white tracking-wide">Recovery</h2>
                <p className="text-xs text-emerald-400/60 tracking-wider mt-1 font-medium">Physical Resilience</p>
              </div>
            </div>
            
            <div className="px-8 md:px-10 pb-10 space-y-8">
              
              {/* State Trackers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sleep */}
                <div onClick={() => handleToggle('sleep')} className={`cursor-pointer rounded-[2rem] p-6 transition-all flex flex-col gap-4 group ${sleepStatus?.is_sleeping ? 'bg-blue-500/10' : 'bg-white/5 hover:bg-white/10'}`}>
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 font-semibold text-sm tracking-wide ${sleepStatus?.is_sleeping ? 'text-blue-400' : 'text-white/70'}`}>
                      <Moon className="w-4 h-4" /> Sleep
                    </div>
                    <div className={`text-[10px] px-3 py-1 rounded-full font-medium ${sleepStatus?.is_sleeping ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'}`}>
                      {sleepStatus?.is_sleeping ? 'Waking' : 'Sleep'}
                    </div>
                  </div>
                  <div className="text-xs text-white/40 tracking-wide font-medium">
                    {sleepStatus?.is_sleeping ? 'Active Now' : (sleepStatus?.last_sleep_hours ? `${sleepStatus.last_sleep_hours.toFixed(1)}h last` : 'Inactive')}
                  </div>
                </div>

                {/* Fasting */}
                <div onClick={() => handleToggle('fast')} className={`cursor-pointer rounded-[2rem] p-6 transition-all flex flex-col gap-4 group ${fastStatus?.is_fasting ? 'bg-orange-500/10' : 'bg-white/5 hover:bg-white/10'}`}>
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 font-semibold text-sm tracking-wide ${fastStatus?.is_fasting ? 'text-orange-400' : 'text-white/70'}`}>
                      <Zap className="w-4 h-4" /> Fast
                    </div>
                    <div className={`text-[10px] px-3 py-1 rounded-full font-medium ${fastStatus?.is_fasting ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/40'}`}>
                      {fastStatus?.is_fasting ? 'End' : 'Start'}
                    </div>
                  </div>
                  <div className="text-xs text-white/40 tracking-wide font-medium">
                    {fastStatus?.is_fasting ? fmtElapsed(fastStatus.elapsed_minutes) : (fastStatus?.last_fast_hours ? `${fastStatus.last_fast_hours.toFixed(1)}h last` : 'Inactive')}
                  </div>
                </div>
              </div>

              {/* Habits */}
              <div className="space-y-5 pt-2">
                <NonNegCheck
                  label="Physical Training (1hr)"
                  checked={nns['physical_training'] || false}
                  onChange={(checked) => handleHabitToggle('physical_training', checked)}
                />
                <NonNegCheck
                  label="No Sugar (Weekday)"
                  checked={nns['no_sugar'] || false}
                  onChange={(checked) => handleHabitToggle('no_sugar', checked)}
                />
              </div>

            </div>
          </section>

          {/* ======================= */}
          {/* 3. ELESIUM PILLAR       */}
          {/* ======================= */}
          <section className="bg-white/[0.02] rounded-[2.5rem] overflow-hidden animate-fade-up-delay-2 transition-colors hover:bg-white/[0.03]">
            <div className="p-8 md:p-10 pb-6 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-cyan-500/10 rounded-2xl text-cyan-400">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-light text-white tracking-wide">Elesium</h2>
                  <p className="text-xs text-cyan-400/60 tracking-wider mt-1 font-medium">Business Empire</p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/elesium')}
                className="px-5 py-2 bg-white/5 text-white/60 text-xs font-medium tracking-wide hover:bg-white/10 hover:text-white rounded-full transition-colors"
              >
                Workspace
              </button>
            </div>
            
            <div className="px-8 md:px-10 pb-10 space-y-8">
              
              {/* Flow State Tracker */}
              <div onClick={() => handleToggle('deepwork')} className={`cursor-pointer rounded-[2rem] p-6 transition-all flex items-center justify-between group ${deepwork?.is_active ? 'bg-cyan-500/10' : 'bg-white/5 hover:bg-white/10'}`}>
                <div className="flex items-center gap-5">
                  <div className={`p-3 rounded-2xl ${deepwork?.is_active ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/40'}`}>
                    <Timer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-semibold tracking-wide ${deepwork?.is_active ? 'text-cyan-400' : 'text-white/70'}`}>
                      Flow State
                    </h3>
                    <p className="text-xs text-white/40 tracking-wide mt-1 font-medium">
                      {deepwork?.is_active ? fmtElapsed(deepwork.elapsed_minutes) : (deepwork?.total_hours_today > 0 ? `${deepwork.total_hours_today.toFixed(1)}h today` : 'Inactive')}
                    </p>
                  </div>
                </div>
                <div className={`text-[10px] font-medium tracking-wide px-4 py-2 rounded-full transition-colors ${
                  deepwork?.is_active ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/40'
                }`}>
                  {deepwork?.is_active ? 'End' : 'Start'}
                </div>
              </div>

              {/* Habits */}
              <div className="space-y-5 pt-2">
                <NonNegCheck
                  label="4 Hours Deep Work"
                  checked={nns['deep_work_4hr'] || false}
                  onChange={(checked) => handleHabitToggle('deep_work_4hr', checked)}
                />
                <NonNegCheck
                  label="No Phone Before 8 AM"
                  checked={nns['no_phone_before_8'] || false}
                  onChange={(checked) => handleHabitToggle('no_phone_before_8', checked)}
                />
              </div>

            </div>
          </section>

          {/* ======================= */}
          {/* 4. INFLUENCE & INTELLECT*/}
          {/* ======================= */}
          <section className="bg-white/[0.02] rounded-[2.5rem] overflow-hidden animate-fade-up-delay-2 transition-colors hover:bg-white/[0.03]">
            <div className="p-8 md:p-10 pb-6 flex items-center gap-5">
              <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-400">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-light text-white tracking-wide">Influence</h2>
                <p className="text-xs text-purple-400/60 tracking-wider mt-1 font-medium">Intellect & Growth</p>
              </div>
            </div>
            
            <div className="px-8 md:px-10 pb-10 space-y-5">
              <NonNegCheck
                label="1 Hour Reading Before Bed"
                checked={nns['reading_1hr'] || false}
                onChange={(checked) => handleHabitToggle('reading_1hr', checked)}
              />
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
