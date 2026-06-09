'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { triggerHaptic } from '@/lib/utils';
import { api } from '@/lib/api';
import { getDailyQuote } from '@/lib/quotes';
import {
  Compass, Swords, Activity, Zap, Brain, Command,
  TerminalSquare, Moon, Sun, CheckCircle2, GripHorizontal, Settings2,
  type LucideIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay,
} from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// VIRTUAL MIND — Pillar Colour System
// Each pillar has one permanent emotional-identity colour.
// The same colour is used on the home card, the inner screen, and all glows.
// ─────────────────────────────────────────────────────────────────────────────
const CARD_META: Record<string, {
  label: string; subtitle: string; route: string;
  color: string; glow: string; tag: string; Icon: LucideIcon;
}> = {
  //  Pillar        Label          Subtitle                          Route                Color       Glow                           Tag          Icon
  deen:     { label:'DEEN',     subtitle:'Salah · Quran · Adhkar',       route:'/folder/DEEN',    color:'#10D86A', glow:'rgba(16,216,106,0.4)',   tag:'FOUNDATION', Icon:Compass },       // Jade — sacred Islamic green
  fitness:  { label:'FITNESS',  subtitle:'Workout · Training · Progress', route:'/workout',        color:'#F43F5E', glow:'rgba(244,63,94,0.4)',    tag:'BODY',       Icon:Swords },        // Scarlet — blood and iron
  wellness: { label:'RECOVERY', subtitle:'Sleep · Fasting · Hydration',   route:'/wellness',       color:'#22D3EE', glow:'rgba(34,211,238,0.4)',   tag:'WELLNESS',   Icon:Activity },      // Glacier — rest and water
  elesium:  { label:'ELESIUM',  subtitle:'Sales · Meetings · Revenue',    route:'/folder/ELESIUM', color:'#3B82F6', glow:'rgba(59,130,246,0.4)',   tag:'EMPIRE',     Icon:Zap },           // Sapphire — digital empire
  self:     { label:'SELF',     subtitle:'Reflection · Patterns · Flaws', route:'/folder/SELF',    color:'#A855F7', glow:'rgba(168,85,247,0.4)',   tag:'INNER',      Icon:Brain },         // Amethyst — inner consciousness
  terminal: { label:'TERMINAL', subtitle:'AI · Chat · Neural Interface',  route:'/chat',           color:'#E879F9', glow:'rgba(232,121,249,0.4)',  tag:'ORACLE',     Icon:TerminalSquare }, // Fuchsia — neural oracle
};


const DEFAULT_ORDER = ['deen','fitness','wellness','elesium','self','terminal'];
const STORAGE_KEY   = 'vm_card_order_v2';
const TRACK_IDS     = new Set(['deen','fitness','wellness']);

const _now   = new Date();
const _day   = Math.max(0, Math.floor((_now.getTime() - new Date('2026-02-22').getTime()) / 86400000));
const _hour  = _now.getHours();
const _time  = _now.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true });

function loadSavedOrder(): string[] {
  if (typeof window === 'undefined') return DEFAULT_ORDER;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as string[];
      const valid   = p.filter(id => id in CARD_META);
      const missing = DEFAULT_ORDER.filter(id => !valid.includes(id));
      return [...valid, ...missing];
    }
  } catch {}
  return DEFAULT_ORDER;
}

// Time-of-day greeting colours — matched to the pillar that dominates each block
function getGreeting(h: number) {
  if (h >= 4  && h < 9)  return { label:'MORNING PROTOCOL',  color:'#10D86A' }; // Jade   — Fajr/Deen time
  if (h >= 9  && h < 15) return { label:'EMPIRE DEEP WORK',  color:'#3B82F6' }; // Sapphire — Elesium grind
  if (h >= 15 && h < 19) return { label:'EVENING PUSH',      color:'#F43F5E' }; // Scarlet  — Fitness/evening
  return                         { label:'WIND DOWN & VAULT', color:'#818CF8' }; // Indigo   — Qadr/night
}

