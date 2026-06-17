'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { triggerHaptic } from '@/lib/utils';
import { api } from '@/lib/api';
import { getDailyQuote } from '@/lib/quotes';
import {
  Compass, Swords, Activity, Zap, Brain,
  TerminalSquare, Command, Moon, ArrowRight,
  type LucideIcon,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Card definitions — each card carries its own full-screen identity
// ─────────────────────────────────────────────────────────────────────────────
interface CardDef {
  id: string;
  label: string;
  tag: string;
  tagline: string;
  items: string[];
  route: string;
  accent: string;
  glow: string;
  bg: string[];           // gradient stops
  Icon: LucideIcon;
  Visual: React.FC<{ accent: string }>;
}

// ── Inline animated visuals (pure CSS + SVG, no canvas flicker) ──────────────

function DeenVisual({ accent }: { accent: string }) {
  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Outer rotating ring */}
      <div className="absolute w-56 h-56 rounded-full border opacity-20 animate-[spin_18s_linear_infinite]"
        style={{ borderColor: accent, borderStyle: 'dashed' }} />
      {/* Middle ring */}
      <div className="absolute w-40 h-40 rounded-full border opacity-40 animate-[spin_12s_linear_infinite_reverse]"
        style={{ borderColor: accent }} />
      {/* Sacred geometry — 6 petals */}
      <svg className="absolute w-40 h-40 animate-[spin_24s_linear_infinite]" viewBox="0 0 100 100">
        {[0,60,120,180,240,300].map((deg) => {
          const cx = 50 + 20 * Math.cos((deg * Math.PI) / 180);
          const cy = 50 + 20 * Math.sin((deg * Math.PI) / 180);
          return (
            <circle key={deg}
              cx={cx.toFixed(4)}
              cy={cy.toFixed(4)}
              r="20" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.5" />
          );
        })}
        <circle cx="50" cy="50" r="20" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.5" />
      </svg>
      {/* Core glow */}
      <div className="w-8 h-8 rounded-full" style={{ background: accent, boxShadow: `0 0 32px 12px ${accent}66` }} />
    </div>
  );
}

