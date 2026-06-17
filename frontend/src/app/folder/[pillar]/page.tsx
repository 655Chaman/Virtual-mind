'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Target, 
  Camera, 
  X, 
  Plus, 
  Image as ImageIcon,
  Dumbbell,
  BookOpen,
  TrendingUp,
  FileText,
  Zap,
  CheckCircle,
  Clock,
  Shield,
  Timer,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { api, API_BASE, getLocalDateString } from '@/lib/api';
import { ScrubNumberInput } from '@/components/ui/ScrubNumberInput';
import { PushNotificationToggle } from '@/components/ui/PushNotificationToggle';

const PILLAR_META: Record<string, { label: string; icon: string; color: string; border: string; desc: string; nns: string[] }> = {
  deen: {
    label: 'DEEN',
    icon: '',
    color: 'text-vm-green',        // Jade #10D86A — sacred, divine
    border: 'border-vm-green/40',
    desc: 'Islamic knowledge and spiritual foundation',
    nns: ['salah_5', 'quran_30min', 'adhkar', 'memorization_session', 'fajr_without_alarm'],
  },
  elesium: {
    label: 'ELESIUM',
    icon: '',
    color: 'text-amber-500',     // Amber #F59E0B — digital empire
    border: 'border-amber-500/40',
    desc: 'Economic power and business execution',
    nns: ['deep_work_4hr'],
  },
  influence: {
    label: 'INFLUENCE',
    icon: '',
    color: 'text-vm-glacier',      // Glacier #22D3EE — communication, reach
    border: 'border-vm-glacier/40',
    desc: 'Communication and reach building',
    nns: ['reading_1hr'],
  },
  self: {
    label: 'SELF',
    icon: '',
    color: 'text-vm-amethyst',     // Amethyst #A855F7 — inner consciousness
    border: 'border-vm-amethyst/40',
    desc: 'Physical excellence and mental discipline',
    nns: ['physical_training', 'no_sugar', 'no_phone_before_8', 'ice_bath', 'cold_shower', 'combat_training', 'sleep_on_floor'],
  },
};

const NN_LABELS: Record<string, string> = {
  salah_5: '5 Salah On Time',
  quran_30min: '30 Min Quran',
  adhkar: 'Adhkar',
  memorization_session: 'Memorization',
  fajr_without_alarm: 'Fajr Without Alarm',
  deep_work_4hr: '4hr Deep Work',
  reading_1hr: '1hr Reading',
  physical_training: 'Physical Training',
  no_sugar: 'No Sugar Today',
  cold_shower: 'Cold Shower',
  combat_training: 'Combat Training',
  sleep_on_floor: 'Sleep on Floor',
  learned_concept: 'Learned New Concept',
};

function CalendarDot({ logged, score }: { logged: boolean; score: number }) {
  const color = !logged ? 'bg-surface2' : score >= 80 ? 'bg-vm-green' : score >= 50 ? 'bg-vm-green' : 'bg-vm-red/60';
  return (
    <div className={`w-4 h-4 transition-colors ${color}`} title={`${score}%`} />
  );
}


const formatTo12Hour = (timeStr: string): string => {
  if (!timeStr) return '';
  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const paddedHours = displayHours < 10 ? `0${displayHours}` : displayHours;
  return `${paddedHours}:${displayMinutes} ${ampm}`;
};

function PrayerComplianceWithTimings({
  data,
  prayersLogged,
  handlePrayerToggle,
  prayerHistory,
  onPointClick,
  triggerHaptic,
  setShowPrayerHistoryModal,
  setSelectedAuditDate,
  getLocalDateString
}: {
  data: any;
  prayersLogged: any;
  handlePrayerToggle: (name: string) => void;
  prayerHistory: any[];
  onPointClick: (date: string) => void;
  triggerHaptic: (style: 'light' | 'medium' | 'heavy' | 'success') => void;
  setShowPrayerHistoryModal: (show: boolean) => void;
  setSelectedAuditDate: (date: string) => void;
  getLocalDateString: () => string;
}) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [nextPrayer, setNextPrayer] = useState<string>('');
  const [activePrayer, setActivePrayer] = useState<string>('');
  const prevActivePrayerRef = useRef<string>('');
  const [focusTasks, setFocusTasks] = useState<any[]>([]);

  // Timer effect for AI Tasks
  useEffect(() => {
    const interval = setInterval(() => {
      setFocusTasks(tasks => {
        let changed = false;
        const newTasks = tasks.map(t => {
          if (t.status === 'running' && t.time_remaining !== null && t.time_remaining > 0) {
            changed = true;
            return { ...t, time_remaining: t.time_remaining - 1 };
          } else if (t.status === 'running' && t.time_remaining === 0) {
            changed = true;
            return { ...t, status: 'failed' as const };
          }
          return t;
        });
        return changed ? newTasks : tasks;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data || !data.timings) return;

    const updateTimer = () => {
      const timings = data.timings;
      const now = new Date();
      const nowTime = now.getTime();

      const parsedPrayers = Object.entries(timings).map(([name, timeStr]) => {
        const [hours, minutes] = (timeStr as string).split(':').map(Number);
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
        return { name, date };
      });

      parsedPrayers.sort((a, b) => a.date.getTime() - b.date.getTime());

      let currentActive = '';
      const fajr = parsedPrayers.find(p => p.name === 'Fajr');
      const sunrise = parsedPrayers.find(p => p.name === 'Sunrise');
      const dhuhr = parsedPrayers.find(p => p.name === 'Dhuhr');
      const asr = parsedPrayers.find(p => p.name === 'Asr');
      const maghrib = parsedPrayers.find(p => p.name === 'Maghrib');
      const isha = parsedPrayers.find(p => p.name === 'Isha');

      if (fajr && sunrise && nowTime >= fajr.date.getTime() && nowTime < sunrise.date.getTime()) {
        currentActive = 'Fajr';
      } else if (dhuhr && asr && nowTime >= dhuhr.date.getTime() && nowTime < dhuhr.date.getTime() + 45 * 60000) {
        currentActive = 'Dhuhr';
      } else if (asr && maghrib && nowTime >= asr.date.getTime() && nowTime < asr.date.getTime() + 45 * 60000) {
        currentActive = 'Asr';
      } else if (maghrib && isha && nowTime >= maghrib.date.getTime() && nowTime < isha.date.getTime()) {
        currentActive = 'Maghrib';
      } else if (isha && nowTime >= isha.date.getTime() && nowTime < isha.date.getTime() + 45 * 60000) {
        currentActive = 'Isha';
      }
      setActivePrayer(currentActive);

      if (currentActive && currentActive !== 'Sunrise' && currentActive !== prevActivePrayerRef.current) {
        prevActivePrayerRef.current = currentActive;
        try {
          if (typeof window !== 'undefined' && (window as any).Android) {
            if ((window as any).Android.showNotification) {
              (window as any).Android.showNotification("Prayer Time Started", "Okay, your private time has started right now.");
            }
            if ((window as any).Android.vibrate) {
              (window as any).Android.vibrate(500);
            }
          } else if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification("Prayer Time Started", { body: "Okay, your private time has started right now." });
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then(p => {
                if (p === 'granted') {
                  new Notification("Prayer Time Started", { body: "Okay, your private time has started right now." });
                }
              });
            }
          }
        } catch (e) { /* ignore */ }
      } else if (!currentActive) {
        prevActivePrayerRef.current = '';
      }

      const salahPrayers = parsedPrayers.filter(p => p.name !== 'Sunrise');
      let next = salahPrayers.find(p => p.date.getTime() > nowTime);
      
      if (!next) {
        const firstPrayer = salahPrayers[0];
        next = {
          name: firstPrayer.name,
          date: new Date(firstPrayer.date.getTime() + 24 * 60 * 60000)
        };
      }

      setNextPrayer(next.name);

      // 3. Absolute Time Recalibration to fix JavaScript Event Loop Drift
      const diffMs = next.date.getTime() - Date.now();
      if (diffMs <= 0) {
        setTimeLeft('00h 00m 00s');
        return;
      }
      
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);

      const hStr = hours > 0 ? `${hours}h ` : '';
      const mStr = `${minutes}m `;
      const sStr = `${seconds}s`;
      setTimeLeft(`${hStr}${mStr}${sStr}`);
    };

    updateTimer(); // Initial call
    const timer = setInterval(updateTimer, 1000);

    // Recalibrate immediately when returning from background
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [data]);

  if (!data) {
    return (
      <div className="relative overflow-hidden transition-all duration-500 flex flex-col items-center justify-center min-h-[320px] text-center w-full">
        <div className="animate-spin text-3xl mb-4"></div>
        <p className="text-[10px] text-vm-green tracking-widest uppercase font-mono animate-pulse">
          FETCHING EXACT PRAYER TIMINGS...
        </p>
      </div>
    );
  }

  const timings = data.timings || {};
  const items = [
    { name: 'Fajr', key: 'fajr', isObligatory: true },
    { name: 'Sunrise', key: 'sunrise', isObligatory: false },
    { name: 'Dhuhr', key: 'dhuhr', isObligatory: true },
    { name: 'Asr', key: 'asr', isObligatory: true },
    { name: 'Maghrib', key: 'maghrib', isObligatory: true },
    { name: 'Isha', key: 'isha', isObligatory: true }
  ];

  const securedCount = Object.values(prayersLogged).filter(Boolean).length;

  return (
    <div className="relative w-full space-y-8 pb-4">
      
      {/* HUD Header */}
      <div className="flex flex-col items-center justify-center text-center gap-2 relative z-10 font-mono w-full">
        <span className="text-[10px] text-vm-green tracking-[0.4em] font-bold block mb-1 uppercase">
          {data.hijri_readable || data.hijri}
        </span>
        
        {nextPrayer && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] tracking-[0.3em] text-text-dim font-bold uppercase">
              NEXT PRAYER: {nextPrayer}
            </span>
            <span className="text-4xl sm:text-5xl tracking-widest text-vm-green font-bold uppercase animate-pulse drop-shadow-[0_0_15px_rgba(16,216,106,0.5)]">
              {timeLeft}
            </span>
          </div>
        )}

        <div className="mt-4 flex items-center justify-center">
          <span className="text-vm-green font-bold text-[10px] tracking-widest border-b border-vm-green/30 pb-1">
            {securedCount} / 5 SECURED
          </span>
        </div>
      </div>

      {activePrayer && activePrayer !== 'Sunrise' && (
        <div className="text-center animate-pulse relative z-10 w-full">
          <p className="text-[10px] text-vm-green tracking-[0.3em] font-bold font-mono">
             SALAH PROTOCOL ACTIVE // DROP DUNYA, STAND AND PRAY
          </p>
        </div>
      )}

      {/* Minimalist Stack Layout */}
      <div className="flex flex-col gap-2 relative z-10 font-mono max-w-md mx-auto w-full">
        {items.map(({ name, key, isObligatory }) => {
          const rawTime = timings[name];
          const time = formatTo12Hour(rawTime);
          const isActive = activePrayer === name;
          const isAttended = isObligatory && prayersLogged[key] === true;

          if (!isObligatory) {
            // Sunrise transit item
            return (
              <div
                key={name}
                className="py-3 px-4 flex items-center justify-between opacity-50"
              >
                <div className="flex items-center gap-4">
                  <span className="text-[10px] tracking-widest uppercase font-bold text-text-dim">
                    {name}
                  </span>
                  <span className="text-[8px] text-text-dim tracking-[0.2em] uppercase">
                    TRANSIT
                  </span>
                </div>
                <span className="text-sm font-bold tracking-widest text-text-dim">
                  {time}
                </span>
              </div>
            );
          }

          // Obligatory prayers
          return (
            <button
              key={name}
              onClick={() => handlePrayerToggle(key)}
              className={`py-4 px-6 flex items-center justify-between w-full transition-all active:scale-[0.98] relative border rounded-xl mb-2 ${
                isAttended
                  ? 'border-vm-green/20 text-vm-green bg-vm-green/5'
                  : isActive
                  ? 'border-vm-green text-vm-green bg-vm-green/10'
                  : 'border-surface2 text-text-dim hover:text-white hover:border-vm-green/50 bg-surface/50'
              }`}
            >
              {isActive && !isAttended && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 rounded-r-full bg-vm-green shadow-[0_0_15px_#10D86A]" />
              )}
              
              <div className="flex flex-col text-left">
                <span className={`text-[12px] tracking-widest uppercase font-bold ${
                  isAttended ? 'text-vm-green' : isActive ? 'text-vm-green' : 'text-white'
                }`}>
                  {name}
                </span>
                <span className="text-[8px] text-text-dim tracking-[0.2em] uppercase mt-1">
                  {isAttended ? 'SECURED ' : isActive ? 'ACTIVE NOW' : 'PENDING'}
                </span>
              </div>

              <span className={`text-lg font-bold tracking-widest ${
                isAttended ? 'text-vm-green' : isActive ? 'text-vm-green' : 'text-white'
              }`}>
                {time}
              </span>
            </button>
          );
        })}
      </div>

      {/* PRAYER HISTORY GRAPH INSIDE THE CARD */}
      {prayerHistory && prayerHistory.length > 0 && (
        <div 
          className="mt-8 pt-8 border-t border-white/[0.05] relative w-full z-10 cursor-pointer group flex flex-col items-center max-w-md mx-auto"
          onClick={(e) => { 
            e.stopPropagation();
            triggerHaptic('medium'); 
            setSelectedAuditDate(getLocalDateString()); 
            setShowPrayerHistoryModal(true); 
          }}
        >
          <h4 className="text-[10px] text-text-dim tracking-widest uppercase mb-6 font-mono group-hover:text-vm-green transition-colors flex items-center gap-2">
            14-DAY SALAH VELOCITY <span className="text-[8px] opacity-60 text-vm-green-dim">(CLICK TO AUDIT)</span>
          </h4>
          <PrayerSalahVelocityChart 
            data={prayerHistory} 
            onPointClick={(date) => {
              triggerHaptic('medium');
              setSelectedAuditDate(date);
              setShowPrayerHistoryModal(true);
            }}
          />
        </div>
      )}
    </div>
  );
}

