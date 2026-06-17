'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef, Component, ErrorInfo, ReactNode, useEffect } from 'react';

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
        <div className="h-[100dvh] w-full bg-red-600 text-white p-8 flex flex-col items-center justify-center z-[9999] absolute inset-0">
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
  { id: 'deen',     label: 'DEEN',     subtitle: 'Salah · Quran · Adhkar',       route: '/folder/DEEN',    color: '#10D86A', tag: 'FOUNDATION' },
  { id: 'fitness',  label: 'FITNESS',  subtitle: 'Workout · Training · Progress', route: '/workout',        color: '#F43F5E', tag: 'BODY' },
  { id: 'wellness', label: 'RECOVERY', subtitle: 'Sleep · Fasting · Hydration',   route: '/wellness',       color: '#22D3EE', tag: 'WELLNESS' },
  { id: 'elesium',  label: 'ELESIUM',  subtitle: 'Sales · Meetings · Revenue',    route: '/folder/ELESIUM', color: '#3B82F6', tag: 'EMPIRE' },
  { id: 'self',     label: 'SELF',     subtitle: 'Reflection · Patterns · Flaws', route: '/folder/SELF',    color: '#A855F7', tag: 'INNER' },
  { id: 'terminal', label: 'TERMINAL', subtitle: 'AI · Chat · Neural Interface',  route: '/chat',           color: '#E879F9', tag: 'ORACLE' },
  { id: 'gamify',   label: 'CRUCIBLE', subtitle: 'Stakes · XP · Screen Time',   route: '/gamification',   color: '#FF3366', tag: 'ENFORCEMENT' },
  { id: 'oracle',   label: 'SYNC',     subtitle: 'Nightly Algorithm Update',      route: '/oracle',         color: '#22C55E', tag: 'THE ORACLE' },
];

function DashboardSwipeInner() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [sortedPillars, setSortedPillars] = useState(PILLARS);
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
      // MIDDAY / WORK: Elesium, Crucible, Deen
      sorted.sort((a, b) => {
        const priorityA = ['elesium', 'gamify', 'deen'].indexOf(a.id);
        const priorityB = ['elesium', 'gamify', 'deen'].indexOf(b.id);
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
    <main className="h-[100dvh] w-full bg-black overflow-hidden relative">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full w-full flex overflow-x-auto snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {sortedPillars.map((p, i) => {
          const isActive = i === activeIndex;
          
          return (
            <div 
              key={p.id} 
              className="h-full w-full shrink-0 snap-center flex flex-col justify-center px-6 transition-opacity duration-300"
              style={{ opacity: isActive ? 1 : 0.3 }}
            >
              <div className="flex-1 flex flex-col justify-center transition-transform duration-500"
                   style={{ transform: isActive ? 'translateX(0px)' : 'translateX(20px)' }}>
                <p className="text-[12px] font-bold tracking-[0.3em] uppercase opacity-60 mb-3" style={{ color: p.color }}>
                  {p.tag}
                </p>
                <h1 className="text-5xl sm:text-6xl font-black tracking-widest text-white mb-6">
                  {p.label}
                </h1>
                <div className="h-1 w-20 mb-8 rounded-full" style={{ backgroundColor: p.color }} />
                <p className="text-sm text-gray-300 opacity-90 tracking-[0.1em] leading-relaxed">
                  {p.subtitle}
                </p>
              </div>

              <div className="w-full flex flex-col gap-4 mb-20">
                <Link
                  href={p.route}
                  prefetch={false}
                  className="w-full rounded-2xl flex items-center justify-center px-6 py-5 active:scale-[0.98] transition-all duration-200 border bg-white/5"
                  style={{ borderColor: p.color }}
                >
                  <span className="text-[12px] font-bold tracking-[0.2em] text-white uppercase">
                    ENTER {p.label}
                  </span>
                </Link>

                <Link
                  href="/command"
                  prefetch={false}
                  className="w-full rounded-2xl flex items-center justify-center px-6 py-5 active:scale-[0.98] transition-all duration-200 border border-white/10 bg-black/60"
                >
                  <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">
                    GLOBAL COMMAND
                  </span>
                </Link>
              </div>
            </div>
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