function ElesiumVisual({ accent }: { accent: string }) {
  return (
    <div className="relative flex items-center justify-center w-64 h-64 overflow-hidden">
      {/* Animated wave lines */}
      <svg className="absolute w-full h-full" viewBox="0 0 256 256" preserveAspectRatio="none">
        {[0, 1, 2, 3].map((i) => (
          <path key={i}
            d={`M 0 ${128 + i * 10} Q 64 ${90 - i * 15} 128 ${128 + i * 10} T 256 ${128 + i * 10}`}
            fill="none" stroke={accent} strokeWidth={1.5 - i * 0.3}
            opacity={0.7 - i * 0.12}
            style={{ animation: `waveAnim${i} ${3 + i * 0.5}s ease-in-out infinite alternate` }}
          />
        ))}
      </svg>
      {/* Trending arrow glow */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <ArrowRight size={16} style={{ color: accent, transform: 'rotate(-45deg)', filter: `drop-shadow(0 0 8px ${accent})` }} />
        <div className="w-3 h-3 rounded-full" style={{ background: accent, boxShadow: `0 0 24px 8px ${accent}55` }} />
      </div>
      <style>{`
        @keyframes waveAnim0 { to { d: path("M 0 118 Q 64 155 128 118 T 256 118"); } }
        @keyframes waveAnim1 { to { d: path("M 0 128 Q 64 100 128 128 T 256 128"); } }
        @keyframes waveAnim2 { to { d: path("M 0 138 Q 64 112 128 138 T 256 138"); } }
        @keyframes waveAnim3 { to { d: path("M 0 148 Q 64 118 128 148 T 256 148"); } }
      `}</style>
    </div>
  );
}

function PhysicalityVisual({ accent }: { accent: string }) {
  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Outer rotating dash ring */}
      <div className="absolute w-56 h-56 rounded-full animate-[spin_8s_linear_infinite]"
        style={{ border: `2px dashed ${accent}55` }} />
      {/* Pulsing ring */}
      <div className="absolute w-44 h-44 rounded-full animate-[ping_1.8s_ease-in-out_infinite]"
        style={{ border: `2px solid ${accent}33` }} />
      <div className="absolute w-44 h-44 rounded-full"
        style={{ border: `2px solid ${accent}88` }} />
      {/* EKG line */}
      <svg className="absolute w-40 h-16" viewBox="0 0 160 60">
        <polyline points="0,30 30,30 42,10 50,50 58,20 70,30 160,30"
          fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${accent})` }} />
      </svg>
    </div>
  );
}

function FitnessVisual({ accent }: { accent: string }) {
  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Concentric rings */}
      {[56, 44, 32, 20].map((size, i) => (
        <div key={i} className="absolute rounded-full border"
          style={{
            width: `${size * 4}px`, height: `${size * 4}px`,
            borderColor: `${accent}${['22','33','55','88'][i]}`,
            boxShadow: i === 3 ? `0 0 24px 4px ${accent}44` : undefined,
          }} />
      ))}
      {/* Cross swords icon */}
      <svg className="relative z-10 w-16 h-16" viewBox="0 0 24 24" fill="none">
        <line x1="4" y1="4" x2="20" y2="20" stroke={accent} strokeWidth="2" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${accent})` }} />
        <line x1="20" y1="4" x2="4" y2="20" stroke={accent} strokeWidth="2" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${accent})` }} />
        <circle cx="12" cy="12" r="2" fill={accent} />
      </svg>
    </div>
  );
}

// Pre-computed constants to avoid floating point SSR mismatches
const R = 90;
const CIRC = Math.round(2 * Math.PI * R); // 565
const FILL_75 = Math.round(CIRC * 0.75);   // 424
const GAP_25  = CIRC - FILL_75;            // 141
// Dot at 270° rotated 270° = sits at top-right of arc
const DOT_ANGLE_RAD = (270 + 270) * Math.PI / 180;
const DOT_CX = Math.round(110 + R * Math.cos(DOT_ANGLE_RAD));
const DOT_CY = Math.round(110 + R * Math.sin(DOT_ANGLE_RAD));

function RecoveryVisual({ accent }: { accent: string }) {
  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Sleep arc gauge — all values pre-computed, SSR-safe */}
      <svg className="absolute w-56 h-56" viewBox="0 0 220 220">
        <circle cx="110" cy="110" r={R} fill="none" stroke={`${accent}22`} strokeWidth="12" />
        <circle cx="110" cy="110" r={R} fill="none" stroke={accent} strokeWidth="12"
          strokeDasharray={`${FILL_75} ${GAP_25}`}
          strokeDashoffset={GAP_25}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${accent})` }} />
        <circle cx={DOT_CX} cy={DOT_CY} r="8" fill={accent}
          style={{ filter: `drop-shadow(0 0 6px ${accent})` }} />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="text-4xl font-bold text-white">4<span className="text-lg">hr</span></span>
        <span className="text-xs opacity-50 tracking-widest mt-1" style={{ color: accent }}>SLEEP DEBT</span>
      </div>
    </div>
  );
}

// Deterministic dot pattern — seeded so SSR and client always match
const DOT_PATTERN = Array.from({ length: 14 * 14 }, (_, i) => ({
  opacity: ((i * 7 + 13) % 17) > 11 ? 0.7 : 0.06,
  dur:     (1 + ((i * 3 + 7)  % 20) / 10).toFixed(1),
  delay:   (((i * 11 + 3) % 100) / 100).toFixed(2),
}));

function SelfVisual({ accent }: { accent: string }) {
  return (
    <div className="relative flex items-center justify-center w-64 h-64 overflow-hidden">
      {/* Scanning dot matrix — deterministic, SSR-safe */}
      <div className="absolute inset-0 grid gap-[6px] p-4" style={{ gridTemplateColumns: 'repeat(14, 1fr)' }}>
        {DOT_PATTERN.map((d, i) => (
          <div key={i} className="w-[3px] h-[3px] rounded-full"
            style={{
              background: accent,
              opacity: d.opacity,
              animation: `blinkDot ${d.dur}s ease-in-out ${d.delay}s infinite alternate`,
            }} />
        ))}
      </div>
      {/* Scan line overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, transparent 0%, ${accent}22 50%, transparent 100%)`, animation: 'scanline 2.5s linear infinite' }} />
      {/* Centre cursor */}
      <div className="relative z-10 w-2 h-6 animate-[pulse_1s_ease-in-out_infinite]"
        style={{ background: accent, boxShadow: `0 0 12px 4px ${accent}` }} />
      <style>{`
        @keyframes blinkDot { from { opacity: 0.06; } to { opacity: 0.8; } }
        @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
      `}</style>
    </div>
  );
}