function PrayerSalahVelocityChart({ data, onPointClick }: { data: any[]; onPointClick?: (date: string) => void }) {
  if (!data || data.length === 0) return null;

  // Chronological ordering (oldest → newest)
  const sortedData = data;

  // Fixed viewBox dimensions; SVG will scale responsively via Tailwind classes
  const viewBoxWidth = 400;
  const viewBoxHeight = 64;
  const paddingLeft = 15;
  const paddingRight = 15;
  const paddingTop = 8;
  const paddingBottom = 15;

  const chartWidth = viewBoxWidth - paddingLeft - paddingRight;
  const chartHeight = viewBoxHeight - paddingTop - paddingBottom;

  const getCoords = (index: number, val: number) => {
    const x = paddingLeft + (index / Math.max(1, sortedData.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (val / 5) * chartHeight;
    return { x, y };
  };

  let pathD = '';
  sortedData.forEach((d, i) => {
    const completedCount = d.count || 0;
    const { x, y } = getCoords(i, completedCount);
    if (i === 0) {
      pathD = `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  });

  const gridLines = [0, 2.5, 5];

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="w-full h-auto overflow-visible font-mono text-[6px] fill-text-dim">
        <defs>
          <filter id="prayer-glow-sm" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {/* Grid lines */}
        {gridLines.map((lineVal, idx) => {
          const y = paddingTop + chartHeight - (lineVal / 5) * chartHeight;
          return (
            <line
              key={idx}
              x1={paddingLeft}
              y1={y}
              x2={viewBoxWidth - paddingRight}
              y2={y}
              stroke="rgba(16, 216, 106, 0.08)"
              strokeWidth="0.8"
              strokeDasharray="3 3"
            />
          );
        })}

        {/* Line Path */}
        <path
          d={pathD}
          fill="none"
          stroke="#10D86A"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {sortedData.map((d, i) => {
          const completedCount = d.count || 0;
          const { x, y } = getCoords(i, completedCount);
          const isPerfect = completedCount === 5;
          const dateObj = new Date(d.date);

          let tooltipXOffset = 0;
          if (i === 0) tooltipXOffset = 15;
          else if (i === sortedData.length - 1) tooltipXOffset = -15;

          return (
            <g key={i} className="group/point">
              <circle
                cx={x}
                cy={y}
                r="8"
                fill="transparent"
                className="cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onPointClick?.(d.date); }}
              />
              <circle
                cx={x}
                cy={y}
                r="2.5"
                fill={isPerfect ? '#10D86A' : '#060606'}
                stroke="#10D86A"
                strokeWidth="1.2"
                className="transition-transform duration-150 cursor-pointer group-hover/point:scale-125"
                onClick={(e) => { e.stopPropagation(); onPointClick?.(d.date); }}
              />
              {/* Tooltip */}
              <g className="opacity-0 group-hover/point:opacity-100 transition-opacity duration-150 pointer-events-none">
                <rect
                  x={x - 18 + tooltipXOffset}
                  y={y - 20}
                  width="36"
                  height="12"
                  fill="#060606"
                  stroke="#10D86A"
                  strokeWidth="0.6"
                  rx="1"
                />
                <text
                  x={x + tooltipXOffset}
                  y={y - 12}
                  textAnchor="middle"
                  fill="#10D86A"
                  className="font-bold text-[6px]"
                >
                  {completedCount}/5
                </text>
              </g>
            </g>
          );
        })}

        {/* X axis dates */}
        {sortedData.map((d, i) => {
          if (i % 2 !== 0 && i !== sortedData.length - 1) return null;
          const completedCount = d.count || 0;
          const { x } = getCoords(i, completedCount);
          const dateObj = new Date(d.date);
          const formattedLabel = isNaN(dateObj.getTime())
            ? d.date
            : dateObj.getDate().toString();

          return (
            <text
              key={i}
              x={x}
              y={viewBoxHeight - paddingBottom + 12}
              textAnchor="middle"
              className="fill-text-dim/50 font-mono text-[5.5px]"
            >
              {formattedLabel}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function PrayerCommitmentLogChart({ data, onPointClick }: { data: any[]; onPointClick?: (date: string) => void }) {
  if (!data || data.length === 0) return null;

  // Use data chronologically (left to right = oldest to newest)
  const sortedData = data;

  const width = 500;
  const height = 120;
  const paddingLeft = 30;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getCoords = (index: number, val: number) => {
    const x = paddingLeft + (index / Math.max(1, sortedData.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (val / 5) * chartHeight;
    return { x, y };
  };

  let pathD = '';
  sortedData.forEach((d, i) => {
    const completedCount = d.count || 0;
    const { x, y } = getCoords(i, completedCount);
    if (i === 0) {
      pathD = `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  });

  const gridLines = [0, 1, 2, 3, 4, 5];
  const labelStep = Math.max(1, Math.ceil(sortedData.length / 10));

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible font-mono text-[8px] fill-text-dim">
        <defs>
          <filter id="prayer-glow-lg" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Grid lines */}
        {gridLines.map((lineVal, idx) => {
          const y = paddingTop + chartHeight - (lineVal / 5) * chartHeight;
          return (
            <g key={idx} className="opacity-15">
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#ffffff"
                strokeWidth="0.8"
                strokeDasharray="4 4"
              />
              <text x={paddingLeft - 8} y={y + 3} textAnchor="end" fill="#ffffff">
                {lineVal}
              </text>
            </g>
          );
        })}

        {/* Line Path */}
        <path
          d={pathD}
          fill="none"
          stroke="#10D86A"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {sortedData.map((d, i) => {
          const completedCount = d.count || 0;
          const { x, y } = getCoords(i, completedCount);
          const isPerfect = completedCount === 5;

          let tooltipXOffset = 0;
          if (i === 0) tooltipXOffset = 18;
          else if (i === sortedData.length - 1) tooltipXOffset = -18;

          return (
            <g key={i} className="group/point">
              <circle
                cx={x}
                cy={y}
                r="10"
                fill="transparent"
                className="cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onPointClick?.(d.date); }}
              />
              <circle
                cx={x}
                cy={y}
                r="3.5"
                fill={isPerfect ? '#10D86A' : '#060606'}
                stroke="#10D86A"
                strokeWidth="1.8"
                className="transition-transform duration-150 cursor-pointer group-hover/point:scale-125"
                onClick={(e) => { e.stopPropagation(); onPointClick?.(d.date); }}
              />
              {/* Tooltip */}
              <g className="opacity-0 group-hover/point:opacity-100 transition-opacity duration-150 pointer-events-none">
                <rect
                  x={x - 22 + tooltipXOffset}
                  y={y - 24}
                  width="44"
                  height="15"
                  fill="#060606"
                  stroke="#10D86A"
                  strokeWidth="0.8"
                  rx="2"
                />
                <text
                  x={x + tooltipXOffset}
                  y={y - 14}
                  textAnchor="middle"
                  fill="#10D86A"
                  className="font-bold text-[7.5px]"
                >
                  {completedCount}/5
                </text>
              </g>
            </g>
          );
        })}

        {/* X axis dates */}
        {sortedData.map((d, i) => {
          if (i % labelStep !== 0 && i !== sortedData.length - 1) return null;
          const completedCount = d.count || 0;
          const { x } = getCoords(i, completedCount);
          const dateObj = new Date(d.date);
          const formattedLabel = isNaN(dateObj.getTime())
            ? d.date
            : dateObj.getDate().toString();

          return (
            <text
              key={i}
              x={x}
              y={height - paddingBottom + 16}
              textAnchor="middle"
              className="fill-text-dim/60 font-mono text-[7px]"
            >
              {formattedLabel}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function PillarFolder() {
  const router = useRouter();
  const params = useParams();
  const pillar = (params?.pillar as string)?.toLowerCase();
  const meta = PILLAR_META[pillar];

  const [logs, setLogs] = useState<any[]>([]);
  const [prayerData, setPrayerData] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loadedDate, setLoadedDate] = useState<string>('');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('GPS Denied/Failed:', error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    }
  }, []);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // Today's log for non-negotiables checks
  const [todayLog, setTodayLog] = useState<any>(null);
  const [nns, setNns] = useState<Record<string, boolean>>({});
  const [operatingMode, setOperatingMode] = useState<'optimal' | 'deload' | 'black_swan'>('optimal');
  const [lensCaptured, setLensCaptured] = useState(false);

  // Deen states
  const [tasbihCount, setTasbihCount] = useState(0);
  const [tasbihPhase, setTasbihPhase] = useState('Subhan Allah');
  const [tasbihTotals, setTasbihTotals] = useState({ subhanallah: 0, alhamdulillah: 0, allahuakbar: 0, astaghfirullah: 0, total: 0 });
  const [tasbihHistory, setTasbihHistory] = useState<any>(null);
  const [isTasbihSaving, setIsTasbihSaving] = useState(false);
  const [quranPage, setQuranPage] = useState('');
  const [quranSurah, setQuranSurah] = useState('');
  
  const [showPrayerModal, setShowPrayerModal] = useState(false);
  const [showPrayerHistoryModal, setShowPrayerHistoryModal] = useState(false);
  const [selectedAuditDate, setSelectedAuditDate] = useState<string>('');
  const [isUpdatingHistory, setIsUpdatingHistory] = useState(false);
  const [prayerHistory, setPrayerHistory] = useState<any[]>([]);
  const [prayersLogged, setPrayersLogged] = useState({
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false
  });

  // Elesium states
  const [emailsSent, setEmailsSent] = useState(0);
  const [positiveReplies, setPositiveReplies] = useState(0);
  const [meetingsBooked, setMeetingsBooked] = useState(0);
  const [mrrUsd, setMrrUsd] = useState(0);
  const [isElesiumSaving, setIsElesiumSaving] = useState(false);
  const [elesiumTab, setElesiumTab] = useState<'business' | 'content'>('business');

  // Elesium Content System states
  const [videosPosted, setVideosPosted] = useState(0);
  const [threadsPosted, setThreadsPosted] = useState(0);
  const [contentIdea, setContentIdea] = useState('');
  const [isContentSaving, setIsContentSaving] = useState(false);
  
  type PipelineItem = { id: string; url: string; hook: string; ig: boolean; tw: boolean; li: boolean; dc: boolean };
  const [contentPipeline, setContentPipeline] = useState<PipelineItem[]>([]);
  const [carouselsPosted, setCarouselsPosted] = useState(0);
  const [reelsPosted, setReelsPosted] = useState(0);
  const [longFormPosted, setLongFormPosted] = useState(0);
  const [isRapidLogging, setIsRapidLogging] = useState(false);

  type AITask = { id: string; name: string; estimated_minutes: number | null; xp_reward: number | null; time_remaining: number | null; status: 'pending' | 'running' | 'completed' | 'failed' };
  const [focusTasks, setFocusTasks] = useState<AITask[]>([
    { id: '1', name: '', estimated_minutes: null, xp_reward: null, time_remaining: null, status: 'pending' },
    { id: '2', name: '', estimated_minutes: null, xp_reward: null, time_remaining: null, status: 'pending' },
    { id: '3', name: '', estimated_minutes: null, xp_reward: null, time_remaining: null, status: 'pending' }
  ]);
  const [isEstimatingAI, setIsEstimatingAI] = useState(false);
  const [bottleneck, setBottleneck] = useState('');
  const [failingSystems, setFailingSystems] = useState('');

  // Influence states
  const [wordsWritten, setWordsWritten] = useState('');

  // Self states
  const [disciplineScore, setDisciplineScore] = useState(8);
  const [learningText, setLearningText] = useState('');
  const [studyMaterials, setStudyMaterials] = useState<string>('');
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [isMaterialsLoading, setIsMaterialsLoading] = useState(false);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [entryText, setEntryText] = useState('');

    const loadData = async () => {
      setLoading(true);
      try {
        const todayStr = getLocalDateString();
        setLoadedDate(todayStr);
        const [logsResult, streakResult, elesiumResult, todayLogResult, prayerHistoryResult, tasbihResult] = await Promise.all([
          api.logs.list(30).catch(() => []),
          api.logs.streak().catch(() => null),
          pillar === 'elesium' ? api.elesium.metrics().catch(() => null) : Promise.resolve(null),
          api.logs.today().catch(() => null),
          pillar === 'deen' ? api.deen.prayerHistory().catch(() => []) : Promise.resolve([]),
          pillar === 'deen' ? api.deen.tasbihHistory().catch(() => null) : Promise.resolve(null)
        ]);

        let prayerResult = null;
        if (pillar === 'deen') {
          try {
            prayerResult = await api.deen.prayerTimes(coords?.lat, coords?.lng);
          } catch (e) {
            console.warn('Failed to fetch prayer times');
          }
        }
      setLogs(Array.isArray(logsResult) ? logsResult : []);
      setStreak(streakResult);
      if (prayerResult) {
        setPrayerData(prayerResult);
      }
      if (elesiumResult) {
        setEmailsSent(elesiumResult.emails_sent_today || elesiumResult.emails_sent_total || 0);
        setPositiveReplies(elesiumResult.positive_replies || 0);
        setMeetingsBooked(elesiumResult.meetings_booked_month || 0);
        setMrrUsd(elesiumResult.mrr_proxy || elesiumResult.mrr_usd || 0);
      }
      if (todayLogResult && !todayLogResult.error && todayLogResult.date === todayStr) {
        setTodayLog(todayLogResult);
        setNns(todayLogResult.non_negotiables || {});
        if (todayLogResult.prayers_logged) {
          setPrayersLogged(todayLogResult.prayers_logged);
        }
        if (todayLogResult.score !== undefined && todayLogResult.score !== null) {
          setDisciplineScore(todayLogResult.score);
        }
      } else {
        setTodayLog(null);
        setNns({});
        setDisciplineScore(8);
      }
      if (prayerHistoryResult && Array.isArray(prayerHistoryResult)) {
        setPrayerHistory(prayerHistoryResult);
      }
      if (tasbihResult) {
        setTasbihHistory(tasbihResult);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Structural Fortification: Auto-Deload & Tiering
  const [currentTier, setCurrentTier] = useState<1 | 2>(1);
  const [hasRunFortification, setHasRunFortification] = useState(false);

  useEffect(() => {
    if (pillar === 'self' && logs.length > 0 && !hasRunFortification) {
      setHasRunFortification(true);
      const selfLogs = logs.filter(l => l.pillar?.toLowerCase() === 'self');
      
      // 1. Fatigue Detection
      const selfLogsWithScore = selfLogs.filter(l => l.score !== undefined && l.score !== null);
      if (selfLogsWithScore.length >= 3) {
        const last3 = selfLogsWithScore.slice(0, 3);
        const allBelow5 = last3.every(l => l.score < 5);
        if (allBelow5 && operatingMode !== 'deload') {
          setOperatingMode('deload');
          showToast("SYSTEM DETECTS FATIGUE. FORCING DELOAD PROTOCOL.", "info");
        }
      }

      // 2. Streak Tier Escalation
      if (streak && streak.current_streak >= 7) {
        setCurrentTier(2);
      }
    }
  }, [pillar, logs, operatingMode, streak, hasRunFortification]);

  // Set default audit date when history modal opens
  useEffect(() => {
    if (showPrayerHistoryModal && !selectedAuditDate) {
      setSelectedAuditDate(getLocalDateString());
    }
  }, [showPrayerHistoryModal, selectedAuditDate]);

  // Midnight date-rollover loop
  useEffect(() => {
    if (!loadedDate) return;

    const interval = setInterval(() => {
      const currentLocalDate = getLocalDateString();
      if (currentLocalDate !== loadedDate) {
        showToast("Tracking cycle rolled over to the next day.", "info");
        loadData();
      }
    }, 5000);

    const handleFocus = () => {
      const currentLocalDate = getLocalDateString();
      if (currentLocalDate !== loadedDate) {
        showToast("Tracking cycle rolled over to the next day.", "info");
        loadData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [loadedDate]);

  useEffect(() => {
    if (!pillar || !meta) return;
    
    // Reset all states to prevent stale/incorrect UI flashes from previous pillars
    setTodayLog(null);
    setNns({});
    setPrayersLogged({
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false
    });
    setPrayerHistory([]);
    setTasbihHistory(null);
    setTasbihCount(0);
    setTasbihPhase('Subhan Allah');
    setTasbihTotals({ subhanallah: 0, alhamdulillah: 0, allahuakbar: 0, astaghfirullah: 0, total: 0 });
    setEmailsSent(0);
    setPositiveReplies(0);
    setMeetingsBooked(0);
    setMrrUsd(0);
    setVideosPosted(0);
    setThreadsPosted(0);
    setContentIdea('');
    setWordsWritten('');
    setDisciplineScore(8);
    setLearningText('');
    setUploadedImageUrl(null);
    setEntryText('');

    loadData();
  }, [pillar, meta]);

  if (!meta) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center font-mono text-text-dim">
        PILLAR NOT FOUND
      </div>
    );
  }

  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' | 'success') => {
    try {
      if (typeof window !== 'undefined' && (window as any).Android?.vibrate) {
        const ms = style === 'light' ? 15 : style === 'medium' ? 30 : style === 'heavy' ? 60 : 45;
        (window as any).Android.vibrate(ms);
      }
    } catch (e) { /* ignore */ }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input value so the same photo can be re-selected / camera can be reopened
    e.target.value = '';
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await api.media.upload(file);
      setUploadedImageUrl(res.url);
      if (pillar === 'self') setLensCaptured(true);
      setShowEntryModal(true);
    } catch (err) {
      console.error('Camera upload failed:', err);
      // Show friendly error in the entry modal instead of an alert
      setUploadedImageUrl(null);
      setEntryText('[Camera upload failed — add a note instead]');
      setShowEntryModal(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenTextNote = () => {
    setUploadedImageUrl(null);
    setEntryText('');
    setShowEntryModal(true);
  };

  const submitEntry = async () => {
    if (!entryText.trim() && !uploadedImageUrl) return;
    try {
      await api.logs.addEntry({
        timestamp: new Date().toISOString(),
        pillar: meta.label,
        text: entryText,
        image_url: uploadedImageUrl || undefined
      });
      setShowEntryModal(false);
      setEntryText('');
      setUploadedImageUrl(null);
      await loadData();
      showToast("Entry saved successfully", "success");
    } catch(err) {
      showToast("Save failed", "error");
    }
  };

  const handlePrayerToggle = async (prayerName: string) => {
    const updatedPrayers = { ...prayersLogged, [prayerName]: !prayersLogged[prayerName as keyof typeof prayersLogged] };
    setPrayersLogged(updatedPrayers);
    triggerHaptic(updatedPrayers[prayerName as keyof typeof prayersLogged] ? 'success' : 'light');

    try {
      await api.deen.logPrayers(updatedPrayers);
      await loadData();
    } catch (err) {
      console.error('Failed to log prayer', err);
    }
  };

  const handleLogLearning = async () => {
    if (!learningText.trim()) return;
    try {
      triggerHaptic('medium');
      const tag = operatingMode === 'black_swan' ? 'BLACK_SWAN_AUTOPSY' : operatingMode === 'deload' ? 'DELOAD_LOG' : 'LEARNING/CONCEPT';
      await api.logs.addEntry({
        timestamp: new Date().toISOString(),
        pillar: meta.label,
        text: `[${tag}] ${learningText}`,
      });
      setLearningText('');
      await loadData();
      triggerHaptic('success');
      showToast("Entry logged successfully", "success");
    } catch(err) {
      showToast("Save failed", "error");
    }
  };

  const handleOpenMaterials = async () => {
    triggerHaptic('medium');
    setShowMaterialsModal(true);
    if (!studyMaterials) {
      setIsMaterialsLoading(true);
      try {
        const res = await api.logs.materials();
        setStudyMaterials(res.content || 'No study materials found.');
      } catch (err) {
        setStudyMaterials('Failed to load study materials.');
      } finally {
        setIsMaterialsLoading(false);
      }
    }
  };

  // --- Bespoke Workspace Event Handlers ---

  // Salah check update
  const handleNNToggle = async (key: string, checked: boolean) => {
    triggerHaptic(checked ? 'success' : 'light');
    const updatedNns = { ...nns, [key]: checked };
    setNns(updatedNns);

    try {
      const todayStr = getLocalDateString();
      const logData = {
        date: todayStr,
        timestamp: new Date().toISOString(),
        text: todayLog?.text || `Updated focus non-negotiables from ${meta.label} terminal`,
        pillars: todayLog?.pillars || [meta.label],
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
      };
      
      const result = await api.logs.submit(logData);
      setTodayLog({
        ...logData,
        xp_earned: result.xp_earned,
      });
    } catch (err) {
      console.error('Failed to submit logs check', err);
    }
  };

  // Tasbih digital click counter
  const handleTasbihTap = () => {
    triggerHaptic('light');
    const nextCount = tasbihCount + 1;
    setTasbihCount(nextCount);
    
    const phaseKey = tasbihPhase.toLowerCase().replace(' ', '').replace(' ', '');
    setTasbihTotals(prev => ({ ...prev, total: prev.total + 1, [phaseKey]: (prev[phaseKey as keyof typeof prev] || 0) + 1 }));

    // Auto recitations switcher (cycles 1 to 33)
    if (tasbihPhase === 'Subhan Allah' && nextCount >= 33) {
      triggerHaptic('heavy');
      setTasbihPhase('Alhamdulillah');
      setTasbihCount(0);
    } else if (tasbihPhase === 'Alhamdulillah' && nextCount >= 33) {
      triggerHaptic('heavy');
      setTasbihPhase('Allahu Akbar');
      setTasbihCount(0);
    } else if (tasbihPhase === 'Allahu Akbar' && nextCount >= 33) {
      triggerHaptic('heavy');
      setTasbihPhase('Astaghfirullah');
      setTasbihCount(0);
    }
  };

  const TASBIH_PHASES = ['Subhan Allah', 'Alhamdulillah', 'Allahu Akbar', 'Astaghfirullah'];

  const handleTasbihPrev = () => {
    triggerHaptic('light');
    const currentIndex = TASBIH_PHASES.indexOf(tasbihPhase);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : TASBIH_PHASES.length - 1;
    setTasbihPhase(TASBIH_PHASES[prevIndex]);
    setTasbihCount(0);
  };

  const handleTasbihNext = () => {
    triggerHaptic('light');
    const currentIndex = TASBIH_PHASES.indexOf(tasbihPhase);
    const nextIndex = (currentIndex + 1) % TASBIH_PHASES.length;
    setTasbihPhase(TASBIH_PHASES[nextIndex]);
    setTasbihCount(0);
  };

  const handleTasbihSave = async () => {
    if (tasbihTotals.total === 0) return;
    setIsTasbihSaving(true);
    triggerHaptic('medium');
    try {
      await api.deen.logTasbih(tasbihTotals);
      triggerHaptic('success');
      
      setTasbihCount(0);
      setTasbihPhase('Subhan Allah');
      setTasbihTotals({ subhanallah: 0, alhamdulillah: 0, allahuakbar: 0, astaghfirullah: 0, total: 0 });
      
      await loadData();
      showToast("Tasbih counts saved", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to save Tasbih logs", "error");
    } finally {
      setIsTasbihSaving(false);
    }
  };

  const handleTasbihReset = () => {
    triggerHaptic('medium');
    setTasbihCount(0);
    setTasbihPhase('Subhan Allah');
    setTasbihTotals({ subhanallah: 0, alhamdulillah: 0, allahuakbar: 0, astaghfirullah: 0, total: 0 });
  };

  // Quran log submit
  const handleQuranSubmit = async () => {
    if (!quranPage.trim() && !quranSurah.trim()) return;
    const textLog = ` [QURAN TRACKER] Successfully read Surah ${quranSurah || 'N/A'}, Page/Ayah: ${quranPage || 'N/A'}`;
    try {
      await api.logs.addEntry({
        timestamp: new Date().toISOString(),
        pillar: 'DEEN',
        text: textLog,
      });
      // Automatically toggle Quran NN to checked!
      await handleNNToggle('quran_30min', true);
      
      setQuranPage('');
      setQuranSurah('');
      await loadData();
      showToast("Quran reading logged", "success");
    } catch(err) {
      showToast("Quran log failed", "error");
    }
  };

  // Elesium Business Metrics Update
  const handleElesiumSave = async () => {
    setIsElesiumSaving(true);
    triggerHaptic('success');
    try {
      // Patch both local states and database
      await (api as any).elesium.updateMetrics({
        emails_sent_today: emailsSent,
        positive_replies: positiveReplies,
        meetings_booked_month: meetingsBooked,
        mrr_usd: mrrUsd
      });
      showToast("Elesium metrics synced", "success");
      await loadData();
    } catch(err) {
      showToast("Elesium metrics sync failed", "error");
    } finally {
      setIsElesiumSaving(false);
    }
  };

  // Influence Essay templates
  const handleInfluenceTemplate = (tag: string) => {
    triggerHaptic('light');
    setUploadedImageUrl(null);
    setEntryText(` ${tag} \n- Title:\n- Hook Concept:\n- Rhetorical Hooks:\n- core_message:\n`);
    setShowEntryModal(true);
  };

  const handleWordCountSubmit = async () => {
    if (!wordsWritten.trim()) return;
    const count = parseInt(wordsWritten);
    if (isNaN(count)) return;
    const textLog = ` [WRITING ENGINE] Logged ${count} written words into the Elesium content pipeline.`;
    try {
      await api.logs.addEntry({
        timestamp: new Date().toISOString(),
        pillar: 'INFLUENCE',
        text: textLog,
      });
      setWordsWritten('');
      await loadData();
      showToast("Words logged successfully", "success");
    } catch(err) {
      showToast("Word log failed", "error");
    }
  };

  // Self accountability slider
  const handleDisciplineScoreSubmit = async () => {
    triggerHaptic('success');
    const todayStr = getLocalDateString();
    
    const logData = {
      date: todayStr,
      timestamp: new Date().toISOString(),
      text: todayLog?.text || "Daily logs from SELF terminal",
      pillars: todayLog?.pillars || ['SELF'],
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
        memorization_session: false,
        app_lock_on: false,
        sleep_on_floor: false,
        combat_training: false,
        fajr_without_alarm: false,
        smt_completed: false,
        ramadan_mode_active: false,
        ...(todayLog?.non_negotiables || {})
      },
      flaw_triggers: todayLog?.flaw_triggers || [],
      score: disciplineScore,
      work_done: todayLog?.work_done || null,
      lessons_learned: todayLog?.lessons_learned || null,
      folder_entries: todayLog?.folder_entries || []
    };

    try {
      // 1. Submit updated log containing the score
      await api.logs.submit(logData);

      // 2. Add entry to folder feed for visibility
      const textLog = ` [DISCIPLINE ENGINE] Self-reported accountability score: ${disciplineScore}/10 today. Status: Focused, zero alarm overrides.`;
      await api.logs.addEntry({
        timestamp: new Date().toISOString(),
        pillar: 'SELF',
        text: textLog,
      });

      showToast("Discipline score secured for today", "success");
      await loadData();
    } catch(err) {
      showToast("Discipline score failed to save", "error");
    }
  };

  // --- Computations ---
  const today = new Date();
  const days30: Date[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days30.push(d);
  }

  const logMap: Record<string, any> = {};
  logs.forEach(l => { if (l.date) logMap[l.date] = l; });

  const nnStats: Record<string, { done: number; total: number }> = {};
  meta.nns.forEach(nn => { nnStats[nn] = { done: 0, total: 0 }; });

  logs.forEach(log => {
    const nns = log.non_negotiables ?? {};
    meta.nns.forEach(nn => {
      nnStats[nn].total++;
      if (nns[nn]) nnStats[nn].done++;
    });
  });

  const pillarStreak = streak?.pillar_streaks?.[meta.label] ?? 0;
  const pillarXP = logs.reduce((sum, l) => sum + (l.xp_earned ?? 0), 0);

  // Extract folder entries for this pillar
  const pillarEntries: any[] = [];
  logs.forEach(log => {
    if (log.folder_entries) {
      log.folder_entries.forEach((e: any) => {
        if (e.pillar === meta.label) pillarEntries.push(e);
      });
    }
  });
  pillarEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Graph data: 14 days
  const barData = [];
  let maxEntries = 0;
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    let count = 0;
    pillarEntries.forEach(e => {
      if (e.timestamp.startsWith(dateStr)) count++;
    });
    if (count > maxEntries) maxEntries = count;
    barData.push({ date: dateStr, count, dayLabel: d.getDate() });
  }

  return (
    <div className="min-h-screen bg-obsidian text-gray-300 font-mono relative pb-24">
      <div className="scanline-overlay" />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-obsidian/95 backdrop-blur border-b border-white/[0.04] px-6 py-4 pt-safe flex items-center gap-4">
        <button id={`${pillar}-back-btn`} onClick={() => router.push('/home')} className={`text-text-dim hover:${meta.color.replace("text-", "text-")} transition-colors`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className={`text-lg sm:text-xl font-heading tracking-[0.3em] uppercase ${meta.color} flex items-center gap-2`}>
          {meta.icon} {meta.label}
        </h1>
      </header>

      <div className="px-4 py-6 max-w-5xl mx-auto space-y-8">

        {/* ─── DYNAMIC UNIQUE WORKSPACE MODULES ─────────────────────────────── */}
        
        {/*  DEEN SPIRITUAL INTERFACE */}
        {pillar === 'deen' && (
          <div className="space-y-6 animate-fade-up">
            {prayerData && (
              <PrayerComplianceWithTimings 
                data={prayerData}
                prayersLogged={prayersLogged}
                handlePrayerToggle={handlePrayerToggle}
                prayerHistory={prayerHistory}
                onPointClick={(date) => {
                  triggerHaptic('medium');
                  setSelectedAuditDate(date);
                  setShowPrayerHistoryModal(true);
                }}
                triggerHaptic={triggerHaptic}
                setShowPrayerHistoryModal={setShowPrayerHistoryModal}
                setSelectedAuditDate={setSelectedAuditDate}
                getLocalDateString={getLocalDateString}
              />
            )}

            {/* Notification settings card */}
            <PushNotificationToggle />

            {/*  SPIRITUAL HABITS */}
            <div className="w-full flex flex-col items-center justify-center pt-4 pb-4 max-w-lg mx-auto">
              <h3 className="text-[10px] font-bold tracking-[0.3em] text-vm-green/70 mb-6 uppercase flex items-center gap-2">
                 SPIRITUAL HABITS
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                {[
                  { key: 'fajr_without_alarm', label: ' FAJR ON TIME' },
                  { key: 'adhkar', label: ' ADHKAR' },
                  { key: 'quran_30min', label: ' QURAN 30M' },
                  { key: 'memorization_session', label: ' MEMORIZE' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => handleNNToggle(item.key, !nns[item.key])}
                    className={`py-4 px-3 border rounded-xl text-center flex flex-col items-center justify-center h-24 transition-all active:scale-95 ${
                      nns[item.key] 
                        ? 'border-vm-green bg-vm-green/10 text-vm-green shadow-[0_0_15px_rgba(16,216,106,0.2)]' 
                        : 'border-white/[0.05] bg-surface/30 text-text-dim hover:border-vm-green/30 hover:text-vm-green'
                    }`}
                  >
                    <span className="text-[10px] sm:text-xs font-bold tracking-wider font-mono mb-2">{item.label}</span>
                    <span className={`text-[8px] sm:text-[9px] tracking-widest uppercase block ${nns[item.key] ? 'text-vm-green' : 'text-text-dim/50'}`}>
                      {nns[item.key] ? 'SECURED' : 'PENDING'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tasbih counter */}
            <div className="w-full flex flex-col items-center justify-center pt-8 pb-4">
              <h3 className="text-[10px] font-bold tracking-[0.3em] text-vm-green/70 mb-8 uppercase flex items-center gap-2 self-center">
                 NATIVE TASBIH ENGINE
              </h3>
              
              <div className="w-full flex flex-col items-center gap-8 max-w-md mx-auto">
                <div className="text-center w-full flex flex-col items-center">
                  <span className="text-[8px] text-text-dim tracking-[0.4em] uppercase block mb-3">CURRENT RECITATION</span>
                  <div className="flex items-center justify-between w-full px-4">
                    <button 
                      onClick={handleTasbihPrev}
                      className="p-3 text-vm-green/30 hover:text-vm-green transition-colors active:scale-95 rounded-xl"
                    >
                      <ChevronLeft className="w-8 h-8" />
                    </button>
                    <span className="text-xl sm:text-2xl md:text-3xl font-black text-vm-green tracking-widest uppercase drop-shadow-[0_0_15px_rgba(16,216,106,0.5)] flex-1 text-center font-heading">
                      {tasbihPhase}
                    </span>
                    <button 
                      onClick={handleTasbihNext}
                      className="p-3 text-vm-green/30 hover:text-vm-green transition-colors active:scale-95 rounded-xl"
                    >
                      <ChevronRight className="w-8 h-8" />
                    </button>
                  </div>
                  <span className="text-[8px] text-text-dim/50 mt-4 uppercase tracking-[0.3em] font-mono block">
                    Target: 33 (Subhan Allah) → 33 (Alhamdulillah) → 33 (Allahu Akbar) → ∞ (Astaghfirullah)
                  </span>
                </div>
                
                <button 
                  onClick={handleTasbihTap}
                  className="w-full aspect-square max-w-[280px] rounded-full border border-vm-green/20 hover:border-vm-green/50 active:scale-95 transition-all flex flex-col items-center justify-center relative group"
                  style={{ backgroundColor: 'var(--color-obsidian)' }}
                >
                  <div className="absolute inset-4 rounded-full border border-vm-green/10 group-hover:border-vm-green/30 transition-colors" />
                  <span className="text-7xl sm:text-9xl font-black text-vm-green font-mono drop-shadow-[0_0_20px_rgba(16,216,106,0.8)] z-10">{tasbihCount}</span>
                  <span className="text-[10px] sm:text-xs text-vm-green tracking-[0.5em] uppercase font-bold mt-4 z-10">TAP TO COUNT</span>
                </button>

                <div className="flex w-full flex-col gap-4 items-center mt-4">
                  <div className="flex gap-6 text-[10px] tracking-[0.2em] font-mono uppercase text-text-dim">
                    <span>SESSION: <span className="text-vm-green font-bold">{tasbihTotals.total}</span></span>
                    {tasbihHistory && (
                      <span>ALL-TIME: <span className="text-vm-green font-bold">{tasbihHistory.all_time_total}</span></span>
                    )}
                  </div>
                  <div className="flex gap-4 w-full">
                    <button 
                      onClick={handleTasbihReset}
                      className="flex-1 py-4 border border-white/[0.05] hover:border-vm-red/40 text-[10px] text-text-dim hover:text-vm-red transition-colors font-mono tracking-widest uppercase active:scale-95 rounded-xl"
                    >
                      RESET
                    </button>
                    <button 
                      onClick={handleTasbihSave}
                      disabled={isTasbihSaving || tasbihTotals.total === 0}
                      className="flex-1 py-4 border border-vm-green/40 bg-vm-green/5 hover:bg-vm-green/10 text-[10px] text-vm-green transition-colors font-mono tracking-widest uppercase active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed font-bold rounded-xl"
                    >
                      {isTasbihSaving ? 'SAVING...' : 'SECURE & SAVE'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quran progress log */}
            <div className="w-full flex flex-col gap-6 pt-8 pb-4 max-w-md mx-auto">
              <h3 className="text-[10px] font-bold tracking-[0.3em] text-vm-green/70 uppercase flex items-center justify-center gap-2">
                 QURAN LOGGER
              </h3>
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[8px] text-text-dim tracking-[0.3em] uppercase font-mono block">Surah Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Al-Mulk"
                      value={quranSurah}
                      onChange={e => setQuranSurah(e.target.value)}
                      className="w-full bg-surface border border-surface2 p-3 text-sm text-vm-green outline-none focus:border-vm-green/50 font-mono transition-colors text-center placeholder:text-white/20 rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[8px] text-text-dim tracking-[0.3em] uppercase font-mono block">Page / Ayah</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Page 562"
                      value={quranPage}
                      onChange={e => setQuranPage(e.target.value)}
                      className="w-full bg-surface border border-surface2 p-3 text-sm text-vm-green outline-none focus:border-vm-green/50 font-mono transition-colors text-center placeholder:text-white/20 rounded-xl"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleQuranSubmit}
                  disabled={!quranPage.trim() && !quranSurah.trim()}
                  className="w-full py-4 border border-vm-green/40 bg-vm-green/5 hover:border-vm-green hover:bg-vm-green/10 text-vm-green font-bold tracking-[0.3em] text-[10px] disabled:opacity-30 transition-all uppercase mt-2 rounded-xl"
                >
                  LOG PROGRESS
                </button>
              </div>
            </div>

            {/* Prayer History Graph — Borderless */}
            {prayerHistory.length > 0 && (
              <div 
                className="w-full pt-8 cursor-pointer group flex flex-col items-center max-w-md mx-auto pb-12"
                onClick={() => { 
                  triggerHaptic('medium'); 
                  setSelectedAuditDate(getLocalDateString()); 
                  setShowPrayerHistoryModal(true); 
                }}
              >
                <div className="flex flex-col items-center justify-center w-full mb-8">
                  <h2 className="text-[10px] font-bold tracking-[0.3em] text-vm-green flex items-center gap-2 group-hover:text-vm-green/70 transition-colors uppercase">
                     PRAYER COMMITMENT LOG
                  </h2>
                  <span className="text-[8px] opacity-50 font-mono tracking-widest text-text-dim mt-2 uppercase">(CLICK TO AUDIT)</span>
                  
                  {/* Streak badge */}
                  {(() => {
                    let streak = 0;
                    for (let i = prayerHistory.length - 1; i >= 0; i--) {
                      if (prayerHistory[i].count === 5) streak++;
                      else break;
                    }
                    return streak > 0 ? (
                      <span className="mt-4 text-[9px] border-b border-vm-green/30 pb-1 text-vm-green font-bold tracking-[0.3em] font-mono">
                         {streak}D STREAK
                      </span>
                    ) : null;
                  })()}
                </div>

                {/* Line chart */}
                <div className="w-full mb-6 relative">
                  <div className="absolute inset-0 bg-vm-green/5 blur-2xl rounded-full" />
                  <PrayerCommitmentLogChart 
                    data={prayerHistory} 
                    onPointClick={(date) => {
                      triggerHaptic('medium');
                      setSelectedAuditDate(date);
                      setShowPrayerHistoryModal(true);
                    }}
                  />
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/[0.05] w-full">
                  <div className="text-center flex flex-col gap-1">
                    <p className="text-xl sm:text-2xl font-bold text-vm-green font-mono">
                      {prayerHistory.filter(d => d.count === 5).length}
                    </p>
                    <p className="text-[8px] text-text-dim tracking-[0.3em] uppercase">5/5 DAYS</p>
                  </div>
                  <div className="text-center flex flex-col gap-1">
                    <p className="text-xl sm:text-2xl font-bold text-vm-green font-mono">
                      {prayerHistory.length > 0 
                        ? Math.round((prayerHistory.reduce((s, d) => s + d.count, 0) / (prayerHistory.length * 5)) * 100)
                        : 0}%
                    </p>
                    <p className="text-[8px] text-text-dim tracking-[0.3em] uppercase">COMPLETION</p>
                  </div>
                  <div className="text-center flex flex-col gap-1">
                    <p className="text-xl sm:text-2xl font-bold text-vm-green font-mono">
                      {prayerHistory.reduce((s, d) => s + d.count, 0)}
                    </p>
                    <p className="text-[8px] text-text-dim tracking-[0.3em] uppercase">TOTAL SALAH</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/*  ELESIUM EMPIRE — BUSINESS + CONTENT */}
        {pillar === 'elesium' && (
          <div className="space-y-6 animate-fade-up">
            
            {/* Premium Tabs Selector */}
            <div className="flex bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <button
                onClick={() => { triggerHaptic('light'); setElesiumTab('business'); }}
                className={`flex-1 py-3 text-[11px] font-bold tracking-[0.2em] uppercase transition-all duration-300 rounded-lg flex items-center justify-center gap-2 ${
                  elesiumTab === 'business'
                    ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-500 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'text-text-dim hover:text-white hover:bg-white/5'
                }`}
              >
                Business
              </button>
              <button
                onClick={() => { triggerHaptic('light'); setElesiumTab('content'); }}
                className={`flex-1 py-3 text-[11px] font-bold tracking-[0.2em] uppercase transition-all duration-300 rounded-lg flex items-center justify-center gap-2 ${
                  elesiumTab === 'content'
                    ? 'bg-gradient-to-r from-purple-500/20 to-purple-500/5 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(167,139,250,0.15)]'
                    : 'text-text-dim hover:text-white hover:bg-white/5'
                }`}
              >
                Content
              </button>
            </div>

            {/* ── CONTAINER 1: BUSINESS ─────────────────────────────────── */}
            {elesiumTab === 'business' && (
            <div
              className="relative overflow-hidden space-y-6 p-6 rounded-2xl animate-fade-up"
              style={{
                borderColor: 'rgba(245,158,11,0.2)',
                borderWidth: '1px',
                background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(0,0,0,0.85) 100%)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(245,158,11,0.15)',
                backdropFilter: 'blur(12px)'
              }}
            >
              {/* Section header */}
              <div className="flex flex-col gap-2 mb-4">
                <h3 className="text-sm font-bold tracking-[0.25em] text-amber-500 uppercase font-mono drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">DYNAMIC OPERATIONS</h3>
                <p className="text-[9px] text-text-dim tracking-[0.2em] uppercase font-mono">Daily Questionnaire · Iterations · Focus</p>
              </div>

              {/* Questionnaire Form */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] text-amber-500/80 font-bold tracking-widest uppercase font-mono">
                    What is the primary operational bottleneck today?
                  </label>
                  <textarea 
                    value={bottleneck}
                    onChange={(e) => setBottleneck(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 focus:border-amber-500/40 rounded-xl p-4 text-sm text-white font-mono placeholder:text-white/20 outline-none transition-all resize-none min-h-[80px]"
                    placeholder="e.g. The website is not indexing on Google search..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-amber-500/80 font-bold tracking-widest uppercase font-mono">
                    What systems are failing & require iteration?
                  </label>
                  <textarea 
                    value={failingSystems}
                    onChange={(e) => setFailingSystems(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 focus:border-amber-500/40 rounded-xl p-4 text-sm text-white font-mono placeholder:text-white/20 outline-none transition-all resize-none min-h-[80px]"
                    placeholder="e.g. SEO tagging, meta descriptions, sitemap structure..."
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-amber-500/80 font-bold tracking-widest uppercase font-mono">
                      Daily Uncompromising Focus Tasks
                    </label>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setFocusTasks([...focusTasks, { id: Math.random().toString(), name: '', estimated_minutes: null, xp_reward: null, time_remaining: null, status: 'pending' }])}
                        className="w-6 h-6 rounded flex items-center justify-center bg-amber-500/10 text-amber-500 hover:bg-amber-500/30 transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {focusTasks.map((task, i) => (
                      <div key={task.id} className={`flex flex-col gap-2 bg-black/30 border p-3 rounded-lg transition-all group ${
                        task.status === 'completed' ? 'border-vm-green/40 opacity-60' : 
                        task.status === 'failed' ? 'border-red-500/40 opacity-60' : 
                        task.status === 'running' ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-white/5 hover:border-amber-500/20'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                            task.status === 'completed' ? 'border-vm-green bg-vm-green/20' : 'border-amber-500/40'
                          }`}>
                            {task.status === 'completed' && <div className="w-2 h-2 bg-vm-green rounded-full" />}
                          </div>
                          <input 
                            type="text" 
                            value={task.name}
                            onChange={(e) => {
                              const newTasks = [...focusTasks];
                              newTasks[i] = { ...task, name: e.target.value };
                              setFocusTasks(newTasks);
                            }}
                            disabled={task.status !== 'pending'}
                            className="bg-transparent border-none outline-none text-xs font-mono text-white w-full placeholder:text-white/20 disabled:opacity-50"
                            placeholder={`Focus Action 0${i + 1}`}
                          />
                          {task.status === 'pending' && (
                            <button 
                              onClick={() => setFocusTasks(focusTasks.filter((_, index) => index !== i))}
                              className="text-text-dim hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* AI Active Status Bar */}
                        {task.status !== 'pending' && task.estimated_minutes && (
                          <div className="pl-7 pr-2 flex items-center justify-between text-[10px] font-mono">
                            <div className="flex items-center gap-3">
                              <span className={`font-bold ${task.status === 'failed' ? 'text-red-500' : 'text-amber-500/80'}`}>
                                {task.time_remaining !== null 
                                  ? `${Math.floor(task.time_remaining / 60).toString().padStart(2, '0')}:${(task.time_remaining % 60).toString().padStart(2, '0')}` 
                                  : '00:00'}
                              </span>
                              <span className="text-purple-400 font-bold">+{task.xp_reward} XP</span>
                            </div>
                            
                            {task.status === 'running' && (
                              <button 
                                onClick={async () => {
                                  triggerHaptic('success');
                                  const newTasks = [...focusTasks];
                                  newTasks[i] = { ...task, status: 'completed' };
                                  setFocusTasks(newTasks);
                                  await api.logs.addEntry({
                                    timestamp: new Date().toISOString(),
                                    pillar: 'ELESIUM',
                                    text: `[AI GAMIFICATION SUCCESS] Earned ${task.xp_reward} XP for finishing: ${task.name}`
                                  });
                                }}
                                className="px-3 py-1 bg-vm-green/20 text-vm-green border border-vm-green/30 rounded font-bold hover:bg-vm-green/30 transition-all shadow-[0_0_10px_rgba(16,216,106,0.2)]"
                              >
                                COMPLETE
                              </button>
                            )}
                            {task.status === 'completed' && <span className="text-vm-green">ACCOMPLISHED</span>}
                            {task.status === 'failed' && <span className="text-red-500">FAILED</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* AI Estimate Button */}
                  {focusTasks.some(t => t.status === 'pending' && t.name.trim() !== '') && (
                    <button
                      disabled={isEstimatingAI}
                      onClick={async () => {
                        setIsEstimatingAI(true);
                        triggerHaptic('light');
                        try {
                          const activeNames = focusTasks.filter(t => t.status === 'pending' && t.name.trim() !== '').map(t => t.name);
                          if (activeNames.length === 0) return;
                          
                          const response = await fetch('/api/oracle/estimate-tasks', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ tasks: activeNames })
                          });
                          const data = await response.json();
                          
                          if (data.estimates) {
                            const newTasks = focusTasks.map(t => {
                              if (t.status === 'pending' && t.name.trim() !== '') {
                                const estimate = data.estimates.find((e: any) => e.task_name === t.name);
                                if (estimate) {
                                  return { 
                                    ...t, 
                                    estimated_minutes: estimate.estimated_minutes,
                                    xp_reward: estimate.xp_reward,
                                    time_remaining: estimate.estimated_minutes * 60,
                                    status: 'running' as const
                                  };
                                }
                              }
                              return t;
                            });
                            setFocusTasks(newTasks);
                            triggerHaptic('medium');
                          }
                        } catch (e) {
                          console.error('Failed AI estimate', e);
                        } finally {
                          setIsEstimatingAI(false);
                        }
                      }}
                      className="w-full py-3 bg-gradient-to-r from-purple-500/10 to-purple-600/5 hover:from-purple-500/20 hover:to-purple-600/10 text-purple-400 border border-purple-500/30 rounded-xl font-mono text-[10px] font-bold tracking-[0.2em] transition-all shadow-[0_0_15px_rgba(167,139,250,0.15)] flex items-center justify-center gap-2"
                    >
                      {isEstimatingAI ? 'CALCULATING CONSTRAINTS...' : 'ESTIMATE AI TIME & START'}
                    </button>
                  )}
                </div>
              </div>

              {/* Save Action */}
              <div className="pt-4 border-t border-white/5 mt-6">
                <button
                  disabled={isElesiumSaving}
                  onClick={async () => {
                    setIsElesiumSaving(true);
                    triggerHaptic('medium');
                    try {
                      const activeTasks = focusTasks.filter(t => t.name.trim() !== '').map(t => t.name);
                      const textToLog = `[ELESIUM DAILY OPS]
Bottleneck: ${bottleneck.trim() || 'None specified'}
Failing Systems: ${failingSystems.trim() || 'None specified'}
Focus Tasks: ${activeTasks.length > 0 ? activeTasks.join(', ') : 'None specified'}`;

                      await api.logs.addEntry({
                        timestamp: new Date().toISOString(),
                        pillar: 'ELESIUM',
                        text: textToLog,
                      });
                      triggerHaptic('success');
                      await loadData();
                    } catch (e) {
                      console.error('Failed to log daily operations', e);
                    } finally {
                      setIsElesiumSaving(false);
                    }
                  }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 text-amber-400 border border-amber-500/40 rounded-xl font-bold tracking-[0.2em] text-[11px] disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-95"
                >
                  {isElesiumSaving ? 'LOCKING IN...' : 'LOCK IN DAILY OPERATIONS'}
                </button>
              </div>
            </div>
            )}

            {/* ── CONTAINER 2: CONTENT SYSTEM ───────────────────────────── */}
            {elesiumTab === 'content' && (
            <div
              className="relative overflow-hidden space-y-6 p-6 rounded-2xl animate-fade-up"
              style={{
                borderColor: 'rgba(167,139,250,0.2)',
                borderWidth: '1px',
                background: 'linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(0,0,0,0.85) 100%)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(167,139,250,0.15)',
                backdropFilter: 'blur(12px)'
              }}
            >
              {/* Section header */}
              <div className="flex flex-col gap-2 mb-4">
                <h3 className="text-sm font-bold tracking-[0.25em] text-purple-400 uppercase font-mono drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]">CONTENT DISTRIBUTION</h3>
                <p className="text-[9px] text-text-dim tracking-[0.2em] uppercase font-mono">Central Node · Automated Routing · Mind Map</p>
              </div>

              {/* Rapid Tally Engine */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-6 border-b border-white/5">
                {[
                  { label: 'CAROUSELS', count: carouselsPosted, setter: setCarouselsPosted, field: 'carousels' },
                  { label: 'REELS/SHORTS', count: reelsPosted, setter: setReelsPosted, field: 'reels' },
                  { label: 'THREADS', count: threadsPosted, setter: setThreadsPosted, field: 'threads' },
                  { label: 'LONG FORM', count: longFormPosted, setter: setLongFormPosted, field: 'long_form' }
                ].map((item) => (
                  <div key={item.label} className="bg-black/40 border border-purple-500/20 p-3 rounded-xl flex flex-col items-center gap-2 group hover:border-purple-500/50 transition-all">
                    <span className="text-[9px] text-purple-400/80 font-mono tracking-widest">{item.label}</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={async () => {
                          if (item.count > 0) item.setter(c => c - 1);
                        }}
                        className="w-6 h-6 rounded bg-white/5 text-white/40 hover:bg-white/10 hover:text-white flex items-center justify-center transition-all"
                      >-</button>
                      <span className="text-xl font-bold font-mono text-white min-w-[24px] text-center">{item.count}</span>
                      <button 
                        disabled={isRapidLogging}
                        onClick={async () => {
                          triggerHaptic('light');
                          item.setter(c => c + 1);
                          setIsRapidLogging(true);
                          try {
                            await fetch('/api/elesium/content/log', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ [item.field]: 1 })
                            });
                            triggerHaptic('success');
                          } catch (e) {
                            console.error('Failed to rapid log content', e);
                          } finally {
                            setIsRapidLogging(false);
                          }
                        }}
                        className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/40 flex items-center justify-center transition-all shadow-[0_0_10px_rgba(167,139,250,0.2)]"
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Pipeline */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-dim tracking-widest uppercase font-mono">ACTIVE DISTRIBUTION PIPELINE</span>
                </div>
                
                {/* Add to Pipeline */}
                <div className="flex flex-col gap-2 bg-black/30 p-3 border border-purple-500/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <input
                      value={contentIdea}
                      onChange={e => setContentIdea(e.target.value)}
                      placeholder="Drop Content URL..."
                      className="flex-1 bg-transparent border-none text-xs text-white font-mono focus:outline-none placeholder:text-white/20"
                    />
                    <button
                      disabled={!contentIdea.trim()}
                      onClick={() => {
                        setContentPipeline([{ id: Math.random().toString(), url: contentIdea, hook: '', ig: false, tw: false, li: false, dc: false }, ...contentPipeline]);
                        setContentIdea('');
                        triggerHaptic('medium');
                      }}
                      className="px-4 py-1.5 bg-purple-500/20 text-purple-400 text-[10px] font-bold rounded tracking-wider hover:bg-purple-500/40 transition-all disabled:opacity-30"
                    >
                      ADD TO PIPELINE
                    </button>
                  </div>
                </div>

                {/* Pipeline List */}
                <div className="space-y-2">
                  {contentPipeline.map((item, i) => (
                    <div key={item.id} className="flex flex-col gap-3 bg-black/50 border border-white/5 hover:border-purple-500/30 p-4 rounded-xl transition-all group">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-purple-300/80 font-mono truncate max-w-[200px] md:max-w-sm">{item.url}</span>
                        <button 
                          onClick={() => setContentPipeline(contentPipeline.filter(p => p.id !== item.id))}
                          className="text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <input 
                        value={item.hook}
                        onChange={(e) => {
                          const newPipe = [...contentPipeline];
                          newPipe[i].hook = e.target.value;
                          setContentPipeline(newPipe);
                        }}
                        onBlur={async (e) => {
                          if (!e.target.value.trim()) return;
                          try {
                            await fetch('/api/elesium/content/log', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ hooks_used: [e.target.value.trim()] })
                            });
                          } catch (err) {}
                        }}
                        placeholder="Log hook used... (e.g. 'Contrast Hook')"
                        className="w-full bg-transparent border-b border-white/10 pb-1 text-[11px] text-white focus:outline-none focus:border-purple-500/50 transition-all"
                      />
                      
                      <div className="flex items-center gap-2 pt-1">
                        {[
                          { key: 'ig', label: 'IG' },
                          { key: 'tw', label: 'TW' },
                          { key: 'li', label: 'LI' },
                          { key: 'dc', label: 'DC' }
                        ].map(platform => {
                          const isActive = item[platform.key as keyof typeof item] as boolean;
                          return (
                            <button
                              key={platform.key}
                              onClick={async () => {
                                triggerHaptic('light');
                                const newPipe = [...contentPipeline];
                                (newPipe[i] as any)[platform.key] = !isActive;
                                setContentPipeline(newPipe);
                                
                                // Auto-sync to backend
                                try {
                                  await fetch('/api/elesium/content/log', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ 
                                      platforms: [platform.label], 
                                      notes: `Distributed ${item.url} to ${platform.label}` 
                                    })
                                  });
                                } catch (e) {
                                  console.error('Failed to sync pipeline', e);
                                }
                              }}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border ${
                                isActive 
                                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/50 shadow-[0_0_10px_rgba(167,139,250,0.3)]' 
                                  : 'bg-black text-white/30 border-white/10 hover:border-white/30 hover:text-white/60'
                              }`}
                            >
                              {platform.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {contentPipeline.length === 0 && (
                    <div className="text-center py-8 text-white/20 text-[10px] font-mono tracking-widest border border-dashed border-white/10 rounded-xl">
                      PIPELINE EMPTY
                    </div>
                  )}
                </div>
              </div>
            </div>
            )}

          </div>
        )}

        {/*  INFLUENCE content weapon */}
        {pillar === 'influence' && (
          <div className="space-y-6 animate-fade-up">
            {/* BIG CAMERA ZONE */}
            <div 
              onClick={() => {
                if (!isUploading && fileInputRef.current) {
                  fileInputRef.current.value = '';
                  fileInputRef.current.click();
                }
              }}
              className="bg-surface border border-purple-500/40 p-8 flex flex-col items-center justify-center gap-4 text-center cursor-pointer hover:border-purple-500/60 active:scale-[0.99] transition-all"
              style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.03), rgba(0,0,0,0.65))' }}
            >
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(167,139,250,0.3)]">
                <Camera className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-purple-400 tracking-widest font-mono">VISUAL INFLUENCE LOG</h3>
                <p className="text-[9px] text-text-dim mt-1 tracking-widest">CAPTURE CONTENT IDEAS, SKETCHES, OR METRICS</p>
              </div>
              <button
                disabled={isUploading}
                className="mt-2 w-full max-w-sm py-4 bg-purple-500 hover:bg-purple-400 text-obsidian font-bold tracking-[0.2em] transition-all pointer-events-none"
              >
                {isUploading ? 'UPLOADING ASSET...' : 'OPEN LENS'}
              </button>
            </div>

            {/* Template Tag Injectors */}
            <div className="bg-surface border border-surface2 p-5">
              <h3 className="text-xs font-bold tracking-widest text-purple-400 mb-3 uppercase flex items-center gap-1.5">
                 QUICK ESSAY & CONTENT IDEATOR TEMPLATES
              </h3>
              <p className="text-[9px] text-text-dim tracking-wide mb-4">TAP TO INJECT INFLUENCE TEMPLATES TO ELIMINATE WRITING FRICTION:</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { tag: '[HOOK CONCEPT]', desc: 'Capture essay hooks' },
                  { tag: '[THREAD IDEA]', desc: 'Structure tweet threads' },
                  { tag: '[RHETORIC CONCEPT]', desc: 'Rhetoric & speech tags' },
                  { tag: '[ESSAY PROMPT]', desc: 'Log raw thesis ideas' }
                ].map(t => (
                  <button
                    key={t.tag}
                    onClick={() => handleInfluenceTemplate(t.tag)}
                    className="p-3 border border-surface2 bg-surface hover:border-purple-500/40 hover:bg-purple-500/5 text-left flex flex-col justify-between h-20 transition-all group"
                  >
                    <span className="text-[9px] font-bold text-purple-400 group-hover:text-purple-300 font-mono tracking-wider">{t.tag}</span>
                    <span className="text-[8px] text-text-dim tracking-wider uppercase font-mono mt-2">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Word Count Logger */}
            <div className="bg-surface border border-surface2 p-5 flex flex-col md:flex-row gap-4 justify-between items-end">
              <div className="flex-1 w-full space-y-2">
                <h3 className="text-xs font-bold tracking-widest text-purple-400 uppercase flex items-center gap-1.5">
                   PIPELINE WORD COUNT LOGGER
                </h3>
                <label className="text-[8px] text-text-dim tracking-widest uppercase font-mono block">Words Written Today</label>
                <ScrubNumberInput 
                  placeholder="e.g. 500"
                  value={wordsWritten === '' ? '' : Number(wordsWritten)}
                  onChangeValue={val => setWordsWritten(val.toString())}
                  className="w-full md:max-w-xs bg-obsidian border border-surface2 p-2 text-xs text-white outline-none focus:border-purple-500/50 font-mono"
                />
              </div>
              <button 
                onClick={handleWordCountSubmit}
                disabled={!wordsWritten.trim()}
                className="w-full md:w-auto px-6 py-2.5 bg-purple-500/20 border border-purple-500/50 hover:bg-purple-500/30 text-purple-300 font-bold tracking-widest text-xs disabled:opacity-30 self-stretch md:self-end h-[36px]"
              >
                LOG WORD COUNT
              </button>
            </div>
          </div>
        )}

        {/*  SELF discipline control */}
        {/*  SELF PROTOCOL INTERFACE */}
        {pillar === 'self' && (() => {
          // Dynamic Mode Logic
          const isBlackSwan = operatingMode === 'black_swan';
          const isDeload = operatingMode === 'deload';
          const isOptimal = operatingMode === 'optimal';

          // Colors
          const themeColor = isBlackSwan ? 'text-amber-500' : isDeload ? 'text-cyan-400' : 'text-vm-amethyst';
          const themeBorder = isBlackSwan ? 'border-amber-500/30' : isDeload ? 'border-cyan-400/30' : 'border-vm-amethyst/30';
          const themeBorderFull = isBlackSwan ? 'border-amber-500' : isDeload ? 'border-cyan-400' : 'border-vm-amethyst';
          const themeBg = isBlackSwan ? 'bg-amber-500' : isDeload ? 'bg-cyan-400' : 'bg-vm-amethyst';
          const themeBgLight = isBlackSwan ? 'bg-amber-500/20' : isDeload ? 'bg-cyan-400/20' : 'bg-vm-amethyst/20';
          const themeHover = isBlackSwan ? 'hover:bg-amber-500/20' : isDeload ? 'hover:bg-cyan-400/20' : 'hover:bg-vm-amethyst/20';
          const themeGlow = isBlackSwan ? 'rgba(245,158,11,0.08)' : isDeload ? 'rgba(34,211,238,0.08)' : 'rgba(168,85,247,0.08)';
          const shadowColor = isBlackSwan ? 'rgba(245,158,11,0.5)' : isDeload ? 'rgba(34,211,238,0.5)' : 'rgba(168,85,247,0.5)';
          const dropShadow = `drop-shadow-[0_0_20px_${shadowColor.replace(/ /g,'')}]`;

          // Triggers
          const triggersOptimal = [
            { key: 'no_sugar', label: 'No Sugar Today', desc: 'Maintain metabolic purity' },
            { key: 'sleep_on_floor', label: 'Slept on Floor', desc: 'Comfort lock engaged' },
            { key: 'cold_shower', label: 'Cold Shower', desc: 'Neuro reset protocol' },
            { key: 'combat_training', label: 'Combat Training', desc: 'Physical aggression outlet' },
            { key: 'learned_concept', label: 'Deep Study', desc: 'Absorbed new concept' },
          ];

          const triggersDeload = [
            { key: 'sleep_8hr', label: '8hr Sleep Locked', desc: 'Mandatory deep recovery' },
            { key: 'no_media', label: 'Zero High-Dopamine Media', desc: 'Neural cooling' },
            { key: 'deep_stretch', label: 'Deep Tissue Stretch', desc: 'Physical restoration' },
            { key: 'nature_walk', label: 'Nature Walk', desc: 'Parasympathetic shift' },
          ];

          const triggersBlackSwan = [
            { key: 'hydrate_3l', label: 'Hydrate 3L', desc: 'Biological baseline survival' },
            { key: 'zero_sugar_spill', label: 'Zero Sugar Spillover', desc: 'Limit metabolic damage' },
            { key: 'mobility_10m', label: '10-Min Mobility', desc: 'Joint maintenance' },
            { key: 'box_breath', label: 'Box Breathing', desc: 'Stress modulation' },
          ];

        {/*  SELF PROTOCOL INTERFACE */}
        {pillar === 'self' && (() => {
          // Dynamic Mode Logic
          const isBlackSwan = operatingMode === 'black_swan';
          const isDeload = operatingMode === 'deload';
          const isOptimal = operatingMode === 'optimal';

          // Colors
          const themeColor = isBlackSwan ? 'text-amber-500' : isDeload ? 'text-cyan-400' : 'text-vm-amethyst';
          const themeBorder = isBlackSwan ? 'border-amber-500/30' : isDeload ? 'border-cyan-400/30' : 'border-vm-amethyst/30';
          const themeBorderFull = isBlackSwan ? 'border-amber-500' : isDeload ? 'border-cyan-400' : 'border-vm-amethyst';
          const themeBg = isBlackSwan ? 'bg-amber-500' : isDeload ? 'bg-cyan-400' : 'bg-vm-amethyst';
          const themeBgLight = isBlackSwan ? 'bg-amber-500/20' : isDeload ? 'bg-cyan-400/20' : 'bg-vm-amethyst/20';
          const themeHover = isBlackSwan ? 'hover:bg-amber-500/20' : isDeload ? 'hover:bg-cyan-400/20' : 'hover:bg-vm-amethyst/20';
          const themeGlow = isBlackSwan ? 'rgba(245,158,11,0.08)' : isDeload ? 'rgba(34,211,238,0.08)' : 'rgba(168,85,247,0.08)';
          const shadowColor = isBlackSwan ? 'rgba(245,158,11,0.5)' : isDeload ? 'rgba(34,211,238,0.5)' : 'rgba(168,85,247,0.5)';
          const dropShadow = `drop-shadow-[0_0_20px_${shadowColor.replace(/ /g,'')}]`;

          // Triggers
          const triggersOptimalT2 = [
            { key: 'fast_24hr', label: '24hr Fasting Window', desc: 'Absolute metabolic control' },
            { key: 'ice_bath', label: 'Ice Bath / Extreme Cold', desc: 'Maximal neuro reset' },
            { key: 'sleep_on_floor_full', label: 'Complete Floor Sleep', desc: 'Comfort lock engaged' },
            { key: 'combat_training', label: 'Combat Training', desc: 'Physical aggression outlet' },
            { key: 'deep_study_2hr', label: 'Deep Study (2hrs)', desc: 'Extended cognitive load' },
          ];

          const triggersOptimalT1 = [
            { key: 'no_sugar', label: 'No Sugar Today', desc: 'Maintain metabolic purity' },
            { key: 'sleep_on_floor', label: 'Slept on Floor', desc: 'Comfort lock engaged' },
            { key: 'cold_shower', label: 'Cold Shower', desc: 'Neuro reset protocol' },
            { key: 'combat_training', label: 'Combat Training', desc: 'Physical aggression outlet' },
            { key: 'learned_concept', label: 'Deep Study', desc: 'Absorbed new concept' },
          ];

          const triggersOptimal = currentTier === 2 ? triggersOptimalT2 : triggersOptimalT1;

          const triggersDeload = [
            { key: 'sleep_8hr', label: '8hr Sleep Locked', desc: 'Mandatory deep recovery' },
            { key: 'no_media', label: 'Zero High-Dopamine Media', desc: 'Neural cooling' },
            { key: 'deep_stretch', label: 'Deep Tissue Stretch', desc: 'Physical restoration' },
            { key: 'nature_walk', label: 'Nature Walk', desc: 'Parasympathetic shift' },
          ];

          const triggersBlackSwan = [
            { key: 'hydrate_3l', label: 'Hydrate 3L', desc: 'Biological baseline survival' },
            { key: 'zero_sugar_spill', label: 'Zero Sugar Spillover', desc: 'Limit metabolic damage' },
            { key: 'mobility_10m', label: '10-Min Mobility', desc: 'Joint maintenance' },
            { key: 'box_breath', label: 'Box Breathing', desc: 'Stress modulation' },
          ];

          const currentTriggers = isBlackSwan ? triggersBlackSwan : isDeload ? triggersDeload : triggersOptimal;
          
          return (
          <div className="w-full space-y-8 pb-4 animate-fade-up">

            {/* Operating Mode Toggle */}
            <div className="w-full flex justify-center pt-2 z-20 relative">
              <div className="flex bg-surface border border-surface2 rounded-xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => { triggerHaptic('light'); setOperatingMode('optimal'); }}
                  className={`px-4 py-2 text-[10px] tracking-widest font-bold uppercase transition-colors ${isOptimal ? 'bg-vm-amethyst/10 text-vm-amethyst border-b-2 border-vm-amethyst' : 'text-text-dim hover:bg-surface2 border-b-2 border-transparent'}`}
                >
                  OPTIMAL
                </button>
                <button 
                  onClick={() => { triggerHaptic('light'); setOperatingMode('deload'); }}
                  className={`px-4 py-2 text-[10px] tracking-widest font-bold uppercase transition-colors ${isDeload ? 'bg-cyan-400/10 text-cyan-400 border-b-2 border-cyan-400' : 'text-text-dim hover:bg-surface2 border-b-2 border-transparent'}`}
                >
                  DELOAD
                </button>
                <button 
                  onClick={() => { triggerHaptic('light'); setOperatingMode('black_swan'); }}
                  className={`px-4 py-2 text-[10px] tracking-widest font-bold uppercase transition-colors ${isBlackSwan ? 'bg-amber-500/10 text-amber-500 border-b-2 border-amber-500' : 'text-text-dim hover:bg-surface2 border-b-2 border-transparent'}`}
                >
                  BLACK SWAN
                </button>
              </div>
            </div>
            
            {/* HUD Header & Major Action (Accountability Lens) */}
            <div className="w-full flex flex-col items-center justify-center relative pt-4 pb-10">
              <div className="absolute inset-0 pointer-events-none transition-all duration-1000" style={{ background: `radial-gradient(circle at center, ${themeGlow} 0%, transparent 60%)` }} />
              <div className="z-10 flex flex-col items-center gap-8 w-full max-w-sm">
                <button
                  onClick={() => {
                    if (!isUploading && fileInputRef.current) {
                      fileInputRef.current.value = '';
                      fileInputRef.current.click();
                    }
                  }}
                  disabled={isUploading}
                  className="group relative w-full max-w-[260px] aspect-square rounded-full flex flex-col items-center justify-center gap-4 transition-all duration-500 hover:scale-105 active:scale-95"
                  style={{ 
                    backgroundColor: 'var(--color-obsidian)',
                    borderColor: lensCaptured ? themeBg : shadowColor,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    boxShadow: lensCaptured ? `0 0 40px ${shadowColor}` : `0 0 30px ${shadowColor.replace('0.5', '0.15')}`
                  }}
                >
                  <div className={`absolute inset-2 rounded-full border ${lensCaptured ? themeBorderFull : themeBorder}`} />
                  <Camera className={`w-20 h-20 transition-transform duration-500 group-hover:scale-110 ${themeColor} ${isUploading ? 'animate-pulse' : ''}`} style={{ filter: `drop-shadow(0 0 10px ${shadowColor})` }} />
                  <div className="flex flex-col items-center text-center">
                    <span className="font-heading text-xl tracking-[0.3em] text-white">
                      {isUploading ? 'SYNCING' : lensCaptured ? 'VERIFIED' : 'CAPTURE'}
                    </span>
                    <p className={`text-[12px] tracking-widest font-bold mt-2 ${themeColor}`}>
                      {lensCaptured ? 'LENS SYNCED' : 'LENS ACTIVE'}
                    </p>
                  </div>
                  <p className="text-[9px] text-text-dim tracking-widest absolute bottom-8 font-bold uppercase">
                    ACCOUNTABILITY PROOF
                  </p>
                </button>
              </div>
            </div>

            {/* Minimalist Stack Layout */}
            <div className="flex flex-col gap-2 relative z-10 font-mono max-w-md mx-auto w-full px-6 md:px-0">
              
              {/* Daily Vulnerability & Trigger Checklist */}
              <div className="mb-6 w-full">
                <div className="flex items-center justify-between mb-2 pl-1">
                  <h3 className="text-[10px] tracking-[0.3em] text-text-dim uppercase font-bold">
                    {isBlackSwan ? 'MINIMAL SURVIVAL PROTOCOL' : isDeload ? 'DEEP RECOVERY PROTOCOL' : 'TRIGGER AVOIDANCE PROTOCOL'}
                  </h3>
                  {isOptimal && currentTier === 2 && (
                    <span className="text-[9px] text-vm-amethyst font-bold tracking-widest uppercase px-2 py-0.5 border border-vm-amethyst/30 rounded">TIER 2</span>
                  )}
                </div>
                <div className="flex flex-col gap-2 w-full">
                  {currentTriggers.map(item => {
                    const isSecured = nns[item.key];
                    const borderClass = isSecured ? (isBlackSwan ? 'border-amber-500/20 bg-amber-500/5' : isDeload ? 'border-cyan-400/20 bg-cyan-400/5' : 'border-vm-amethyst/20 bg-vm-amethyst/5') : 'border-surface2 bg-surface/50 hover:text-white hover:border-surface2';
                    
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleNNToggle(item.key, !nns[item.key])}
                        className={`py-4 px-6 flex items-center justify-between w-full transition-all active:scale-[0.98] relative border rounded-xl ${borderClass}`}
                      >
                        {isSecured && (
                          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 rounded-r-full ${themeBg}`} style={{ boxShadow: `0 0 15px ${shadowColor}` }} />
                        )}
                        
                        <div className="flex flex-col text-left">
                          <span className={`text-[12px] tracking-widest uppercase font-bold ${
                            isSecured ? themeColor : 'text-white'
                          }`}>
                            {item.label}
                          </span>
                          <span className="text-[8px] text-text-dim tracking-[0.2em] uppercase mt-1">
                            {item.desc}
                          </span>
                        </div>

                        <div className="flex flex-col items-end">
                          <span className={`text-[8px] font-bold tracking-widest uppercase mb-1 ${
                            isSecured ? themeColor : 'text-text-dim/40'
                          }`}>
                            {isSecured ? 'AVOIDED ' : 'UNSECURED'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

               {/* Discipline Score Widget */}
              <div className="w-full mb-6 flex flex-col gap-2 relative z-10 font-mono">
                <h3 className="text-[10px] tracking-[0.3em] text-text-dim uppercase font-bold mb-1 pl-1">
                  {isBlackSwan ? 'ADAPTIVE RESILIENCE SCORE' : 'ACCOUNTABILITY SCORE'}
                </h3>
                
                {todayLog?.score !== undefined && todayLog?.score !== null ? (
                  <div className={`bg-surface border ${themeBorder} p-5 rounded-xl flex items-center justify-between relative overflow-hidden`} style={{ boxShadow: `0 0 20px ${shadowColor.replace('0.5', '0.1')}` }}>
                    <div className={`absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none`} style={{ background: `linear-gradient(to left, ${shadowColor.replace('0.5', '0.1')}, transparent)` }} />
                    <div className="flex items-center gap-4 relative z-10">
                      <CheckCircle className={`w-6 h-6 ${themeColor}`} />
                      <div className="flex flex-col text-left">
                        <span className="text-[11px] font-bold text-white tracking-[0.15em] uppercase">
                          {isBlackSwan ? 'RESILIENCE RATING' : 'DISCIPLINE RATING'}
                        </span>
                        <span className="text-[9px] text-text-dim tracking-widest uppercase font-mono">
                          LOCKED UNTIL MIDNIGHT
                        </span>
                      </div>
                    </div>
                    <div className="text-right relative z-10">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-bold ${themeColor}`} style={{ textShadow: `0 0 10px ${shadowColor}` }}>
                          {todayLog.score}
                        </span>
                        <span className="text-text-dim text-xs">/10</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`bg-surface border border-surface2 p-5 rounded-xl flex flex-col relative transition-colors`}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <Target className={`w-5 h-5 ${themeColor}`} />
                        <span className="text-[12px] tracking-[0.2em] font-bold text-white uppercase">DAILY RATING</span>
                      </div>
                      <span className={`text-lg font-bold tracking-widest ${themeColor}`}>
                        {disciplineScore}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 relative z-10 w-full mb-4">
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={disciplineScore}
                        onChange={e => setDisciplineScore(parseInt(e.target.value))}
                        className="flex-1 h-1 bg-surface2 rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: isBlackSwan ? '#f59e0b' : isDeload ? '#22d3ee' : '#a855f7' }}
                      />
                    </div>
                    
                    <button
                      onClick={handleDisciplineScoreSubmit}
                      disabled={!lensCaptured}
                      className={`w-full py-3 border font-bold text-[10px] tracking-[0.2em] transition-all rounded-lg disabled:opacity-40 disabled:cursor-not-allowed ${!lensCaptured ? 'bg-surface2 text-text-dim border-surface2' : isBlackSwan ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20' : isDeload ? 'bg-cyan-400/10 border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/20' : 'bg-vm-amethyst/10 border-vm-amethyst/30 text-vm-amethyst hover:bg-vm-amethyst/20'}`}
                    >
                      {!lensCaptured ? '[ REQUIRES LENS SYNC ]' : 'SECURE SCORE'}
                    </button>
                  </div>
                )}
              </div>

              {/* Neural Auditor Widget */}
              {(() => {
                const selfLogs = logs.filter(l => l.pillar?.toLowerCase() === 'self');
                const autopsies = selfLogs.filter(l => l.text && l.text.includes('[BLACK_SWAN_AUTOPSY]'));
                if (autopsies.length === 0) return null;
                
                // Extremely basic keyword extraction for mock insight
                const texts = autopsies.map(a => a.text.toLowerCase());
                let keyword = 'fatigue';
                if (texts.some(t => t.includes('sleep') || t.includes('tired'))) keyword = 'sleep deprivation';
                else if (texts.some(t => t.includes('work') || t.includes('busy'))) keyword = 'workload saturation';
                else if (texts.some(t => t.includes('sugar') || t.includes('eat'))) keyword = 'dietary slippage';

                const percent = Math.min(100, Math.round((texts.filter(t => t.includes(keyword.split(' ')[0])).length / texts.length) * 100) + 40);

                return (
                  <div className="w-full mb-6 flex flex-col gap-2 relative z-10 font-mono">
                    <div className="flex items-center gap-2 mb-1 pl-1">
                      <Activity className={`w-3 h-3 ${themeColor}`} />
                      <h3 className="text-[10px] tracking-[0.3em] text-text-dim uppercase font-bold">
                        NEURAL AUDITOR
                      </h3>
                    </div>
                    <div className={`bg-surface border border-surface2 p-4 rounded-xl flex items-start gap-3`}>
                      <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${themeColor}`} />
                      <p className="text-[10px] leading-relaxed text-gray-300 font-mono uppercase tracking-widest">
                        <span className={`font-bold ${themeColor}`}>PATTERN DETECTED:</span> '{keyword.toUpperCase()}' IS THE ROOT CAUSE IN ~{percent}% OF RECENT BLACK SWAN FAILURES. ARMOR THIS VULNERABILITY.
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Knowledge Bank Widget */}
              <div className="w-full flex flex-col gap-2 relative z-10 font-mono">
                <div className="flex justify-between items-end mb-1 pl-1">
                  <h3 className="text-[10px] tracking-[0.3em] text-text-dim uppercase font-bold">
                    {isBlackSwan ? 'INCIDENT AUTOPSY' : 'KNOWLEDGE BANK'}
                  </h3>
                  <button
                    onClick={handleOpenMaterials}
                    className={`text-[9px] tracking-widest font-bold uppercase transition-colors ${themeColor}`}
                  >
                    READINGS [&gt;&gt;]
                  </button>
                </div>
                
                <div className={`bg-surface border border-surface2 p-5 rounded-xl flex flex-col relative overflow-hidden group transition-colors hover:border-surface2`}>
                  <div className="absolute inset-0 pointer-events-none opacity-10">
                    <div className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-in-out h-[20%] ${themeBg}`} />
                  </div>
                  
                  <div className={`relative flex-1 min-h-[80px] rounded-lg border bg-obsidian/60 overflow-hidden mb-3 transition-all duration-300 border-surface2 hover:${themeBorder}`}>
                    <textarea
                      value={learningText}
                      onChange={(e) => setLearningText(e.target.value)}
                      placeholder={isBlackSwan ? "What broke the routine? How are you adapting?" : isDeload ? "Log rest protocols and recovery notes..." : "Log new concepts, frameworks, or deep studies..."}
                      className="w-full h-full bg-transparent p-3 text-[12px] resize-none outline-none text-gray-200 placeholder:text-gray-600 font-mono leading-relaxed"
                    />
                  </div>
                  
                  <button
                    onClick={handleLogLearning}
                    disabled={!learningText.trim()}
                    className={`w-full py-3 text-obsidian font-bold text-[10px] tracking-[0.2em] transition-all rounded-lg disabled:opacity-40 disabled:bg-surface2 disabled:text-text-dim ${themeBg} hover:opacity-90`}
                  >
                    {isBlackSwan ? 'LOG ADAPTATION' : 'UPLOAD TO BRAIN'}
                  </button>

                  {/* Today's topics studied list */}
                  {(() => {
                    const todayStr = getLocalDateString();
                    const tagFilter = isBlackSwan ? '[BLACK_SWAN_AUTOPSY]' : isDeload ? '[DELOAD_LOG]' : '[LEARNING/CONCEPT]';
                    const todaySelfEntries = pillarEntries.filter(e => {
                      const entryDate = e.timestamp.split('T')[0];
                      return entryDate === todayStr && e.text.startsWith(tagFilter);
                    });

                    if (todaySelfEntries.length === 0) return null;

                    return (
                      <div className="mt-4 pt-4 border-t border-surface2 space-y-2 relative z-10">
                        <p className="text-[9px] text-text-dim tracking-widest font-bold uppercase">TODAY&apos;S INGESTION:</p>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
                          {todaySelfEntries.map((e, idx) => {
                            const cleanText = e.text.replace(`${tagFilter} `, '');
                            return (
                              <div key={idx} className="p-3 bg-surface/80 border border-surface2 rounded-lg text-xs font-mono text-white flex items-start justify-between">
                                <span className="leading-relaxed text-gray-300">{cleanText}</span>
                                <span className="text-[8px] text-text-dim shrink-0 ml-3 font-mono mt-0.5">
                                  {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

            </div>
          </div>
          );
        })()}

        {/* ─── FEED & GRAPHS SECTION (Standard for all) ─────────────────────── */}

        {/* Volume Graph */}
        <div className="bg-surface border border-surface2 p-4">
          <h2 className={`text-xs font-bold tracking-widest mb-4 ${meta.color}`}>14-DAY UPLOAD VOLUME</h2>
          <div className="flex items-end justify-between h-24 gap-1">
            {barData.map((d, i) => {
              const heightPct = maxEntries > 0 ? (d.count / maxEntries) * 100 : 0;
              return (
                <div key={i} className="flex flex-col items-center flex-1 gap-1">
                  <div className="w-full bg-surface2 h-full flex items-end rounded-sm overflow-hidden relative">
                    <div 
                      className={`w-full transition-all duration-500 ${d.count > 0 ? 'bg-vm-green' : 'bg-transparent'}`} 
                      style={{ height: `${heightPct}%`, backgroundColor: meta.color.replace('text-', '#') }}
                    />
                  </div>
                  <div className="text-[8px] text-text-dim/60">{d.dayLabel}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 30-day grid */}
        <div>
          <h2 className={`text-xs font-bold tracking-widest mb-3 ${meta.color}`}>SYSTEM DISCIPLINE (30D)</h2>
          <div className="flex gap-1 flex-wrap">
            {days30.map((d, i) => {
              const dateStr = d.toISOString().split('T')[0];
              const log = logMap[dateStr];
              const logged = !!log;
              let score = 0;
              if (logged) {
                const nns = log.non_negotiables ?? {};
                const done = meta.nns.filter(nn => nns[nn]).length;
                score = meta.nns.length > 0 ? Math.round((done / meta.nns.length) * 100) : (logged ? 50 : 0);
              }
              return (
                <CalendarDot key={i} logged={logged} score={score} />
              );
            })}
          </div>
        </div>

        {/* Media / Entry Feed */}
        <div>
          <h2 className={`text-xs font-bold tracking-widest mb-4 ${meta.color}`}>VAULT ENTRIES</h2>
          <div className="space-y-4">
            {pillarEntries.map((entry, idx) => {
              const d = new Date(entry.timestamp);
              const timeStr = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
              return (
                <div key={idx} className="bg-surface border border-surface2 overflow-hidden flex flex-col">
                  {entry.image_url && (
                    <div className="w-full bg-black aspect-square max-h-[400px] relative">
                      <img 
                        src={`${API_BASE}${entry.image_url}`} 
                        alt="Entry" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="text-[9px] text-vm-green/70 tracking-widest mb-2">{timeStr}</div>
                    <p className="text-sm text-gray-200 whitespace-pre-wrap">{entry.text}</p>
                  </div>
                </div>
              );
            })}
            {pillarEntries.length === 0 && (
              <p className="text-text-dim text-xs tracking-widest text-center py-8">NO CAPTURES. ADD A NOTE OR PHOTO.</p>
            )}
          </div>
        </div>

      </div>

      {/* FABs */}
      <input 
        id="camera-capture-input"
        type="file" 
        accept="image/*" 
        capture="environment"
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
        onClick={(e) => { e.currentTarget.value = ''; }}
      />
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-30">

        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`w-14 h-14 rounded-full bg-vm-green text-obsidian flex items-center justify-center shadow-[0_0_20px_rgba(16,216,106,0.3)] active:scale-95 transition-all cursor-pointer ${isUploading ? 'opacity-50 animate-pulse pointer-events-none' : ''}`}
          style={{ backgroundColor: meta.color.includes('amber') ? '#F59E0B' : meta.color.includes('blue') ? '#3B82F6' : meta.color.includes('purple') ? '#A855F7' : '#10D86A' }}
        >
          <Camera className="w-6 h-6" />
        </button>
      </div>

      {/* Entry Modal */}
      {/* Entry Modal (Premium Bottom Sheet) */}
      {showEntryModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity" 
            onClick={() => setShowEntryModal(false)} 
          />
          
          <div 
            className="relative w-full max-w-md bg-[#0a0a0a]/90 backdrop-blur-3xl border-t sm:border border-white/10 sm:rounded-2xl rounded-t-[2rem] p-5 sm:p-6 flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden"
            style={{ 
               animation: 'fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
               boxShadow: `0 -15px 40px -10px ${
                 meta.color.includes('gold') ? 'rgba(16,216,106,0.25)' : 
                 meta.color.includes('blue') ? 'rgba(76,126,201,0.25)' : 
                 meta.color.includes('purple') ? 'rgba(167,139,250,0.25)' : 
                 'rgba(76,170,110,0.25)'
               }`
            }}
          >
            {/* Drag Handle */}
            <div className="w-12 h-1 bg-white/15 rounded-full mx-auto mb-5 shrink-0" />

            {/* Header */}
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="font-mono font-bold tracking-[0.25em] text-[10px] sm:text-[11px] flex items-center gap-2 drop-shadow-md"
                  style={{ color: meta.color.includes('gold') ? '#10D86A' : meta.color.includes('blue') ? '#4c7ec9' : meta.color.includes('purple') ? '#a78bfa' : '#4caa6e' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor]" style={{ backgroundColor: 'currentColor' }} />
                NEW {meta.label} ENTRY
              </h3>
              <button 
                onClick={() => setShowEntryModal(false)} 
                className="text-white/40 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-full p-1.5 active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Scrollable Container (protects layout when keyboard is open) */}
            <div className="flex-1 flex flex-col space-y-4 min-h-0 overflow-y-auto pb-4 pr-1 scrollbar-thin">
              {uploadedImageUrl && (
                <div className="w-full relative group shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-2xl h-32 sm:h-40 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060606]/95 via-transparent to-transparent z-10 pointer-events-none" />
                  <img 
                    src={`${API_BASE}${uploadedImageUrl}`} 
                    alt="Preview" 
                    className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                    <Camera className="w-3 h-3 text-white/90" />
                    <span className="text-[8px] font-mono tracking-widest text-white/90 uppercase">ATTACHED</span>
                  </div>
                </div>
              )}
              
              <div 
                className="relative flex-1 min-h-[120px] rounded-xl border bg-white/[0.02] overflow-hidden group focus-within:bg-white/[0.04] transition-all duration-300"
                style={{
                  borderColor: meta.color.includes('gold') ? 'rgba(16,216,106,0.15)' : 
                               meta.color.includes('blue') ? 'rgba(76,126,201,0.15)' : 
                               meta.color.includes('purple') ? 'rgba(167,139,250,0.15)' : 
                               'rgba(76,170,110,0.15)'
                }}
              >
                <textarea
                  value={entryText}
                  onChange={(e) => setEntryText(e.target.value)}
                  placeholder="Record your insight, thought pattern, or context..."
                  className="w-full h-full bg-transparent p-4 text-[12px] sm:text-[13px] resize-none outline-none text-gray-200 placeholder:text-gray-600 font-mono leading-relaxed"
                  autoFocus
                />
              </div>
            </div>
            
            {/* Footer / Submit Button */}
            <div className="pt-3 border-t border-white/5 shrink-0">
              <button 
                onClick={submitEntry}
                disabled={!entryText.trim() && !uploadedImageUrl}
                className="w-full py-3.5 rounded-xl font-mono font-bold tracking-[0.25em] text-[10px] sm:text-[11px] disabled:opacity-20 disabled:scale-[0.98] transition-all duration-300 relative overflow-hidden group active:scale-[0.98]"
                style={{ 
                  backgroundColor: meta.color.includes('gold') ? '#10D86A' : meta.color.includes('blue') ? '#4c7ec9' : meta.color.includes('purple') ? '#a78bfa' : '#4caa6e', 
                  color: '#060606',
                  boxShadow: `0 4px 20px -5px ${
                    meta.color.includes('gold') ? 'rgba(16,216,106,0.4)' : 
                    meta.color.includes('blue') ? 'rgba(76,126,201,0.4)' : 
                    meta.color.includes('purple') ? 'rgba(167,139,250,0.4)' : 
                    'rgba(76,170,110,0.4)'
                  }`
                }}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center justify-center gap-2 drop-shadow-sm">
                  SAVE TO VAULT
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-1"><path d="M3.33331 8H12.6666" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 3.33331L12.6667 7.99998L8 12.6666" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prayer Modal */}
      {showPrayerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-md border border-vm-green/40 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-vm-green font-bold tracking-widest text-sm flex items-center gap-2">
                 SALAH LOG
              </h3>
              <button onClick={() => setShowPrayerModal(false)} className="text-text-dim hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="space-y-3">
              {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(prayer => (
                <button
                  key={prayer}
                  onClick={() => handlePrayerToggle(prayer)}
                  className={`w-full p-4 border flex justify-between items-center transition-colors ${
                    prayersLogged[prayer as keyof typeof prayersLogged]
                      ? 'border-vm-green bg-vm-green/10 text-vm-green'
                      : 'border-surface2 bg-obsidian text-text-dim hover:border-vm-green/30 hover:text-white'
                  }`}
                >
                  <span className="font-bold tracking-widest uppercase font-mono">{prayer}</span>
                  <div className={`w-6 h-6 rounded-sm border flex items-center justify-center ${
                    prayersLogged[prayer as keyof typeof prayersLogged] ? 'border-vm-green bg-vm-green text-obsidian' : 'border-surface2'
                  }`}>
                    {prayersLogged[prayer as keyof typeof prayersLogged] && <CheckCircle className="w-4 h-4" />}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-surface2">
               <div className="flex justify-between items-center text-xs tracking-widest font-mono text-text-dim mb-4">
                 <span>COMPLETED TODAY:</span>
                 <span className="text-vm-green font-bold">
                   {Object.values(prayersLogged).filter(Boolean).length} / 5
                 </span>
               </div>
              <button 
                onClick={() => setShowPrayerModal(false)}
                className="w-full py-3 bg-vm-green text-obsidian font-bold tracking-widest text-xs"
              >
                CLOSE & SECURE LOGS
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  Prayer History Tracker/Audit Modal */}
      {showPrayerHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity" 
            onClick={() => setShowPrayerHistoryModal(false)} 
          />
          
          <div 
            className="relative w-full max-w-lg bg-[#0a0a0a]/90 backdrop-blur-3xl border-t sm:border border-vm-green/20 sm:rounded-2xl rounded-t-[2rem] p-5 sm:p-6 flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden"
            style={{ 
               animation: 'fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
               boxShadow: '0 -15px 40px -10px rgba(16,216,106,0.25)'
            }}
          >
            {/* Drag Handle */}
            <div className="w-12 h-1 bg-vm-green/20 rounded-full mx-auto mb-5 shrink-0" />

            {/* Header */}
            <div className="flex justify-between items-center mb-4 shrink-0">
              <div>
                <h3 className="font-mono font-bold tracking-[0.25em] text-[10px] sm:text-[11px] text-vm-green flex items-center gap-2 drop-shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-vm-green animate-pulse shadow-[0_0_8px_#10D86A]" />
                  HISTORICAL SALAH AUDIT & TRACE
                </h3>
                <p className="text-[8px] text-text-dim tracking-widest uppercase mt-0.5">Correct past prayers and view statistics</p>
              </div>
              <button 
                onClick={() => setShowPrayerHistoryModal(false)} 
                className="text-white/40 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-full p-1.5 active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 14-Day Global Stats Card */}
            {(() => {
              const totalPossible = prayerHistory.length * 5;
              const totalSecured = prayerHistory.reduce((acc, curr) => acc + (curr.count || 0), 0);
              const totalLeft = Math.max(0, totalPossible - totalSecured);
              const completionRate = totalPossible > 0 ? Math.round((totalSecured / totalPossible) * 100) : 0;

              return (
                <div className="bg-surface/50 border border-vm-green/15 p-4 rounded-sm mb-4 shrink-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-mono tracking-widest text-text-dim uppercase">14-Day Completion Summary</span>
                    <span className="text-xs font-mono font-bold text-vm-green">{totalSecured} / {totalPossible} Secured</span>
                  </div>
                  <div className="w-full bg-obsidian border border-surface2 h-2.5 rounded-full overflow-hidden flex">
                    <div className="bg-vm-green h-full transition-all duration-300" style={{ width: `${completionRate}%` }} />
                  </div>
                  <div className="flex justify-between text-[8px] font-mono text-text-dim/60 mt-1.5 uppercase">
                    <span>Completion Rate: {completionRate}%</span>
                    <span>{totalLeft} prayers left</span>
                  </div>
                </div>
              );
            })()}

            {/* Interactive Grid Title */}
            <div className="mb-2 shrink-0 flex justify-between items-center">
              <span className="text-[9px] font-mono tracking-widest text-text-dim uppercase">Select Day to Audit</span>
              <span className="text-[7.5px] font-mono text-vm-green-dim">TAP CELL TO FOCUS</span>
            </div>

            {/* Grid layout of 14 Days (7 cols x 2 rows) */}
            <div className="grid grid-cols-7 gap-1.5 mb-4 shrink-0">
              {[...prayerHistory].map((dayLog) => {
                const isSelected = dayLog.date === selectedAuditDate;
                const dateObj = new Date(dayLog.date);
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                const dayOfMonth = dateObj.getDate();
                const count = dayLog.count || 0;
                
                const prayers = dayLog.prayers || {
                  fajr: false,
                  dhuhr: false,
                  asr: false,
                  maghrib: false,
                  isha: false
                };

                return (
                  <button
                    key={dayLog.date}
                    onClick={() => { triggerHaptic('light'); setSelectedAuditDate(dayLog.date); }}
                    className={`p-2 border flex flex-col items-center justify-between transition-all duration-200 relative aspect-square ${
                      isSelected 
                        ? 'border-vm-green bg-vm-green/15 shadow-[0_0_10px_rgba(16,216,106,0.25)]' 
                        : count === 5
                        ? 'border-vm-green/30 bg-vm-green/5 hover:border-vm-green/50'
                        : 'border-surface2 bg-[#0c0c0c] hover:border-vm-green/20'
                    }`}
                    style={{ borderRadius: '2px' }}
                  >
                    <span className="text-[7px] font-mono text-text-dim/50 uppercase font-bold">{dayName}</span>
                    <span className="text-xs font-mono font-bold text-white">{dayOfMonth}</span>
                    
                    {/* Dots indicator for 5 prayers */}
                    <div className="flex gap-0.5 justify-center mt-1">
                      {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((pName) => {
                        const done = prayers[pName as keyof typeof prayers] === true;
                        return (
                          <span 
                            key={pName} 
                            className={`w-1 h-1 rounded-full ${done ? 'bg-vm-green shadow-[0_0_2px_#10D86A]' : 'bg-surface2'}`} 
                          />
                        );
                      })}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Detail Panel of the Active Day */}
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin my-2">
              {(() => {
                const activeDayLog = prayerHistory.find(d => d.date === selectedAuditDate) || prayerHistory[prayerHistory.length - 1];
                if (!activeDayLog) return <p className="text-[10px] text-text-dim text-center py-4 font-mono">No logs available for selection.</p>;

                const activeDateObj = new Date(activeDayLog.date);
                const activeDayName = activeDateObj.toLocaleDateString('en-US', { weekday: 'long' });
                const activeFormattedDate = activeDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                
                const activePrayers = activeDayLog.prayers || {
                  fajr: false,
                  dhuhr: false,
                  asr: false,
                  maghrib: false,
                  isha: false
                };

                const activeCount = activeDayLog.count || 0;
                const activeLeft = Math.max(0, 5 - activeCount);

                return (
                  <div className="space-y-4">
                    {/* Active Cell Info */}
                    <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                      <div>
                        <span className="text-[8px] text-vm-green tracking-widest font-mono uppercase block">ACTIVE TARGET DAY</span>
                        <span className="text-xs font-bold text-white font-mono">{activeDayName}, {activeFormattedDate}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[9px] font-mono font-bold text-vm-green px-2 py-0.5 bg-vm-green/10 border border-vm-green/30">
                          {activeCount} SECURED
                        </span>
                        <span className="text-[9px] font-mono font-bold text-text-dim px-2 py-0.5 bg-surface2/10 border border-surface2">
                          {activeLeft} LEFT
                        </span>
                      </div>
                    </div>

                    {/* Interactive Toggles */}
                    <div className="space-y-2">
                      {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((pName) => {
                        const isDone = activePrayers[pName as keyof typeof activePrayers] === true;
                        const capitalized = pName.charAt(0).toUpperCase() + pName.slice(1);
                        const rawTime = prayerData?.timings?.[capitalized] || "";
                        const timeStr = rawTime ? formatTo12Hour(rawTime) : "--:--";

                        const toggleHistoricPrayer = async () => {
                          if (isUpdatingHistory) return;
                          setIsUpdatingHistory(true);
                          triggerHaptic('medium');

                          const updatedPrayers = {
                            ...activePrayers,
                            [pName]: !activePrayers[pName as keyof typeof activePrayers],
                            date: activeDayLog.date
                          };

                          try {
                            await api.deen.logPrayers(updatedPrayers);
                            await loadData();
                            showToast(`Updated ${pName.toUpperCase()} for ${activeDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, "success");
                          } catch (e) {
                            console.error("Failed to update historic prayer", e);
                            showToast("Failed to update log", "error");
                          } finally {
                            setIsUpdatingHistory(false);
                          }
                        };

                        return (
                          <button
                            key={pName}
                            disabled={isUpdatingHistory}
                            onClick={toggleHistoricPrayer}
                            className={`w-full p-3.5 border flex justify-between items-center transition-all active:scale-[0.99] disabled:opacity-50 ${
                              isDone
                                ? 'border-vm-green bg-vm-green/15 text-vm-green shadow-[0_0_10px_rgba(201,168,76,0.1)]'
                                : 'border-surface2 bg-[#0c0c0c] text-text-dim hover:border-vm-green/30 hover:text-white'
                            }`}
                            style={{ borderRadius: '2px' }}
                          >
                            <div className="flex flex-col items-start text-left">
                              <span className="font-bold tracking-widest uppercase font-mono text-[10px] sm:text-xs">{pName}</span>
                              <span className="text-[9px] text-text-dim/60 font-mono mt-0.5">{timeStr}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-[8px] font-mono tracking-widest uppercase font-bold ${isDone ? 'text-vm-green' : 'text-text-dim/40'}`}>
                                {isDone ? 'SECURED' : 'LEFT'}
                              </span>
                              <div className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-colors ${
                                isDone ? 'border-vm-green bg-vm-green text-obsidian' : 'border-surface2'
                              }`}>
                                {isDone && <CheckCircle className="w-3.5 h-3.5 text-obsidian stroke-[3]" />}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {/* Footer */}
            <div className="pt-4 border-t border-white/[0.04] flex justify-end shrink-0">
              <button
                onClick={() => setShowPrayerHistoryModal(false)}
                className="px-6 py-2 border border-vm-green bg-vm-green/10 hover:bg-vm-green/20 text-[10px] text-vm-green font-bold tracking-widest uppercase transition-colors"
                style={{ borderRadius: '2px' }}
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  Study Materials Modal */}
      {showMaterialsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity" 
            onClick={() => setShowMaterialsModal(false)} 
          />
          
          <div 
            className="relative w-full max-w-2xl bg-[#0a0a0a]/90 backdrop-blur-3xl border-t sm:border border-vm-green/20 sm:rounded-2xl rounded-t-[2rem] p-5 sm:p-6 flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden"
            style={{ 
               animation: 'fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
               boxShadow: '0 -15px 40px -10px rgba(76,170,110,0.25)'
            }}
          >
            {/* Drag Handle */}
            <div className="w-12 h-1 bg-vm-green/20 rounded-full mx-auto mb-5 shrink-0" />

            {/* Header */}
            <div className="flex justify-between items-start mb-4 border-b border-white/[0.04] pb-4 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-vm-green tracking-widest uppercase font-mono flex items-center gap-2">
                   STUDY MATERIALS & CORE READINGS
                </h3>
                <p className="text-[8px] text-text-dim tracking-widest uppercase mt-0.5">THE BOOKS THAT BUILD IRON CONVICTION</p>
              </div>
              <button 
                onClick={() => setShowMaterialsModal(false)}
                className="text-text-dim hover:text-vm-green p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Markdown Area */}
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin my-2 text-xs font-mono leading-relaxed space-y-4">
              {isMaterialsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="animate-spin text-2xl"></div>
                  <span className="text-[9px] text-vm-green tracking-widest uppercase animate-pulse">RETRIEVING LATEST READINGS FROM CORE...</span>
                </div>
              ) : (
                <div className="space-y-4 text-white/90">
                  {studyMaterials.split('\n').map((line, idx) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={idx} className="text-lg font-bold text-vm-green tracking-wider border-b border-vm-green/20 pb-2 mt-6 uppercase">{line.substring(2)}</h1>;
                    }
                    if (line.startsWith('## ')) {
                      return <h2 key={idx} className="text-sm font-bold text-vm-green tracking-widest mt-5 uppercase border-l-2 border-vm-green pl-2">{line.substring(3)}</h2>;
                    }
                    if (line.startsWith('### ')) {
                      return <h3 key={idx} className="text-xs font-bold text-white tracking-wide mt-4 uppercase">{line.substring(4)}</h3>;
                    }
                    if (line.startsWith('> ')) {
                      return (
                        <blockquote key={idx} className="border-l border-vm-green/40 pl-3 italic text-text-dim my-2 text-[10px] bg-vm-green/5 py-1">
                          {line.substring(2)}
                        </blockquote>
                      );
                    }
                    if (line.startsWith('- ')) {
                      return <li key={idx} className="ml-4 list-disc text-white/80">{line.substring(2)}</li>;
                    }
                    if (line.trim().startsWith('|')) {
                      // Simple table row detection
                      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
                      // Skip the separator row e.g. |---|---|
                      if (line.includes('---')) return null;
                      return (
                        <div key={idx} className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5 bg-black/10 px-2 text-[10px]">
                          {cells.map((c, i) => (
                            <span key={i} className={i === 0 ? 'font-bold text-vm-green' : 'text-white/80'}>{c}</span>
                          ))}
                        </div>
                      );
                    }
                    if (!line.trim()) return <div key={idx} className="h-2" />;
                    return <p key={idx} className="text-white/80 leading-loose">{line}</p>;
                  })}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="pt-4 border-t border-white/[0.04] flex justify-end shrink-0">
              <button
                onClick={() => setShowMaterialsModal(false)}
                className="px-6 py-2 border border-vm-green bg-vm-green/10 hover:bg-vm-green/20 text-[10px] text-vm-green font-bold tracking-widest uppercase transition-colors"
                style={{ borderRadius: '2px' }}
              >
                Close Materials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Glassmorphic Toast System */}
      {toast && (
        <div 
          onClick={() => setToast(null)}
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-4 border-2 rounded-lg cursor-pointer transition-all duration-300 hover:scale-102 active:scale-98 select-none
            ${toast.type === 'success' 
              ? 'bg-vm-green/15 border-vm-green/40 text-vm-green shadow-[0_0_20px_rgba(76,170,110,0.15)]' 
              : toast.type === 'error' 
                ? 'bg-red-500/15 border-red-500/40 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]' 
                : 'bg-vm-green/15 border-vm-green/40 text-vm-green shadow-[0_0_20px_rgba(16,216,106,0.15)]'
            } backdrop-blur-xl font-mono text-[10px] tracking-[0.2em] uppercase font-bold animate-toast-in`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-black">
              {toast.type === 'success' ? '' : toast.type === 'error' ? '' : 'ℹ'}
            </span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