// ── Sortable Card with explicit Drag Handle ──────────────────────────────────
function SortableCard({ id, loggedToday, editMode, onNavigate }: {
  id: string; loggedToday: boolean; editMode: boolean; onNavigate: (id: string) => void;
}) {
  const m = CARD_META[id];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: !editMode });

  if (!m) return null;
  const { label, subtitle, color, glow, tag, Icon } = m;
  const showDot = TRACK_IDS.has(id);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    position: 'relative',
    zIndex: isDragging ? 99 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <motion.div
        layoutId={`card-${id}`}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
        onClick={() => !editMode && onNavigate(id)}
        className="relative w-full rounded-2xl overflow-hidden active:scale-[0.96] transition-transform duration-200"
        style={{
          height: '148px',
          background: 'var(--color-surface)',
          border: editMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.06)',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.3)`,
          cursor: editMode ? 'default' : 'pointer',
          willChange: 'transform',
        }}
      >
        {/* High-performance ambient background glow (No CSS blur filter) */}
        <div 
          className="absolute -top-12 -left-12 w-40 h-40 rounded-full pointer-events-none opacity-20"
          style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} 
        />
        
        {/* Top glossy reflection line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)` }} />

        <div className="absolute inset-0 flex flex-col justify-between p-4">
          <div className="flex justify-between items-start w-full">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background:`${color}15`, border:`1px solid rgba(255,255,255,0.06)` }}>
              <Icon strokeWidth={1.5} className="w-5 h-5"
                style={{ color, filter:`drop-shadow(0 0 6px ${glow})` }} />
            </div>

            {/* DRAG HANDLE OR STATUS DOT */}
            {editMode ? (
              <div
                {...attributes}
                {...listeners}
                className="w-10 h-10 -m-2 flex items-center justify-center touch-none rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)', cursor: 'grab' }}
                onPointerDown={(e) => {
                  triggerHaptic('light');
                  if (listeners?.onPointerDown) listeners.onPointerDown(e);
                }}
              >
                <GripHorizontal className="w-5 h-5 text-foreground opacity-50" />
              </div>
            ) : showDot ? (
              <div className="w-10 h-10 -m-2 flex items-center justify-center">
                 <div className="w-1.5 h-1.5 rounded-full" 
                      style={{ background: loggedToday ? '#4caa6e' : 'rgba(255,255,255,0.15)', 
                               boxShadow: loggedToday ? `0 0 6px #4caa6e` : 'none' }} />
              </div>
            ) : null}
          </div>

          <div className="relative w-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold tracking-[0.15em] text-foreground opacity-90">{label}</p>
              <span className="absolute right-0 top-0 text-[7.5px] font-bold tracking-[0.2em] uppercase text-right -mr-[0.2em] text-foreground opacity-40">
                {tag}
              </span>
            </div>
              {subtitle.split(' · ').map((s, i) => (
                <p key={i} className="text-[9.5px] text-foreground opacity-40 tracking-wide">{s}</p>
              ))}
            </div>
          </div>
      </motion.div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function FolderHub() {
  const router = useRouter();

  const [cardOrder,    setCardOrder]    = useState<string[]>(loadSavedOrder);
  const [editMode,     setEditMode]     = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const [dayCount,    setDayCount]    = useState(_day);
  const [streak,      setStreak]      = useState(0);
  const [loggedToday, setLoggedToday] = useState(false);
  const [currentTime, setCurrentTime] = useState(_time);
  const [currentHour, setCurrentHour] = useState(_hour);
  const [dailyQuote,  setDailyQuote]  = useState(() => getDailyQuote(_day));

  useEffect(() => {
    const start = new Date('2026-02-22');
    const day   = Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000));
    setDayCount(day);
    setDailyQuote(getDailyQuote(day));
    const tick = () => {
      const n = new Date();
      setCurrentTime(n.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true }));
      setCurrentHour(n.getHours());
    };
    tick();
    const t = setInterval(tick, 1000);
    api.status().then(s  => setLoggedToday(!s.is_locked)).catch(() => {});
    api.logs.streak().then(s => setStreak(s.overall_streak || 0)).catch(() => {});
    return () => clearInterval(t);
  }, []);

  // Sensors optimized for explicit drag handles
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 2 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 50, tolerance: 10 } }),
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveDragId(active.id as string);
    triggerHaptic('medium');
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveDragId(null);
    if (over && active.id !== over.id) {
      setCardOrder(prev => {
        const next = arrayMove(prev, prev.indexOf(active.id as string), prev.indexOf(over.id as string));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      triggerHaptic('light');
    }
  };

  const go = (id: string) => {
    const m = CARD_META[id];
    if (!m || editMode) return;
    triggerHaptic('medium');
    setTimeout(() => { router.push(m.route); }, 110);
  };

  const greeting  = getGreeting(currentHour);
  const timeParts = currentTime.split(' ');

  return (
    <main
      className="relative min-h-screen bg-background overflow-hidden no-select pb-safe"
      style={{ fontFamily:"'IBM Plex Mono', monospace" }}
    >
      <div className="scanline-overlay" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background:`radial-gradient(ellipse 90% 55% at 50% 0%, ${greeting.color}08 0%, transparent 65%)` }} />

      {/* HEADER */}
      <header className="relative z-10 px-4 pt-safe pb-2 mt-4 flex flex-col items-start w-full">
        
        {/* Settings Menu Button (Top Right) */}
        <div className="absolute top-safe right-4 mt-4 z-50">
          <button
            onClick={() => { triggerHaptic('light'); setSettingsOpen(!settingsOpen); }}
            className="p-2 rounded-full border bg-background/20 backdrop-blur-md"
            style={{ borderColor: settingsOpen || editMode ? '#c9a84c' : 'var(--color-surface2)' }}
          >
            {settingsOpen || editMode ? (
              <CheckCircle2 className="w-4 h-4" style={{ color: '#c9a84c' }} />
            ) : (
              <Settings2 className="w-4 h-4 text-foreground opacity-40" />
            )}
          </button>
          
          {settingsOpen && !editMode && (
            <div className="absolute top-full right-0 mt-2 w-48 rounded-xl border p-2 flex flex-col gap-1 shadow-2xl backdrop-blur-xl" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-surface2)' }}>
              <button 
                onClick={() => { 
                  triggerHaptic('medium'); 
                  setEditMode(true); 
                  setSettingsOpen(false); 
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[10px] font-bold tracking-wider text-foreground hover:bg-surface2 transition-colors"
                style={{ backgroundColor: 'transparent' }}
              >
                <GripHorizontal className="w-4 h-4 opacity-60" />
                EDIT LAYOUT
              </button>
              <button 
                onClick={() => { 
                  triggerHaptic('medium'); 
                  setTheme(theme === 'dark' ? 'light' : 'dark'); 
                  setSettingsOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[10px] font-bold tracking-wider text-foreground transition-colors"
                style={{ backgroundColor: 'transparent' }}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 opacity-60" /> : <Moon className="w-4 h-4 opacity-60" />}
                {theme === 'dark' ? 'LIGHT MODE' : 'DARK MODE'}
              </button>
            </div>
          )}
        </div>

        <div className="mb-2 px-3 py-1.5 rounded-sm text-[8px] tracking-[0.35em] font-bold uppercase border-l-2"
          style={{ color:greeting.color, borderColor: greeting.color, background:`linear-gradient(90deg, ${greeting.color}15, transparent)` }}>
          {greeting.label}
        </div>
        
        <div className="flex items-baseline gap-2 mb-1 mt-1 -ml-1">
          <span className="text-6xl font-bold tracking-tighter text-foreground tabular-nums drop-shadow-[0_0_18px_rgba(255,255,255,0.15)]">
            {timeParts[0] ?? ''}
          </span>
          <span className="text-lg font-bold tracking-[0.2em]" style={{ color: greeting.color }}>
            {timeParts[1] ?? ''}
          </span>
        </div>
        
        <div className="flex items-center gap-3 mt-1 mb-5">
          <span className="text-[10px] tracking-[0.2em] text-foreground opacity-50 uppercase font-bold">{streak} DAY STREAK</span>
          <span className="text-[10px] text-foreground opacity-20">/</span>
          <span className="text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: greeting.color, opacity: 0.8 }}>PHASE 0 · DAY {dayCount}</span>
        </div>
      </header>

      {/* PLAN TOMORROW */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
        className="relative z-10 px-4 mb-5"
      >
        <Link href="/qadr" onClick={() => triggerHaptic('medium')}>
          <div
            className="w-full flex items-center gap-4 px-5 rounded-2xl border relative overflow-hidden group active:scale-[0.97] transition-transform duration-200"
            style={{
              height: '76px',
              borderColor: 'rgba(129,140,248,0.18)',                          // Indigo border
              background: 'linear-gradient(135deg, rgba(129,140,248,0.05) 0%, rgba(0,0,0,0.6) 100%)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(129,140,248,0.07)',
              willChange: 'transform',
            }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-active:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
            
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.2)' }}>
              <Moon strokeWidth={1.5} className="w-5 h-5" style={{ color: '#818CF8', filter: 'drop-shadow(0 0 6px rgba(129,140,248,0.6))' }} />
            </div>
            
            <div className="flex-1 text-left relative z-10 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-1.5 w-full">
                <p className="text-[11px] font-bold tracking-[0.15em] text-foreground opacity-90">PLAN TOMORROW</p>
                <span className="text-[7.5px] font-bold tracking-[0.2em] uppercase text-foreground opacity-50 bg-surface2 px-1.5 py-0.5 rounded-sm">
                  NIGHT
                </span>
              </div>
              <p className="text-[9.5px] text-foreground opacity-40 tracking-wide">AI Night Planner · Qadr Engine</p>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* GRID */}
      <div className="relative z-10 px-4">

        {editMode && (
          <div className="flex items-center justify-between mb-3 px-3 py-2.5 rounded-xl"
            style={{ background:'rgba(201,168,76,0.07)', border:'1px solid rgba(201,168,76,0.22)' }}>
            <div>
              <p className="text-[9px] font-bold tracking-[0.2em] text-[#c9a84c] uppercase">
                {activeDragId ? '✋ Dragging...' : '↕ Drag the handle on cards to reorder'}
              </p>
            </div>
            <button
              onClick={() => { setEditMode(false); triggerHaptic('light'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold tracking-widest uppercase shrink-0 ml-3"
              style={{ background:'rgba(201,168,76,0.2)', border:'1px solid rgba(201,168,76,0.45)', color:'#c9a84c' }}>
              <CheckCircle2 className="w-3 h-3" /> DONE
            </button>
          </div>
        )}

        {/* ── DRAG CONTEXT ── */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {cardOrder.map(id => (
                <SortableCard
                  key={id}
                  id={id}
                  loggedToday={loggedToday}
                  editMode={editMode}
                  onNavigate={go}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* COMMAND — always full-width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
          className="relative w-full"
        >
          <button
            onClick={() => { triggerHaptic('light'); if (!editMode) router.push('/command'); }}
            className="relative w-full focus:outline-none rounded-2xl flex items-center px-5 gap-4 overflow-hidden active:scale-[0.97] transition-transform duration-200 border"
            style={{
              height: '76px',
              borderColor: 'rgba(245,158,11,0.18)',                           // Amber border
              background: 'linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(0,0,0,0.6) 100%)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(245,158,11,0.07)',
              willChange: 'transform',
            }}
          >
            <div 
              className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full opacity-60"
              style={{ background: 'linear-gradient(to bottom, #F59E0B, transparent)' }} 
            />
            
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Command strokeWidth={1.5} className="w-5 h-5" style={{ color: '#F59E0B', filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.6))' }} />
            </div>
            
            <div className="flex-1 text-left relative z-10 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-1.5 w-full">
                <p className="text-[11px] font-bold tracking-[0.15em] text-foreground opacity-90">COMMAND</p>
                <span className="text-[7.5px] font-bold tracking-[0.2em] uppercase text-foreground opacity-50 bg-surface2 px-1.5 py-0.5 rounded-sm">
                  CONTROL
                </span>
              </div>
              <p className="text-[9.5px] text-foreground opacity-40 tracking-wide">Full Dashboard · All Systems</p>
            </div>
          </button>
        </motion.div>

      </div>

      <div className="relative z-10 text-center px-8 mt-14 mb-10 pb-20">
        <p className="text-[10px] text-foreground opacity-40 tracking-[0.1em] italic leading-relaxed">
          {dailyQuote}
        </p>
      </div>
    </main>
  );
}