function TerminalVisual({ accent }: { accent: string }) {
  const lines = ['> SYSTEM READY', '> AI LOADED', '> NEURAL SYNC...', '> ORACLE ONLINE ✓'];
  return (
    <div className="relative flex items-center justify-center w-64 h-48">
      <div className="w-full rounded-xl p-5 font-mono text-xs leading-7"
        style={{ background: 'rgba(0,0,0,0.6)', border: `1px solid ${accent}33` }}>
        {lines.map((line, i) => (
          <div key={i} style={{ color: accent, opacity: 0.6 + i * 0.1,
            animation: `fadeInLine 0.5s ease ${i * 0.3}s both` }}>{line}</div>
        ))}
        <span style={{ color: accent }} className="animate-[pulse_1s_ease-in-out_infinite]">█</span>
      </div>
      <style>{`@keyframes fadeInLine { from { opacity: 0; transform: translateX(-8px); } to { } }`}</style>
    </div>
  );
}

function CommandVisual({ accent }: { accent: string }) {
  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Radar rings */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="absolute rounded-full border"
          style={{
            width: `${i * 56}px`, height: `${i * 56}px`,
            borderColor: `${accent}${['18','25','35','50'][i - 1]}`,
            animation: `ping ${2 + i * 0.3}s ease-in-out ${i * 0.2}s infinite`,
          }} />
      ))}
      {/* Sweep line */}
      <div className="absolute w-28 h-0.5 origin-left animate-[spin_4s_linear_infinite]"
        style={{ background: `linear-gradient(to right, transparent, ${accent})`, left: '50%', top: '50%' }} />
      <div className="w-3 h-3 rounded-full z-10"
        style={{ background: accent, boxShadow: `0 0 20px 8px ${accent}66` }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const CARDS: CardDef[] = [
  { id:'deen',      label:'DEEN',      tag:'FOUNDATION', tagline:'The Sacred Core',
    items:['Salah','Quran','Adhkar'],
    route:'/folder/DEEN',    accent:'#10D86A', glow:'rgba(16,216,106,0.35)',
    bg:['#020d05','#061a0c','#020d05'], Icon:Compass,       Visual:DeenVisual },

  { id:'elesium',   label:'ELESIUM',   tag:'EMPIRE',     tagline:'The Digital Empire',
    items:['Sales','Meetings','Revenue'],
    route:'/folder/ELESIUM', accent:'#3B82F6', glow:'rgba(59,130,246,0.35)',
    bg:['#01030d','#030b1e','#01030d'], Icon:Zap,           Visual:ElesiumVisual },

  { id:'fitness',   label:'FITNESS',   tag:'BODY',       tagline:'Iron & Discipline',
    items:['Workout','Training','Progress'],
    route:'/workout',        accent:'#F43F5E', glow:'rgba(244,63,94,0.35)',
    bg:['#0d0103','#1e030a','#0d0103'], Icon:Swords,        Visual:FitnessVisual },

  { id:'wellness',  label:'RECOVERY',  tag:'WELLNESS',   tagline:'Rest & Regeneration',
    items:['Sleep','Fasting','Hydration'],
    route:'/wellness',       accent:'#22D3EE', glow:'rgba(34,211,238,0.35)',
    bg:['#01090d','#031820','#01090d'], Icon:Activity,      Visual:RecoveryVisual },

  { id:'self',      label:'SELF',      tag:'INNER',      tagline:'The Oracle Within',
    items:['Reflection','Patterns','Flaws'],
    route:'/folder/SELF',    accent:'#A855F7', glow:'rgba(168,85,247,0.35)',
    bg:['#07010d','#110320','#07010d'], Icon:Brain,         Visual:SelfVisual },

  { id:'terminal',  label:'TERMINAL',  tag:'ORACLE',     tagline:'Neural Interface',
    items:['AI','Chat','Neural Interface'],
    route:'/chat',           accent:'#E879F9', glow:'rgba(232,121,249,0.35)',
    bg:['#0d010d','#1e031e','#0d010d'], Icon:TerminalSquare,Visual:TerminalVisual },

  { id:'command',   label:'COMMAND',   tag:'CONTROL',    tagline:'Full System Dashboard',
    items:['All Systems','Quick Actions','Analytics'],
    route:'/command',        accent:'#F59E0B', glow:'rgba(245,158,11,0.35)',
    bg:['#0d0700','#1e0e00','#0d0700'], Icon:Command,       Visual:CommandVisual },
];

// ─────────────────────────────────────────────────────────────────────────────
// Time helpers
// ─────────────────────────────────────────────────────────────────────────────
function getGreeting(h: number) {
  if (h >= 4  && h < 9)  return { label:'MORNING PROTOCOL',  color:'#10D86A' };
  if (h >= 9  && h < 15) return { label:'EMPIRE DEEP WORK',  color:'#3B82F6' };
  if (h >= 15 && h < 19) return { label:'EVENING PUSH',      color:'#F43F5E' };
  return                         { label:'WIND DOWN & VAULT', color:'#818CF8' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function FolderHub() {
  const router = useRouter();

  const [current,     setCurrent]     = useState(0);
  const [streak,      setStreak]      = useState(0);
  const [dayCount,    setDayCount]    = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  const [currentHour, setCurrentHour] = useState(12);
  const [dailyQuote,  setDailyQuote]  = useState('');
  const [touching,    setTouching]    = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const isDragging = useRef(false);

  // Boot
  useEffect(() => {
    const start = new Date('2026-02-22');
    const day   = Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000));
    setDayCount(day);
    setDailyQuote(getDailyQuote(day));

    const tick = () => {
      const n = new Date();
      setCurrentTime(n.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
      setCurrentHour(n.getHours());
    };
    tick();
    const t = setInterval(tick, 1000);
    api.logs.streak().then(s => setStreak(s.overall_streak || 0)).catch(() => {});
    
    return () => clearInterval(t);
  }, []);

  // Scroll to card imperatively
  const scrollToCard = useCallback((index: number) => {
    if (!scrollRef.current) return;
    const el = scrollRef.current.children[index] as HTMLElement;
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    setCurrent(index);
  }, []);

  // Touch swipe handling
  const onTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setTouching(true);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startXRef.current;
    setTouching(false);
    if (Math.abs(dx) > 50) {
      if (dx < 0 && current < CARDS.length - 1) scrollToCard(current + 1);
      if (dx > 0 && current > 0)                 scrollToCard(current - 1);
    }
  };

  // Intersection observer to track current visible card
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    // Guard: IntersectionObserver may not be available in all WebView versions
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Array.from(container.children).indexOf(entry.target as Element);
            if (idx !== -1) setCurrent(idx);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );
    Array.from(container.children).forEach(child => observer.observe(child));
    return () => observer.disconnect();
  }, []);

  const navigate = (card: CardDef) => {
    triggerHaptic('medium');
    setTimeout(() => router.push(card.route), 100);
  };

  const greeting  = getGreeting(currentHour);
  const timeParts = currentTime.split(' ');
  const card      = CARDS[current];

  return (
    <main className="relative w-full h-full flex-1 overflow-hidden bg-black flex flex-col"
      style={{ fontFamily: "'IBM Plex Mono', monospace", height: '100vh', width: '100vw' }}>
      <div style={{ position: 'absolute', top: 50, left: 20, zIndex: 999999, color: 'lime', fontSize: '30px', fontWeight: 'bold' }}>
        HOME COMPONENT LOADED
      </div>

      {/* ── Floating header — sits above all cards ── */}
      <div className="absolute top-0 left-0 right-0 z-30 px-5 pt-safe"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
        <div className="flex items-start justify-between pt-4">
          {/* Time */}
          <div>
            <div className="mb-1 px-2 py-0.5 rounded-sm text-[8px] tracking-[0.3em] font-bold uppercase border-l-2 inline-block"
              style={{ color: greeting.color, borderColor: greeting.color, background: `${greeting.color}15` }}>
              {greeting.label}
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-bold tracking-tighter text-white tabular-nums">
                {timeParts[0] ?? ''}
              </span>
              <span className="text-base font-bold tracking-[0.2em]" style={{ color: greeting.color }}>
                {timeParts[1] ?? ''}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] tracking-[0.2em] text-white/40 uppercase font-bold">{streak} DAY STREAK</span>
              <span className="text-white/20 text-[9px]">/</span>
              <span className="text-[9px] tracking-[0.2em] uppercase font-bold" style={{ color: greeting.color, opacity: 0.8 }}>
                PHASE 0 · DAY {dayCount}
              </span>
            </div>
          </div>

          {/* Card index indicator */}
          <div className="text-right pt-1">
            <span className="text-[9px] font-bold tracking-[0.3em] text-white/30 font-mono">
              {String(current + 1).padStart(2, '0')}/{String(CARDS.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* ── Horizontal scroll deck ── */}
      <div
        ref={scrollRef}
        className="flex w-full h-full overflow-x-scroll snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {CARDS.map((c, i) => (
          <div
            key={c.id}
            className="relative flex-shrink-0 w-full h-full snap-start overflow-hidden"
            style={{
              background: `radial-gradient(ellipse 120% 100% at 50% 30%, ${c.bg[1]} 0%, ${c.bg[0]} 100%)`,
            }}
          >
            {/* Ambient top glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${c.accent}18 0%, transparent 70%)` }} />

            {/* Scanline overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)' }} />

            {/* Pillar code top-right */}
            <div className="absolute top-safe right-5 mt-20 z-10">
              <span className="text-[9px] font-mono tracking-[0.3em] font-bold"
                style={{ color: c.accent, opacity: 0.5 }}>
                PILLAR {String(i + 1).padStart(2, '0')}
              </span>
            </div>

            {/* Centre Visual */}
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ paddingTop: '120px', paddingBottom: '200px' }}>
              <c.Visual accent={c.accent} />
            </div>

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 px-7 pb-safe"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 100%)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>

              {/* Tag */}
              <span className="inline-block text-[8px] font-bold tracking-[0.3em] uppercase mb-3 px-2 py-1 rounded-sm"
                style={{ color: c.accent, background: `${c.accent}15`, border: `1px solid ${c.accent}30` }}>
                {c.tag}
              </span>

              {/* Title */}
              <h1 className="text-[42px] font-black tracking-tight text-white leading-none mb-1"
                style={{ textShadow: `0 0 40px ${c.glow}` }}>
                {c.label}
              </h1>

              {/* Tagline */}
              <p className="text-base font-semibold mb-3" style={{ color: c.accent }}>
                {c.tagline}
              </p>

              {/* Items */}
              <div className="flex gap-4 mb-8">
                {c.items.map((item) => (
                  <span key={item} className="text-[10px] tracking-widest text-white/40 uppercase">
                    {item}
                  </span>
                ))}
              </div>

              {/* Explore row */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold tracking-[0.15em] text-white/60 uppercase">
                  Explore
                </span>
                <button
                  onClick={() => navigate(c)}
                  className="flex items-center justify-center w-14 h-14 rounded-full active:scale-90 transition-transform duration-150"
                  style={{
                    background: c.accent,
                    boxShadow: `0 0 32px 4px ${c.glow}`,
                  }}>
                  <ArrowRight size={22} color="black" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom page dots ── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex justify-center gap-2 pb-safe"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}>
        {CARDS.map((c, i) => (
          <button
            key={c.id}
            onClick={() => scrollToCard(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width:  i === current ? '28px' : '6px',
              height: '6px',
              background: i === current ? c.accent : 'rgba(255,255,255,0.2)',
              boxShadow: i === current ? `0 0 8px ${c.accent}` : undefined,
            }} />
        ))}
      </div>

      {/* Swipe hint on first visit */}
      {current === 0 && (
        <div className="absolute bottom-16 left-0 right-0 z-30 text-center pointer-events-none">
          <span className="text-[8px] tracking-[0.4em] text-white/20 uppercase animate-[pulse_2s_ease-in-out_infinite]">
            swipe to explore
          </span>
        </div>
      )}
    </main>
  );
}
