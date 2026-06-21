'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef, Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// Error Boundary to catch sneaky mobile crashes
// ─────────────────────────────────────────────────────────────────────────────
class ErrorCatcher extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.log("CAUGHT ERROR:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full bg-red-600 text-white p-8 flex flex-col items-center justify-center z-[9999] absolute inset-0">
          <h1 className="text-3xl font-bold mb-4">CRASH DETECTED</h1>
          <p className="text-xl mb-4">{this.state.error?.message}</p>
          <pre className="text-xs bg-black/50 p-4 rounded overflow-auto w-full">
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const PILLARS = [
  { id: 'deen',     label: 'DEEN',     subtitle: 'Salah · Quran · Adhkar',       route: '/folder/deen',    color: '#10D86A', tag: 'FOUNDATION' },
  { id: 'fitness',  label: 'FITNESS',  subtitle: 'Workout · Training · Progress', route: '/workout',        color: '#F43F5E', tag: 'BODY' },
  { id: 'wellness', label: 'RECOVERY', subtitle: 'Sleep · Fasting · Hydration',   route: '/wellness',       color: '#22D3EE', tag: 'WELLNESS' },
  { id: 'elesium',  label: 'ELESIUM',  subtitle: 'Sales · Meetings · Revenue',    route: '/folder/elesium', color: '#3B82F6', tag: 'EMPIRE' },
  { id: 'self',     label: 'SELF',     subtitle: 'Reflection · Patterns · Flaws', route: '/folder/self',    color: '#A855F7', tag: 'INNER' },
  { id: 'terminal', label: 'TERMINAL', subtitle: 'AI · Chat · Neural Interface',  route: '/chat',           color: '#E879F9', tag: 'ORACLE' },
  { id: 'oracle',   label: 'SYNC',     subtitle: 'Nightly Algorithm Update',      route: '/oracle',         color: '#22C55E', tag: 'THE ORACLE' },
];

function DashboardSwipeInner() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [sortedPillars, setSortedPillars] = useState(PILLARS);
  const [isNavigatingTo, setIsNavigatingTo] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamic Time-Based Sorting
    const hour = new Date().getHours();
    const sorted = [...PILLARS];

    if (hour >= 4 && hour < 9) {
      // MORNING: Fitness, Alarm, Deen
      sorted.sort((a, b) => {
        const priorityA = ['fitness', 'alarm', 'deen'].indexOf(a.id);
        const priorityB = ['fitness', 'alarm', 'deen'].indexOf(b.id);
        return (priorityA === -1 ? 99 : priorityA) - (priorityB === -1 ? 99 : priorityB);
      });
    } else if (hour >= 9 && hour < 18) {
      // MIDDAY / WORK: Elesium, Terminal, Deen
      sorted.sort((a, b) => {
        const priorityA = ['elesium', 'terminal', 'deen'].indexOf(a.id);
        const priorityB = ['elesium', 'terminal', 'deen'].indexOf(b.id);
        return (priorityA === -1 ? 99 : priorityA) - (priorityB === -1 ? 99 : priorityB);
      });
    } else if (hour >= 18 && hour < 22) {
      // EVENING: Wellness, Elesium, Deen
      sorted.sort((a, b) => {
        const priorityA = ['wellness', 'elesium', 'deen'].indexOf(a.id);
        const priorityB = ['wellness', 'elesium', 'deen'].indexOf(b.id);
        return (priorityA === -1 ? 99 : priorityA) - (priorityB === -1 ? 99 : priorityB);
      });
    } else {
      // LATE NIGHT (22 - 4): Wellness, Oracle, Self
      sorted.sort((a, b) => {
        const priorityA = ['wellness', 'oracle', 'self'].indexOf(a.id);
        const priorityB = ['wellness', 'oracle', 'self'].indexOf(b.id);
        return (priorityA === -1 ? 99 : priorityA) - (priorityB === -1 ? 99 : priorityB);
      });
    }

    setSortedPillars(sorted);
  }, []);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollX = scrollRef.current.scrollLeft;
    const width = scrollRef.current.clientWidth;
    if (width > 0) {
      const index = Math.round(scrollX / width);
      if (index !== activeIndex && index >= 0 && index < sortedPillars.length) {
        setActiveIndex(index);
      }
    }
  };

  const go = (route: string) => {
    router.push(route);
  };

  return (
    <main className="flex-1 w-full bg-black overflow-hidden relative flex flex-col">
      

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 w-full flex overflow-x-auto snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {sortedPillars.map((p, i) => {
          const isActive = i === activeIndex;
          
          return (
            <motion.div 
              key={p.id} 
              className="h-full w-full min-w-full shrink-0 snap-center flex flex-col justify-center px-6"
              initial={false}
              animate={{ 
                opacity: isActive ? 1 : 0.2,
                scale: isActive ? 1 : 0.92,
                filter: isActive ? 'blur(0px)' : 'blur(4px)'
              }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div 
                className="flex-1 flex flex-col justify-center"
                initial={false}
                animate={{ 
                  x: isActive ? 0 : 20,
                }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-[12px] font-bold tracking-[0.3em] uppercase opacity-80 mb-3" style={{ color: p.color, textShadow: `0 0 12px ${p.color}80` }}>
                  {p.tag}
                </p>
                <h1 className="text-5xl sm:text-6xl font-black tracking-widest text-white mb-6 drop-shadow-2xl">
                  {p.label}
                </h1>
                <div className="h-1 w-20 mb-8 rounded-full shadow-[0_0_15px_currentColor]" style={{ backgroundColor: p.color, color: p.color }} />
                <p className="text-sm text-zinc-300 opacity-90 tracking-[0.1em] leading-relaxed">
                  {p.subtitle}
                </p>
              </motion.div>

              <div className="w-full flex flex-col gap-4 mb-20 relative z-10">
                <Link
                  href={p.route}
                  prefetch={true}
                  onClick={() => setIsNavigatingTo(p.route)}
                  className="w-full rounded-2xl flex items-center justify-center px-6 py-5 transition-all duration-200 border border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.4)] active:scale-95 overflow-hidden relative"
                >
                  <div className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20" style={{ background: `linear-gradient(135deg, transparent, ${p.color}, transparent)` }} />
                  <span className="text-[12px] font-bold tracking-[0.2em] text-white uppercase flex items-center gap-2 relative z-10">
                    {isNavigatingTo === p.route ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        ENTERING...
                      </>
                    ) : (
                      `ENTER ${p.label}`
                    )}
                  </span>
                </Link>

                <Link
                  href="/command"
                  prefetch={false}
                  className="w-full rounded-2xl flex items-center justify-center px-6 py-5 active:scale-95 transition-all duration-200 border border-white/5 bg-black/60 backdrop-blur-md"
                >
                  <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
                    GLOBAL COMMAND
                  </span>
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Pagination Line Indicators */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 pointer-events-none">
        {sortedPillars.map((_, i) => (
          <div 
            key={i} 
            className="h-1 rounded-full transition-all duration-300"
            style={{ 
              width: i === activeIndex ? '32px' : '8px',
              backgroundColor: i === activeIndex ? sortedPillars[i].color : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
    </main>
  );
}

export default function DashboardSwipe() {
  return (
    <ErrorCatcher>
      <DashboardSwipeInner />
    </ErrorCatcher>
  );
}
