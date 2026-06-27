'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
  Target,
  Trash2,
  Plus,
  Minus,
  GripVertical,
  Flame,
} from 'lucide-react';
import { Reorder, useDragControls, AnimatePresence, motion } from 'framer-motion';
import { DecryptedText } from '@/components/ui/DecryptedText';
import { triggerHaptic } from '@/lib/utils';
import { BodyHeatmap } from '@/components/ui/BodyHeatmap';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import { getMusclesForExercise } from '@/lib/exerciseDatabase';

// Display labels for muscles
const MUSCLE_DISPLAY_LABELS: Record<string, string> = {
  chest: 'CHEST', biceps: 'BICEPS', triceps: 'TRICEPS',
  abs: 'CORE', obliques: 'OBLIQUES', 'upper-back': 'LATS',
  'lower-back': 'LOWER BACK', 'front-deltoids': 'FRONT DELTS',
  'back-deltoids': 'REAR DELTS', quadriceps: 'QUADS',
  hamstring: 'HAMSTRINGS', calves: 'CALVES', gluteal: 'GLUTES',
  trapezius: 'TRAPS', forearms: 'FOREARMS', forearm: 'FOREARMS',
  'lower_back': 'LOWER BACK',
};

// Burst state: muscle → expiry timestamp ms
type BurstState = Record<string, number>;
const BURST_DURATION_MS = 2000;

// ─── Protocol Card ─────────────────────────────────────────────────────────────
function ProtocolCard({ id, count, getColorForProtocol, onIncrement, onDecrement, onLongPress }: any) {
  const controls = useDragControls();
  const { text, bg, border, cardBg } = getColorForProtocol(id);

  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startPress = () => { pressTimerRef.current = setTimeout(() => onLongPress(id), 500); };
  const endPress = () => { if (pressTimerRef.current) clearTimeout(pressTimerRef.current); };

  return (
    <Reorder.Item
      value={id}
      id={id}
      dragListener={false}
      dragControls={controls}
      className={`relative overflow-hidden ${cardBg} border ${border} rounded-xl shadow-lg group backdrop-blur-sm flex items-stretch select-none`}
    >
      <div className={`absolute left-0 bottom-0 top-0 w-1 transition-all duration-300 ${bg}`} />

      <button
        onClick={() => onDecrement(id)}
        className="w-16 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors border-r border-white/5 relative z-10"
      >
        <Minus className="w-5 h-5" />
      </button>

      <div
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onContextMenu={(e) => e.preventDefault()}
        className="flex-1 flex flex-col justify-center items-center py-4 cursor-pointer relative z-10 touch-none"
      >
        <span className={`text-3xl font-black ${count > 0 ? 'text-white' : 'text-white/40'} tracking-tighter drop-shadow-md`}>
          {count}
        </span>
        <span className={`text-[10px] font-bold tracking-[0.25em] ${text} uppercase leading-tight mt-1`}>
          {id.replace(/_/g, ' ')}
        </span>
      </div>

      <button
        onClick={() => onIncrement(id)}
        className="w-16 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors border-l border-white/5 relative z-10"
      >
        <Plus className="w-5 h-5" />
      </button>

      <div
        onPointerDown={(e) => controls.start(e)}
        className="w-12 flex items-center justify-center text-white/20 hover:text-white cursor-grab active:cursor-grabbing bg-black/20 relative z-10 touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </div>
    </Reorder.Item>
  );
}

// ─── Floating Rep Chip ─────────────────────────────────────────────────────────
type RepChip = { id: string; muscles: string[]; x: number; y: number };

