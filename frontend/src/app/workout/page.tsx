'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  Dumbbell, 
  TrendingUp, 
  ArrowLeft, 
  Zap, 
  CheckCircle,
  Activity,
  X,
  Target
} from 'lucide-react';
import { DecryptedText } from '@/components/ui/DecryptedText';
import { triggerHaptic } from '@/lib/utils';
import { BodyHeatmap } from '@/components/ui/BodyHeatmap';

// Removed HOME_VARIANTS to support dynamic user protocols

export default function WorkoutDashboard() {
  const router = useRouter();
  const [todayData, setTodayData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Home Counters
  const [homeCounters, setHomeCounters] = useState<Record<string, number>>({});
  const [newProtocolName, setNewProtocolName] = useState('');

  // Function to hash a string to pick a dynamic premium color
  const getColorForProtocol = (name: string) => {
    // Better hash function to avoid collisions like 'pushups' and 'squats' both being blue
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    
    const colors = [
      { text: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-500/40', cardBg: 'bg-orange-500/5' },
      { text: 'text-sky-400', bg: 'bg-sky-400', border: 'border-sky-400/40', cardBg: 'bg-sky-400/5' },
      { text: 'text-emerald-400', bg: 'bg-emerald-400', border: 'border-emerald-400/40', cardBg: 'bg-emerald-400/5' },
      { text: 'text-purple-400', bg: 'bg-purple-400', border: 'border-purple-400/40', cardBg: 'bg-purple-400/5' },
      { text: 'text-pink-400', bg: 'bg-pink-400', border: 'border-pink-400/40', cardBg: 'bg-pink-400/5' },
      { text: 'text-yellow-400', bg: 'bg-yellow-400', border: 'border-yellow-400/40', cardBg: 'bg-yellow-400/5' },
      { text: 'text-red-400', bg: 'bg-red-400', border: 'border-red-400/40', cardBg: 'bg-red-400/5' }
    ];
    return colors[hash % colors.length];
  };

  const handleAddProtocol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProtocolName.trim()) return;
    const protocolId = newProtocolName.trim().toLowerCase();
    
    setHomeCounters(prev => {
      if (prev[protocolId] !== undefined) return prev;
      return { ...prev, [protocolId]: 0 };
    });
    setNewProtocolName('');
    triggerHaptic();
  };

  // Modal states for the 3D pop-ups
  const [activeModal, setActiveModal] = useState<'activation' | 'armor' | 'analysis' | null>(null);

  const heatmapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [today, hist, heatmap, homeToday] = await Promise.all([
        api.workout.today().catch(() => null),
        api.workout.history(10).catch(() => []),
        api.workout.heatmap(7).catch(() => ({})),
        api.workout.homeProtocol.today().catch(() => ({}))
      ]);
      setTodayData(today);
      setHistory(Array.isArray(hist) ? hist : []);
      setHeatmapData(heatmap);
      const cleanedHome = { ...homeToday };
      delete cleanedHome.date;
      delete cleanedHome._id;
      
      // If user has literally never used it, give them some defaults
      if (Object.keys(cleanedHome).length === 0) {
        setHomeCounters({ pushups: 0, pullups: 0, squats: 0, core: 0 });
      } else {
        setHomeCounters(cleanedHome);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTapVariant = (id: string) => {
    triggerHaptic('medium');
    // Optimistic update
    setHomeCounters(prev => ({ ...prev, [id]: prev[id] + 1 }));
    // Fire and forget background log
    api.workout.homeProtocol.increment(id, 1).catch(e => console.error("Failed to log protocol:", e));

    // Debounce heatmap refresh so it updates the telemetry UI after tapping
    if (heatmapTimeoutRef.current) clearTimeout(heatmapTimeoutRef.current);
    heatmapTimeoutRef.current = setTimeout(() => {
      api.workout.heatmap(7).then(setHeatmapData).catch(console.error);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center font-mono gap-6">
        <div className="scanline-overlay" />
        <div className="w-16 h-16 border border-vm-scarlet/20 border-t-vm-scarlet/80 rounded-full animate-spin" />
        <p className="text-text-dim text-xs tracking-[0.4em] animate-pulse">SYNCING...</p>
      </div>
    );
  }

  const isRestDay = todayData?.workout?.is_rest_day ?? true;
  const isLogged = todayData?.logged ?? false;

  return (
    <div className="min-h-screen bg-obsidian text-gray-300 font-mono relative overflow-x-hidden no-select pb-40">
      <div className="scanline-overlay pointer-events-none z-50" />

      {/* Floating Header with Blur Backdrop */}
      <header className="fixed top-0 left-0 right-0 p-6 pt-safe pb-6 z-40 flex justify-between items-center pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-obsidian/90 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 pointer-events-auto relative z-10">
          <button
            onClick={() => { triggerHaptic(); router.push('/home'); }}
            className="w-10 h-10 rounded-full bg-surface border border-surface2 text-text-dim hover:text-vm-scarlet flex items-center justify-center transition-colors shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm md:text-base font-heading text-vm-scarlet tracking-[0.3em] drop-shadow-[0_0_12px_rgba(244,63,94,0.3)]">
              <DecryptedText text="PHYSICAL_TRAINING" animateOnHover={true} />
            </h1>
          </div>
        </div>
      </header>

      {/* 1. TOP SECTION: MASSIVE INITIATION BUTTON */}
      <div className="w-full flex flex-col items-center justify-center relative px-6 pt-40 pb-10 min-h-[45vh]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.05)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="z-10 flex flex-col items-center gap-8 w-full max-w-sm mt-4">
          {isLogged ? (
            <div className="flex flex-col items-center text-center gap-6 w-full">
              <div className="group relative w-full max-w-[240px] aspect-square rounded-full border border-emerald-500/30 flex flex-col items-center justify-center gap-4 transition-all duration-500 hover:border-emerald-500 hover:shadow-[0_0_50px_rgba(16,185,129,0.2)] bg-obsidian">
                <div className="absolute inset-2 rounded-full border border-emerald-500/10" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_60%)] rounded-full" />
                <CheckCircle className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]" />
                <span className="font-heading text-xl tracking-[0.3em] text-white">
                  LOGGED
                </span>
                <p className="text-[9px] text-emerald-400 tracking-widest absolute bottom-10 font-bold uppercase">
                  SESSION COMPLETE
                </p>
              </div>
              <button
                onClick={() => { triggerHaptic(); router.push('/workout/session'); }}
                className="mt-2 px-8 py-4 bg-surface border border-emerald-500/30 text-emerald-400 font-bold tracking-[0.2em] transition-all hover:bg-emerald-500/10 hover:border-emerald-500 rounded-sm w-full max-w-[240px] shadow-lg text-[10px]"
              >
                EDIT SESSION
              </button>
            </div>
          ) : (
            <button
              onClick={() => { triggerHaptic('heavy'); router.push('/workout/session?start=true'); }}
              className="group relative w-full max-w-[240px] aspect-square rounded-full border border-vm-scarlet/30 flex flex-col items-center justify-center gap-4 transition-all duration-500 hover:scale-105 hover:border-vm-scarlet hover:shadow-[0_0_50px_rgba(244,63,94,0.3)]"
              style={{ backgroundColor: 'var(--color-obsidian)' }}
            >
              <div className="absolute inset-2 rounded-full border border-vm-scarlet/10" />
              <Dumbbell className="w-16 h-16 text-vm-scarlet drop-shadow-[0_0_20px_rgba(244,63,94,0.6)] group-hover:scale-110 transition-transform duration-500" />
              <span className="font-heading text-xl tracking-[0.3em] text-white">
                {isRestDay ? 'OVERRIDE' : 'INITIATE'}
              </span>
              <p className="text-[9px] text-vm-scarlet tracking-widest absolute bottom-10 font-bold uppercase">
                {isRestDay ? 'REST DAY' : 'SESSION REQUIRED'}
              </p>
            </button>
          )}
        </div>
      </div>

      <div className="px-6 max-w-md mx-auto space-y-10">

        {/* 2. HOME WORKOUTS (FATIGUE MIGRATION) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] tracking-[0.3em] text-text-dim uppercase font-bold flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" />
              HOME PROTOCOLS
            </h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(homeCounters).map(([id, count]) => {
              const { text, bg, border, cardBg } = getColorForProtocol(id);
              const progress = Math.min((count / 100) * 100, 100);
              return (
                <button
                  key={id}
                  onClick={() => handleTapVariant(id)}
                  className={`relative overflow-hidden ${cardBg} border ${border} hover:border-white/40 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all active:scale-95 shadow-lg group backdrop-blur-sm`}
                >
                  <div className="absolute left-0 bottom-0 top-0 w-1.5 bg-black/40" />
                  <div className={`absolute left-0 bottom-0 w-1.5 transition-all duration-300 ${bg}`} style={{ height: `${progress}%` }} />
                  
                  <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />

                  <span className={`text-4xl font-black ${count > 0 ? 'text-white' : 'text-white/40'} tracking-tighter drop-shadow-md relative z-10 group-active:scale-110 transition-transform`}>
                    {count}
                  </span>
                  <div className="flex flex-col items-center relative z-10 text-center w-full">
                    <span className={`text-[10px] font-bold tracking-[0.25em] ${text} uppercase leading-tight`}>
                      {id.replace(/_/g, ' ')}
                    </span>
                    {count === 0 && (
                      <span className="text-[8px] text-white/30 tracking-widest uppercase mt-1">TAP TO LOG</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleAddProtocol} className="mt-6 flex gap-2 w-full relative z-20">
            <input 
              type="text" 
              placeholder="Type custom exercise..." 
              className="flex-1 bg-surface border border-surface2 rounded-xl px-5 py-4 text-[11px] tracking-widest text-white uppercase font-mono focus:outline-none focus:border-vm-scarlet/50 shadow-inner"
              value={newProtocolName}
              onChange={e => setNewProtocolName(e.target.value)}
            />
            <button type="submit" className="bg-vm-scarlet/10 text-vm-scarlet border border-vm-scarlet/30 px-6 rounded-xl text-[11px] font-bold tracking-widest uppercase hover:bg-vm-scarlet hover:text-white hover:border-vm-scarlet transition-all shadow-lg active:scale-95">
              ADD
            </button>
          </form>
        </section>

        {/* 3. SYSTEM TELEMETRY WIDGETS */}
        <section className="space-y-4">
          <h3 className="text-[10px] tracking-[0.3em] text-text-dim uppercase font-bold mb-4">
            SYSTEM TELEMETRY
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Activation Widget */}
            <button
              onClick={() => { triggerHaptic(); setActiveModal('activation'); }}
              className="bg-surface border border-surface2 hover:border-sky-500/50 p-5 rounded-xl flex flex-col items-center justify-center text-center gap-3 transition-all hover:bg-sky-500/5 shadow-lg group"
            >
              <Activity className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform" />
              <h4 className="text-[11px] font-bold text-sky-400 tracking-[0.15em] uppercase">
                ACTIVATION
              </h4>
              <p className="text-[9px] text-text-dim tracking-widest uppercase font-mono">
                TODAY'S LOAD
              </p>
            </button>

            {/* Armor Widget */}
            <button
              onClick={() => { triggerHaptic(); setActiveModal('armor'); }}
              className="bg-surface border border-surface2 hover:border-emerald-500/50 p-5 rounded-xl flex flex-col items-center justify-center text-center gap-3 transition-all hover:bg-emerald-500/5 shadow-lg group"
            >
              <Zap className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
              <h4 className="text-[11px] font-bold text-emerald-400 tracking-[0.15em] uppercase">
                ARMOR
              </h4>
              <p className="text-[9px] text-text-dim tracking-widest uppercase font-mono">
                7-DAY INTEGRITY
              </p>
            </button>
          </div>

          {/* System Analysis Widget */}
          <button
            onClick={() => { triggerHaptic(); setActiveModal('analysis'); }}
            className="w-full mt-4 bg-surface border border-surface2 hover:border-white/20 p-5 rounded-xl flex items-center justify-between transition-all hover:bg-white/5 shadow-lg group"
          >
            <div className="flex items-center gap-4">
              <TrendingUp className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold text-white tracking-[0.15em] uppercase">
                  SYSTEM ANALYSIS
                </span>
                <span className="text-[9px] text-text-dim tracking-widest uppercase font-mono">
                  CNS STATUS & DATA LOGS
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full border border-surface2 flex items-center justify-center text-[10px] font-mono group-hover:border-white/20">
              {'>>'}
            </div>
          </button>
        </section>

      </div>

      {/* 4. POP-UP MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-obsidian animate-in slide-in-from-bottom-8 duration-300 h-[100dvh] overflow-hidden flex flex-col">
          
            {/* Modal Header */}
            <div className="flex-none bg-obsidian border-b border-surface2 p-6 pt-safe-top flex justify-between items-center z-10">
              <h2 className={`font-heading text-lg tracking-[0.2em] uppercase ${
                activeModal === 'activation' ? 'text-sky-400' :
                activeModal === 'armor' ? 'text-emerald-400' : 'text-white'
              }`}>
                {activeModal === 'activation' && 'DAILY ACTIVATION'}
                {activeModal === 'armor' && 'STRUCTURAL ARMOR'}
                {activeModal === 'analysis' && 'SYSTEM ANALYSIS'}
              </h2>
              <button 
                onClick={() => { triggerHaptic(); setActiveModal(null); }}
                className="w-8 h-8 rounded-full bg-surface border border-surface2 flex items-center justify-center text-text-dim hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden relative p-4 sm:p-6 flex flex-col">
              {activeModal === 'activation' && (
                <div className="w-full h-full flex flex-col">
                  <div className="flex-1 min-h-0 relative">
                    <BodyHeatmap data={heatmapData?.activation || {}} mode="activation" />
                  </div>
                </div>
              )}

              {activeModal === 'armor' && (
                <div className="w-full h-full flex flex-col">
                  <div className="flex-1 min-h-0 relative">
                    <BodyHeatmap data={heatmapData?.armor || {}} mode="armor" />
                  </div>
                </div>
              )}

              {activeModal === 'analysis' && (
                <div className="w-full space-y-8">
                  {/* CNS Status Box */}
                  <div className="border border-surface2 bg-surface p-6 rounded-xl text-center">
                    {(() => {
                      if (history.length === 0) return (
                        <p className="text-[10px] text-text-dim tracking-widest uppercase font-mono leading-loose">
                          INSUFFICIENT DATA. LOG SESSIONS TO CALIBRATE.
                        </p>
                      );
                      
                      const totalWorkouts = history.length;
                      const totalDuration = history.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
                      const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;
                      
                      if (avgDuration > 90) {
                        return (
                          <>
                            <p className="text-[12px] text-vm-red tracking-[0.2em] uppercase font-heading font-bold mb-2 drop-shadow-[0_0_8px_rgba(255,0,0,0.5)]">
                              CNS FATIGUE WARNING
                            </p>
                            <p className="text-[10px] text-gray-300 tracking-[0.1em] font-mono leading-relaxed">
                              AVG DURATION DETECTED: {avgDuration}M. PRIORITIZE SLEEP AND NUTRITION.
                            </p>
                          </>
                        );
                      } else if (totalWorkouts >= 4) {
                        return (
                          <>
                            <p className="text-[12px] text-vm-scarlet tracking-[0.2em] uppercase font-heading font-bold mb-2">
                              CONSISTENCY OPTIMAL
                            </p>
                            <p className="text-[10px] text-gray-300 tracking-[0.1em] font-mono leading-relaxed">
                              {totalWorkouts} RECENT SESSIONS. MUSCLE PROTEIN SYNTHESIS MAXIMIZED.
                            </p>
                          </>
                        );
                      } else {
                        return (
                          <>
                            <p className="text-[12px] text-white tracking-[0.2em] uppercase font-heading font-bold mb-2">
                              MODERATE LOAD
                            </p>
                            <p className="text-[10px] text-gray-400 tracking-[0.1em] font-mono leading-relaxed">
                              SYSTEM READY FOR PROGRESSIVE OVERLOAD.
                            </p>
                          </>
                        );
                      }
                    })()}
                  </div>

                  <button 
                    onClick={() => { triggerHaptic(); router.push('/workout/progress'); }}
                    className="w-full p-4 border border-vm-scarlet/50 bg-vm-scarlet/10 hover:bg-vm-scarlet/20 transition-all flex items-center justify-center gap-3 rounded-xl font-bold tracking-[0.2em] text-vm-scarlet text-[10px]"
                  >
                    <TrendingUp className="w-4 h-4" />
                    VIEW HISTORICAL DATA
                  </button>
                </div>
              )}
            </div>
        </div>
      )}
    </div>
  );
}