// ─── Main Dashboard ─────────────────────────────────────────────────────────────
export default function WorkoutDashboard() {
  const router = useRouter();
  const [todayData, setTodayData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Home Counters
  const [homeCounters, setHomeCounters] = useState<Record<string, number>>({});
  const [protocolOrder, setProtocolOrder] = useState<string[]>([]);
  const [newProtocolName, setNewProtocolName] = useState('');

  // ─── Live Muscle Burst State ────────────────────────────────────────────────
  const [burstState, setBurstState] = useState<BurstState>({});
  const burstCleanupRef = useRef<NodeJS.Timeout | null>(null);

  // Rep float chips
  const [repChips, setRepChips] = useState<RepChip[]>([]);
  const chipIdRef = useRef(0);

  // Refresh liveBurstMuscles every 150ms while a burst is active
  const [tick, forceUpdate] = useState(0);

  // Compute live burst muscles (only those not yet expired)
  const liveBurstMuscles = useMemo<Record<string, number>>(() => {
    const now = Date.now();
    const result: Record<string, number> = {};
    for (const [muscle, expiry] of Object.entries(burstState)) {
      const remaining = expiry - now;
      if (remaining > 0) {
        // Intensity fades from 100 down to 20 over burst duration
        const ratio = remaining / BURST_DURATION_MS;
        result[muscle] = Math.round(20 + ratio * 80);
      }
    }
    return result;
  }, [burstState, tick]);

  // Active muscles for chip strip (any with >10 intensity from burst or counters)
  const activeMusclesToday = useMemo<string[]>(() => {
    const active = new Set<string>();
    // From burst
    for (const muscle of Object.keys(liveBurstMuscles)) active.add(muscle);
    // From counter-derived heatmap (7-day server data)
    const activation = heatmapData?.activation || {};
    for (const [muscle, score] of Object.entries(activation)) {
      if ((score as number) > 5) active.add(muscle);
    }
    return Array.from(active).slice(0, 8);
  }, [liveBurstMuscles, heatmapData]);

  const fireBurst = useCallback((exerciseId: string) => {
    const muscles = getMusclesForExercise(exerciseId);
    if (!muscles) return;

    const expiry = Date.now() + BURST_DURATION_MS;
    setBurstState(prev => {
      const next = { ...prev };
      for (const muscle of Object.keys(muscles)) {
        next[muscle] = expiry;
      }
      return next;
    });

    // Schedule cleanup after burst expires
    if (burstCleanupRef.current) clearTimeout(burstCleanupRef.current);
    burstCleanupRef.current = setTimeout(() => {
      setBurstState({});
    }, BURST_DURATION_MS + 100);
  }, []);

  const rafRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (Object.keys(burstState).length === 0) return;
    const id = setInterval(() => forceUpdate(n => n + 1), 150);
    return () => clearInterval(id);
  }, [burstState]);

  // Color per protocol
  const getColorForProtocol = (name: string) => {
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
    setProtocolOrder(prev => {
      if (prev.includes(protocolId)) return prev;
      return [...prev, protocolId];
    });
    setNewProtocolName('');
    triggerHaptic();
  };

  const [renameProtocolModal, setRenameProtocolModal] = useState<{ open: boolean; oldName: string; newName: string }>({ open: false, oldName: '', newName: '' });

  const handleDeleteProtocol = async (id: string) => {
    triggerHaptic('heavy');
    setHomeCounters(prev => { const next = { ...prev }; delete next[id]; return next; });
    setProtocolOrder(prev => prev.filter(p => p !== id));
    setRenameProtocolModal({ open: false, oldName: '', newName: '' });
    const now = new Date();
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    try { await api.workout.homeProtocol.delete(id, localDate); } catch (e) { console.error('Failed to delete protocol', e); }
  };

  const submitRenameProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameProtocolModal.newName.trim() || renameProtocolModal.newName.trim() === renameProtocolModal.oldName) {
      setRenameProtocolModal({ open: false, oldName: '', newName: '' });
      return;
    }
    const oldId = renameProtocolModal.oldName;
    const newId = renameProtocolModal.newName.trim().toLowerCase();
    setHomeCounters(prev => { const next = { ...prev }; next[newId] = next[oldId]; delete next[oldId]; return next; });
    setProtocolOrder(prev => prev.map(p => p === oldId ? newId : p));
    setRenameProtocolModal({ open: false, oldName: '', newName: '' });
    triggerHaptic();
    const now = new Date();
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    try { await api.workout.homeProtocol.rename(oldId, newId, localDate); } catch (err) { console.error('Failed to rename protocol', err); }
  };

  // Modal states for analysis pop-up
  const [activeModal, setActiveModal] = useState<'activation' | 'armor' | 'analysis' | null>(null);
  const heatmapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Graph Data state
  const [graphData, setGraphData] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get current local date YYYY-MM-DD
      const now = new Date();
      const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

      const [today, hist, heatmap, homeToday, graph] = await Promise.all([
        api.workout.today().catch(() => null),
        api.workout.history(10).catch(() => []),
        api.workout.heatmap(7, localDate).catch(() => ({})),
        api.workout.homeProtocol.today(localDate).catch(() => ({})),
        api.workout.graph(14, localDate).catch(() => ([]))
      ]);
      setTodayData(today);
      setHistory(Array.isArray(hist) ? hist : []);
      setHeatmapData(heatmap);
      setGraphData(Array.isArray(graph) ? graph : []);
      const cleanedHome = { ...homeToday };
      delete cleanedHome.date;
      delete cleanedHome._id;
      const serverOrder = cleanedHome._order;
      delete cleanedHome._order;

      if (Object.keys(cleanedHome).length === 0) {
        setHomeCounters({ pushups: 0, pullups: 0, squats: 0, core: 0 });
        setProtocolOrder(['pushups', 'pullups', 'squats', 'core']);
      } else {
        setHomeCounters(cleanedHome);
        if (serverOrder && Array.isArray(serverOrder)) {
          const keys = Object.keys(cleanedHome);
          const newOrder = [...serverOrder.filter((k: string) => keys.includes(k)), ...keys.filter(k => !serverOrder.includes(k))];
          setProtocolOrder(newOrder);
        } else {
          setProtocolOrder(Object.keys(cleanedHome));
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleTapVariant = (id: string) => {
    triggerHaptic('medium');
    const now = new Date();
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    setHomeCounters(prev => ({ ...prev, [id]: prev[id] + 1 }));
    api.workout.homeProtocol.increment(id, 1, localDate).catch(e => console.error('Failed to log protocol:', e));

    // 🔥 Fire live muscle burst
    fireBurst(id);

    // Debounced server heatmap refresh
    if (heatmapTimeoutRef.current) clearTimeout(heatmapTimeoutRef.current);
    heatmapTimeoutRef.current = setTimeout(() => {
      api.workout.heatmap(7).then(setHeatmapData).catch(console.error);
    }, 1500);
  };

  const handleDecrementProtocol = (id: string) => {
    triggerHaptic('medium');
    setHomeCounters(prev => ({ ...prev, [id]: Math.max(0, prev[id] - 1) }));
    const now = new Date();
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    api.workout.homeProtocol.decrement(id, 1, localDate).catch(e => console.error('Failed to decrease protocol:', e));
    
    if (heatmapTimeoutRef.current) clearTimeout(heatmapTimeoutRef.current);
    heatmapTimeoutRef.current = setTimeout(() => {
      api.workout.heatmap(7).then(setHeatmapData).catch(console.error);
    }, 1500);
  };

  const handleReorder = (newOrder: string[]) => {
    setProtocolOrder(newOrder);
    triggerHaptic('light');
    const now = new Date();
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    api.workout.homeProtocol.reorder(newOrder, localDate).catch(console.error);
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────
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
  const hasBurstActive = Object.keys(liveBurstMuscles).length > 0;

  return (
    <div className="min-h-screen bg-obsidian text-gray-300 font-mono relative overflow-x-hidden no-select pb-40">
      <div className="scanline-overlay pointer-events-none z-50" />

      {/* ── CSS for burst glow ring ── */}
      <style>{`
        @keyframes glowPulse {
          0%   { box-shadow: 0 0 0px rgba(244,63,94,0); }
          30%  { box-shadow: 0 0 30px rgba(244,63,94,0.4), 0 0 60px rgba(244,63,94,0.2); }
          100% { box-shadow: 0 0 10px rgba(244,63,94,0.1); }
        }
        @keyframes chipFade {
          0%   { opacity: 0; transform: translateY(4px) scale(0.9); }
          15%  { opacity: 1; transform: translateY(0) scale(1); }
          80%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(-8px) scale(0.95); }
        }
        @keyframes bodyGlowPulse {
          0%   { filter: drop-shadow(0 0 0px rgba(244,63,94,0)); }
          35%  { filter: drop-shadow(0 0 20px rgba(244,63,94,0.6)); }
          100% { filter: drop-shadow(0 0 4px rgba(244,63,94,0.15)); }
        }
        .burst-ring { animation: glowPulse 2s ease-out; }
        .burst-body { animation: bodyGlowPulse 2s ease-out; }
        .chip-anim  { animation: chipFade 2.5s ease-out forwards; }
      `}</style>

      {/* ── Floating Header ── */}
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

      {/* ── 1. INITIATE BUTTON ── */}
      <div className="w-full flex flex-col items-center justify-center relative px-6 pt-32 pb-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.04)_0%,transparent_70%)] pointer-events-none" />
        <div className="z-10 flex flex-col items-center gap-6 w-full max-w-sm">
          {isLogged ? (
            <div className="flex flex-col items-center text-center gap-4 w-full">
              <div className="group relative w-[180px] h-[180px] rounded-full border border-emerald-500/30 flex flex-col items-center justify-center gap-3 transition-all duration-500 hover:border-emerald-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.2)] bg-obsidian">
                <div className="absolute inset-2 rounded-full border border-emerald-500/10" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_60%)] rounded-full" />
                <CheckCircle className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
                <span className="font-heading text-base tracking-[0.3em] text-white">LOGGED</span>
                <p className="text-[8px] text-emerald-400 tracking-widest absolute bottom-8 font-bold uppercase">SESSION COMPLETE</p>
              </div>
              <button
                onClick={() => { triggerHaptic(); router.push('/workout/session'); }}
                className="px-8 py-3 bg-surface border border-emerald-500/30 text-emerald-400 font-bold tracking-[0.2em] transition-all hover:bg-emerald-500/10 hover:border-emerald-500 rounded-sm w-full max-w-[200px] shadow-lg text-[10px]"
              >
                EDIT SESSION
              </button>
            </div>
          ) : (
            <button
              onClick={() => { triggerHaptic('heavy'); router.push('/workout/session?start=true'); }}
              className="group relative w-[180px] h-[180px] rounded-full border border-vm-scarlet/30 flex flex-col items-center justify-center gap-3 transition-all duration-500 hover:scale-105 hover:border-vm-scarlet hover:shadow-[0_0_50px_rgba(244,63,94,0.3)]"
              style={{ backgroundColor: 'var(--color-obsidian)' }}
            >
              <div className="absolute inset-2 rounded-full border border-vm-scarlet/10" />
              <Dumbbell className="w-12 h-12 text-vm-scarlet drop-shadow-[0_0_16px_rgba(244,63,94,0.6)] group-hover:scale-110 transition-transform duration-500" />
              <span className="font-heading text-base tracking-[0.3em] text-white">
                {isRestDay ? 'OVERRIDE' : 'INITIATE'}
              </span>
              <p className="text-[8px] text-vm-scarlet tracking-widest absolute bottom-8 font-bold uppercase">
                {isRestDay ? 'REST DAY' : 'SESSION REQUIRED'}
              </p>
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ── 2. LIVE MUSCLE ACTIVATION PANEL ──────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="px-6 max-w-md mx-auto mt-4">
        <section
          className={`relative border rounded-2xl overflow-hidden transition-all duration-500 ${
            hasBurstActive
              ? 'border-vm-scarlet/60 bg-vm-scarlet/3 shadow-[0_0_40px_rgba(244,63,94,0.15)]'
              : 'border-surface2 bg-surface/50'
          }`}
          style={hasBurstActive ? { boxShadow: '0 0 40px rgba(244,63,94,0.12), inset 0 0 60px rgba(244,63,94,0.03)' } : {}}
        >
          {/* Header row */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <Flame
                className={`w-4 h-4 transition-all duration-300 ${
                  hasBurstActive
                    ? 'text-vm-scarlet drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]'
                    : 'text-text-dim'
                }`}
              />
              <h3 className={`text-[10px] tracking-[0.3em] uppercase font-bold transition-colors duration-300 ${
                hasBurstActive ? 'text-vm-scarlet' : 'text-text-dim'
              }`}>
                MUSCLE ACTIVATION
              </h3>
            </div>
            {hasBurstActive && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-vm-scarlet animate-pulse shadow-[0_0_6px_rgba(244,63,94,0.9)]" />
                <span className="text-[8px] tracking-widest text-vm-scarlet font-bold uppercase">LIVE</span>
              </div>
            )}
            {!hasBurstActive && (
              <span className="text-[8px] tracking-widest text-text-dim/50 uppercase">
                TAP A PROTOCOL
              </span>
            )}
          </div>

          {/* Active muscle chip strip */}
          <div className="px-5 pb-3 min-h-[32px]">
            <AnimatePresence>
              {activeMusclesToday.length > 0 ? (
                <motion.div
                  key="chips"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-wrap gap-1.5"
                >
                  {activeMusclesToday.map((muscle) => {
                    const isBursting = liveBurstMuscles[muscle] !== undefined;
                    const label = MUSCLE_DISPLAY_LABELS[muscle] || muscle.toUpperCase();
                    return (
                      <motion.span
                        key={muscle}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`px-2.5 py-1 rounded-full text-[8px] font-bold tracking-widest uppercase border transition-all duration-300 ${
                          isBursting
                            ? 'bg-vm-scarlet/20 border-vm-scarlet/60 text-vm-scarlet shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                            : 'bg-white/5 border-white/10 text-white/50'
                        }`}
                      >
                        {label}
                      </motion.span>
                    );
                  })}
                </motion.div>
              ) : (
                <p className="text-[9px] text-text-dim/40 tracking-widest uppercase">
                  No active muscles — start a protocol
                </p>
              )}
            </AnimatePresence>
          </div>

          {/* Body SVG */}
          <div className={`w-full px-2 pb-4 transition-all duration-500 ${hasBurstActive ? 'burst-body' : ''}`}>
            <BodyHeatmap
              data={heatmapData?.activation || {}}
              burstMuscles={liveBurstMuscles}
              mode="live"
              compact={true}
              className=""
            />
          </div>

          {/* Hint text */}
          <div className="px-5 pb-4 flex items-center justify-center gap-2">
            <div className="flex-1 h-px bg-surface2" />
            <span className="text-[8px] tracking-widest text-text-dim/30 uppercase px-2">
              {hasBurstActive ? 'muscles engaged' : 'tap to illuminate'}
            </span>
            <div className="flex-1 h-px bg-surface2" />
          </div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="px-6 max-w-md mx-auto space-y-10 mt-10">

        {/* ── 3. HOME PROTOCOLS ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] tracking-[0.3em] text-text-dim uppercase font-bold flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" />
              HOME PROTOCOLS
            </h3>
          </div>

          <Reorder.Group
            axis="y"
            values={protocolOrder}
            onReorder={handleReorder}
            className="flex flex-col gap-3"
          >
            {protocolOrder.map((id) => {
              const count = homeCounters[id] || 0;
              return (
                <ProtocolCard
                  key={id}
                  id={id}
                  count={count}
                  getColorForProtocol={getColorForProtocol}
                  onIncrement={handleTapVariant}
                  onDecrement={handleDecrementProtocol}
                  onLongPress={(targetId: string) => {
                    triggerHaptic('heavy');
                    setRenameProtocolModal({ open: true, oldName: targetId, newName: targetId.replace(/_/g, ' ') });
                  }}
                />
              );
            })}
          </Reorder.Group>

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

        {/* ── 4. EXERCISE INTENSITY GRAPH ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-4 mt-8">
            <h3 className="text-[10px] tracking-[0.3em] text-text-dim uppercase font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-vm-scarlet" />
              INTENSITY TRACKER
            </h3>
          </div>
          
          <div className="bg-surface border border-surface2 rounded-2xl p-4 h-[300px] w-full relative">
            {graphData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-text-dim text-xs tracking-widest">NO DATA YET</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: -10, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis 
                    dataKey="date" 
                    type="category" 
                    tick={{ fill: '#888', fontSize: 10 }}
                    axisLine={{ stroke: '#ffffff20' }}
                  />
                  <YAxis 
                    dataKey="exercise" 
                    type="category" 
                    tick={{ fill: '#888', fontSize: 10 }}
                    axisLine={{ stroke: '#ffffff20' }}
                    width={80}
                  />
                  <ZAxis dataKey="volume" range={[20, 800]} name="Volume" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3', stroke: '#ffffff20' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-surface border border-vm-scarlet/30 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                            <p className="text-white text-xs font-bold uppercase tracking-widest mb-1">{data.exercise}</p>
                            <p className="text-text-dim text-[10px] uppercase mb-2">{data.date}</p>
                            <p className="text-vm-scarlet text-[11px] font-mono font-bold">Vol: {Math.round(data.volume)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter 
                    data={graphData} 
                    fill="#FF3333" 
                    fillOpacity={0.6}
                    stroke="#FF3333"
                    strokeWidth={1}
                    shape="circle"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* ── 4. SYSTEM TELEMETRY WIDGETS ── */}
        <section className="space-y-4">
          <h3 className="text-[10px] tracking-[0.3em] text-text-dim uppercase font-bold mb-4">
            SYSTEM TELEMETRY
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Activation — now opens full modal with server 7-day data */}
            <button
              onClick={() => { triggerHaptic(); setActiveModal('activation'); }}
              className="bg-surface border border-surface2 hover:border-sky-500/50 p-5 rounded-xl flex flex-col items-center justify-center text-center gap-3 transition-all hover:bg-sky-500/5 shadow-lg group"
            >
              <Activity className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform" />
              <h4 className="text-[11px] font-bold text-sky-400 tracking-[0.15em] uppercase">ACTIVATION</h4>
              <p className="text-[9px] text-text-dim tracking-widest uppercase font-mono">7-DAY MAP</p>
            </button>

            {/* Armor */}
            <button
              onClick={() => { triggerHaptic(); setActiveModal('armor'); }}
              className="bg-surface border border-surface2 hover:border-emerald-500/50 p-5 rounded-xl flex flex-col items-center justify-center text-center gap-3 transition-all hover:bg-emerald-500/5 shadow-lg group"
            >
              <Zap className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
              <h4 className="text-[11px] font-bold text-emerald-400 tracking-[0.15em] uppercase">ARMOR</h4>
              <p className="text-[9px] text-text-dim tracking-widest uppercase font-mono">7-DAY INTEGRITY</p>
            </button>
          </div>

          {/* System Analysis */}
          <button
            onClick={() => { triggerHaptic(); setActiveModal('analysis'); }}
            className="w-full mt-4 bg-surface border border-surface2 hover:border-white/20 p-5 rounded-xl flex items-center justify-between transition-all hover:bg-white/5 shadow-lg group"
          >
            <div className="flex items-center gap-4">
              <TrendingUp className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold text-white tracking-[0.15em] uppercase">SYSTEM ANALYSIS</span>
                <span className="text-[9px] text-text-dim tracking-widest uppercase font-mono">CNS STATUS & DATA LOGS</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full border border-surface2 flex items-center justify-center text-[10px] font-mono group-hover:border-white/20">
              {'>>'}
            </div>
          </button>
        </section>

      </div>

      {/* ── 5. POP-UP MODALS (full 7-day heatmap) ── */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-obsidian animate-in slide-in-from-bottom-8 duration-300 h-[100dvh] overflow-hidden flex flex-col">
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

                    if (avgDuration > 90) return (
                      <>
                        <p className="text-[12px] text-vm-red tracking-[0.2em] uppercase font-heading font-bold mb-2 drop-shadow-[0_0_8px_rgba(255,0,0,0.5)]">CNS FATIGUE WARNING</p>
                        <p className="text-[10px] text-gray-300 tracking-[0.1em] font-mono leading-relaxed">AVG DURATION DETECTED: {avgDuration}M. PRIORITIZE SLEEP AND NUTRITION.</p>
                      </>
                    );
                    if (totalWorkouts >= 4) return (
                      <>
                        <p className="text-[12px] text-vm-scarlet tracking-[0.2em] uppercase font-heading font-bold mb-2">CONSISTENCY OPTIMAL</p>
                        <p className="text-[10px] text-gray-300 tracking-[0.1em] font-mono leading-relaxed">{totalWorkouts} RECENT SESSIONS. MUSCLE PROTEIN SYNTHESIS MAXIMIZED.</p>
                      </>
                    );
                    return (
                      <>
                        <p className="text-[12px] text-white tracking-[0.2em] uppercase font-heading font-bold mb-2">MODERATE LOAD</p>
                        <p className="text-[10px] text-gray-400 tracking-[0.1em] font-mono leading-relaxed">SYSTEM READY FOR PROGRESSIVE OVERLOAD.</p>
                      </>
                    );
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

      {/* ── Rename Protocol Modal ── */}
      {renameProtocolModal.open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-sm flex flex-col items-center text-center">
            <h2 className="text-[10px] text-white tracking-[0.4em] uppercase mb-8">RENAME PROTOCOL</h2>
            <form onSubmit={submitRenameProtocol} className="w-full relative">
              <input
                type="text"
                className="w-full h-16 bg-surface border-2 border-surface2 rounded-2xl text-center text-white text-xl tracking-[0.2em] font-heading focus:outline-none focus:border-vm-scarlet/50 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                autoFocus
                value={renameProtocolModal.newName}
                onChange={e => setRenameProtocolModal(prev => ({ ...prev, newName: e.target.value }))}
                placeholder="NEW NAME..."
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 aspect-square bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center transition-colors"
              >
                <CheckCircle className="w-6 h-6" />
              </button>
            </form>
            <div className="flex w-full mt-6 justify-between items-center px-4">
              <button
                onClick={() => handleDeleteProtocol(renameProtocolModal.oldName)}
                className="w-12 h-12 bg-vm-scarlet/10 hover:bg-vm-scarlet/20 text-vm-scarlet rounded-xl flex items-center justify-center transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setRenameProtocolModal({ open: false, oldName: '', newName: '' })}
                className="text-[10px] tracking-[0.3em] text-white/30 hover:text-white uppercase font-bold"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
