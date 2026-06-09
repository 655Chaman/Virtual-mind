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
    icon: '🌿',
    color: 'text-vm-green',        // Jade #10D86A — sacred, divine
    border: 'border-vm-green/40',
    desc: 'Islamic knowledge and spiritual foundation',
    nns: ['salah_5', 'quran_30min', 'adhkar', 'memorization_session', 'fajr_without_alarm'],
  },
  elesium: {
    label: 'ELESIUM',
    icon: '💎',
    color: 'text-vm-sapphire',     // Sapphire #3B82F6 — digital empire
    border: 'border-vm-sapphire/40',
    desc: 'Economic power and business execution',
    nns: ['deep_work_4hr'],
  },
  influence: {
    label: 'INFLUENCE',
    icon: '🧊',
    color: 'text-vm-glacier',      // Glacier #22D3EE — communication, reach
    border: 'border-vm-glacier/40',
    desc: 'Communication and reach building',
    nns: ['reading_1hr'],
  },
  self: {
    label: 'SELF',
    icon: '🧠',
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

  useEffect(() => {
    if (!data || !data.timings) return;

    const timer = setInterval(() => {
      const timings = data.timings;
      const now = new Date();
      const nowTime = now.getTime();

      // Parse prayer times into Date objects for today
      const parsedPrayers = Object.entries(timings).map(([name, timeStr]) => {
        const [hours, minutes] = (timeStr as string).split(':').map(Number);
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
        return { name, date };
      });

      // Sort chronologically
      parsedPrayers.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Determine active prayer
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

      // Filter out Sunrise for actual salah tracking
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

      const diffMs = next.date.getTime() - nowTime;
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);

      const hStr = hours > 0 ? `${hours}h ` : '';
      const mStr = `${minutes}m `;
      const sStr = `${seconds}s`;
      setTimeLeft(`${hStr}${mStr}${sStr}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [data]);

  if (!data) {
    return (
      <div 
        className="bg-surface border border-vm-green/25 p-8 relative overflow-hidden transition-all duration-500 flex flex-col items-center justify-center min-h-[320px] text-center"
        style={{
          boxShadow: '0 0 25px rgba(16,216,106,0.08), inset 0 0 15px rgba(16,216,106,0.03)',
          background: 'linear-gradient(135deg, rgba(16,216,106,0.06), rgba(0,0,0,0.85))',
          borderRadius: '4px',
        }}
      >
        <div className="animate-spin text-3xl mb-4">⌛</div>
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
    <div 
      className="bg-surface border border-vm-green/25 p-6 relative overflow-hidden transition-all duration-300 space-y-6"
      style={{
        boxShadow: '0 0 20px rgba(16,216,106,0.06), inset 0 0 15px rgba(16,216,106,0.02)',
        background: 'linear-gradient(135deg, rgba(16,216,106,0.04), rgba(0,0,0,0.65))',
        borderRadius: '2px',
      }}
    >
      {/* Corner Glow */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-40"
        style={{
          background: 'radial-gradient(circle at top right, rgba(16,216,106,0.2), transparent 70%)'
        }}
      />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.04] pb-5 relative z-10 font-mono">
        <div>
          <span className="text-[8px] text-vm-green tracking-[0.4em] font-bold block mb-1">5 PRAYERS COMPLIANCE & DYNAMIC TIMINGS</span>
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <h3 className="text-xs font-bold tracking-widest text-white/95 uppercase">
              {data.hijri_readable || data.hijri}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center self-stretch sm:self-auto justify-between sm:justify-start">
          <span className="text-vm-green font-bold text-[10px] bg-vm-green/10 px-3 py-1.5 rounded-sm border border-vm-green/20 shrink-0">
            {securedCount} / 5 SECURED
          </span>
          {nextPrayer && (
            <div className="bg-vm-green/10 border border-vm-green/30 px-3 py-1.5 flex items-center gap-2 rounded-sm shrink-0">
              <span className="w-1.5 h-1.5 bg-vm-green rounded-full animate-pulse" />
              <span className="text-[9px] tracking-[0.2em] text-vm-green font-bold uppercase">
                NEXT: {nextPrayer} IN {timeLeft}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Grid of 6 items (spacious layout) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 relative z-10 font-mono">
        {items.map(({ name, key, isObligatory }) => {
          const rawTime = timings[name];
          const time = formatTo12Hour(rawTime);
          const isActive = activePrayer === name;
          const isAttended = isObligatory && prayersLogged[key] === true;

          if (!isObligatory) {
            // Sunrise transit card (spacious)
            return (
              <div
                key={name}
                className="p-5 border border-surface2 bg-[#0c0c0c]/40 opacity-70 flex flex-col justify-between h-32"
                style={{ borderRadius: '2px' }}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[9px] tracking-widest uppercase font-bold text-text-dim/60">
                    {name}
                  </span>
                  <span className="text-[7.5px] px-1.5 py-0.5 bg-surface2/30 text-text-dim/70 tracking-wider uppercase font-bold">
                    TRANSIT
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-sm font-bold tracking-widest text-text-dim">
                    {time}
                  </span>
                  <span className="text-[7px] text-text-dim/40 block tracking-[0.2em] uppercase mt-0.5">
                    SUNRISE
                  </span>
                </div>
              </div>
            );
          }

          // Obligatory prayers clickable buttons (spacious)
          return (
            <button
              key={name}
              onClick={() => handlePrayerToggle(key)}
              className={`p-5 border text-left flex flex-col justify-between h-32 transition-all active:scale-[0.98] relative ${
                isAttended
                  ? 'border-vm-green/50 bg-vm-green/10 shadow-[0_0_12px_rgba(76,170,110,0.15)] text-vm-green font-bold'
                  : isActive
                  ? 'border-vm-green bg-vm-green/10 shadow-[0_0_12px_rgba(16,216,106,0.15)] text-vm-green scale-[1.02] font-bold'
                  : 'border-surface2 bg-[#0c0c0c] text-text-dim hover:border-vm-green/30 hover:text-white'
              }`}
              style={{ borderRadius: '2px' }}
            >
              {isActive && !isAttended && (
                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-vm-green shadow-[0_0_8px_#10D86A]" />
              )}
              {isAttended && (
                <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-vm-green rounded-full flex items-center justify-center">
                  <span className="text-[9px] text-obsidian font-bold">✓</span>
                </div>
              )}

              <div className="flex justify-between items-start w-full">
                <span className={`text-[10px] tracking-widest uppercase font-bold ${
                  isAttended ? 'text-vm-green' : isActive ? 'text-vm-green' : 'text-text-dim'
                }`}>
                  {name}
                </span>
                {isActive && !isAttended && (
                  <span className="text-[7.5px] px-1.5 py-0.5 bg-vm-green text-obsidian font-bold tracking-widest uppercase animate-pulse">
                    ACTIVE
                  </span>
                )}
                {isAttended && (
                  <span className="text-[7.5px] px-1.5 py-0.5 bg-vm-green/20 text-vm-green font-bold tracking-widest uppercase">
                    SECURED
                  </span>
                )}
              </div>

              <div className="mt-4">
                <span className={`text-base font-bold tracking-widest ${
                  isAttended ? 'text-vm-green' : isActive ? 'text-vm-green' : 'text-white'
                }`}>
                  {time}
                </span>
                <span className="text-[7px] text-text-dim/50 block tracking-[0.2em] uppercase mt-0.5">
                  {isAttended ? 'COMPLETED' : isActive ? 'DUE NOW' : 'SALAH'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {activePrayer && activePrayer !== 'Sunrise' && (
        <div className="mt-4 p-2.5 bg-vm-green/10 border border-vm-green/30 text-center animate-pulse relative z-10">
          <p className="text-[8px] text-vm-green tracking-[0.3em] font-bold font-mono">
            ⚠️ SALAH PROTOCOL ACTIVE // DROP DUNYA, STAND AND READ YOUR PRAYERS
          </p>
        </div>
      )}

      {/* PRAYER HISTORY GRAPH INSIDE THE CARD */}
      {prayerHistory && prayerHistory.length > 0 && (
        <div 
          className="mt-2 pt-5 border-t border-vm-green/10 relative w-full z-10 cursor-pointer group flex flex-col items-center"
          onClick={(e) => { 
            e.stopPropagation();
            triggerHaptic('medium'); 
            setSelectedAuditDate(getLocalDateString()); 
            setShowPrayerHistoryModal(true); 
          }}
        >
          <h4 className="text-[9px] text-text-dim tracking-widest uppercase mb-3 font-mono group-hover:text-vm-green transition-colors flex items-center gap-2">
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

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // Today's log for non-negotiables checks
  const [todayLog, setTodayLog] = useState<any>(null);
  const [nns, setNns] = useState<Record<string, boolean>>({});

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
      const [logsResult, streakResult, prayerResult, elesiumResult, todayLogResult, prayerHistoryResult, tasbihResult] = await Promise.all([
        api.logs.list(30).catch(() => []),
        api.logs.streak().catch(() => null),
        pillar === 'deen' ? api.deen.prayerTimes().catch(() => null) : Promise.resolve(null),
        pillar === 'elesium' ? api.elesium.metrics().catch(() => null) : Promise.resolve(null),
        api.logs.today().catch(() => null),
        pillar === 'deen' ? api.deen.prayerHistory().catch(() => []) : Promise.resolve([]),
        pillar === 'deen' ? api.deen.tasbihHistory().catch(() => null) : Promise.resolve(null)
      ]);
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
      await api.logs.addEntry({
        timestamp: new Date().toISOString(),
        pillar: meta.label,
        text: `[LEARNING/CONCEPT] ${learningText}`,
      });
      setLearningText('');
      await loadData();
      triggerHaptic('success');
      showToast("Concept logged successfully", "success");
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
    const textLog = `📖 [QURAN TRACKER] Successfully read Surah ${quranSurah || 'N/A'}, Page/Ayah: ${quranPage || 'N/A'}`;
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
    setEntryText(`✍️ ${tag} \n- Title:\n- Hook Concept:\n- Rhetorical Hooks:\n- core_message:\n`);
    setShowEntryModal(true);
  };

  const handleWordCountSubmit = async () => {
    if (!wordsWritten.trim()) return;
    const count = parseInt(wordsWritten);
    if (isNaN(count)) return;
    const textLog = `✍️ [WRITING ENGINE] Logged ${count} written words into the Elesium content pipeline.`;
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
      const textLog = `🧠 [DISCIPLINE ENGINE] Self-reported accountability score: ${disciplineScore}/10 today. Status: Focused, zero alarm overrides.`;
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
      <header className="sticky top-0 z-20 bg-obsidian/95 backdrop-blur border-b border-white/[0.04] px-6 py-4 pt-safe flex items-center gap-3">
        <button id={`${pillar}-back-btn`} onClick={() => router.push('/home')} className={`text-text-dim hover:${meta.color.replace("text-", "text-")} transition-colors`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-xl font-heading tracking-[0.2em] ${meta.color}`}>
            {meta.icon} {meta.label}
          </h1>
          <p className="text-text-dim text-[10px] tracking-widest">{meta.desc.toUpperCase()}</p>
        </div>
      </header>

      <div className="px-4 py-6 max-w-5xl mx-auto space-y-8">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'STREAK', value: `${pillarStreak}d` },
            { label: 'ENTRIES', value: pillarEntries.length },
            { label: 'TOTAL XP', value: pillarXP },
          ].map(s => (
            <div key={s.label} className={`bg-surface border ${meta.border} p-3 text-center`}>
              <div className={`text-lg font-heading ${meta.color}`}>{s.value}</div>
              <div className="text-[8px] text-text-dim tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ─── DYNAMIC UNIQUE WORKSPACE MODULES ─────────────────────────────── */}
        
        {/* 🌿 DEEN SPIRITUAL INTERFACE */}
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

            {/* 🌿 SPIRITUAL HABITS */}
            <div className="bg-surface border border-surface2 p-5">
              <h3 className="text-xs font-bold tracking-widest text-vm-green mb-4 uppercase flex items-center gap-1.5">
                🌿 SPIRITUAL HABITS
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'fajr_without_alarm', label: '🌄 FAJR ON TIME' },
                  { key: 'adhkar', label: '☀️ ADHKAR' },
                  { key: 'quran_30min', label: '📗 QURAN 30M' },
                  { key: 'memorization_session', label: '🧠 MEMORIZE' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => handleNNToggle(item.key, !nns[item.key])}
                    className={`py-4 px-3 border text-center flex flex-col items-center justify-center h-24 transition-all active:scale-95 ${
                      nns[item.key] 
                        ? 'border-vm-green bg-vm-green/10 text-vm-green shadow-[0_0_15px_rgba(16,216,106,0.2)]' 
                        : 'border-surface2 bg-obsidian text-text-dim hover:border-vm-green/30 hover:text-vm-green shadow-lg'
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
            <div className="bg-surface border border-surface2 p-6 flex flex-col items-center justify-center">
              <h3 className="text-xs font-bold tracking-widest text-vm-green mb-6 uppercase flex items-center gap-1.5 self-start">
                🟢 NATIVE TASBIH COUNT ENGINE
              </h3>
              
              <div className="w-full flex flex-col items-center gap-6">
                <div className="text-center w-full flex flex-col items-center">
                  <span className="text-[9px] text-text-dim tracking-[0.3em] uppercase block mb-2">CURRENT RECITATION</span>
                  <div className="flex items-center justify-center gap-4">
                    <button 
                      onClick={handleTasbihPrev}
                      className="p-2 text-vm-green/40 hover:text-vm-green transition-colors active:scale-95"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <span className="text-2xl sm:text-3xl font-bold text-white tracking-widest uppercase drop-shadow-md min-w-[200px] text-center">
                      {tasbihPhase}
                    </span>
                    <button 
                      onClick={handleTasbihNext}
                      className="p-2 text-vm-green/40 hover:text-vm-green transition-colors active:scale-95"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                  <span className="text-[9px] text-vm-green/60 mt-3 uppercase tracking-widest font-mono block">
                    Target: 33 (Subhan Allah) → 33 (Alhamdulillah) → 33 (Allahu Akbar) → ∞ (Astaghfirullah)
                  </span>
                </div>
                
                <button 
                  onClick={handleTasbihTap}
                  className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border-4 border-vm-green/40 bg-vm-green/5 hover:bg-vm-green/15 active:bg-vm-green/30 active:scale-95 transition-all flex flex-col items-center justify-center shadow-[0_0_40px_rgba(16,216,106,0.15)] my-4"
                >
                  <span className="text-6xl sm:text-8xl font-bold text-vm-green font-mono drop-shadow-[0_0_15px_rgba(16,216,106,0.6)]">{tasbihCount}</span>
                  <span className="text-[10px] sm:text-xs text-vm-green/60 tracking-[0.4em] uppercase font-mono mt-2">TAP TO COUNT</span>
                </button>

                <div className="flex w-full justify-between items-end mt-4 border-t border-surface2/50 pt-4">
                  <div className="flex flex-col gap-1 text-[9px] tracking-widest font-mono uppercase text-text-dim/80">
                    <span>Total Session: <span className="text-vm-green font-bold">{tasbihTotals.total}</span></span>
                    {tasbihHistory && (
                      <span>All-Time Saved: <span className="text-vm-green font-bold">{tasbihHistory.all_time_total}</span></span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={handleTasbihReset}
                      className="px-5 py-3 border border-surface2 hover:border-vm-red/40 text-[10px] text-text-dim hover:text-vm-red transition-colors font-mono tracking-widest uppercase active:scale-95"
                    >
                      Clear
                    </button>
                    <button 
                      onClick={handleTasbihSave}
                      disabled={isTasbihSaving || tasbihTotals.total === 0}
                      className="px-5 py-3 border border-vm-green bg-vm-green/10 hover:bg-vm-green/20 text-[10px] text-vm-green transition-colors font-mono tracking-widest uppercase active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-[0_0_15px_rgba(16,216,106,0.2)]"
                    >
                      {isTasbihSaving ? 'SAVING...' : 'SECURE & SAVE'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quran progress log */}
            <div className="bg-surface border border-surface2 p-5 flex flex-col md:flex-row gap-4 justify-between items-end">
              <div className="flex-1 w-full space-y-3">
                <h3 className="text-xs font-bold tracking-widest text-vm-green uppercase flex items-center gap-1.5">
                  📗 QURAN PROGRESS LOGGER
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] text-text-dim tracking-widest uppercase font-mono block">Surah Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Al-Mulk"
                      value={quranSurah}
                      onChange={e => setQuranSurah(e.target.value)}
                      className="w-full bg-obsidian border border-surface2 p-2 text-xs text-white outline-none focus:border-vm-green/50 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] text-text-dim tracking-widest uppercase font-mono block">Page / Ayah</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Page 562"
                      value={quranPage}
                      onChange={e => setQuranPage(e.target.value)}
                      className="w-full bg-obsidian border border-surface2 p-2 text-xs text-white outline-none focus:border-vm-green/50 font-mono"
                    />
                  </div>
                </div>
              </div>
              <button 
                onClick={handleQuranSubmit}
                disabled={!quranPage.trim() && !quranSurah.trim()}
                className="w-full md:w-auto px-6 py-2.5 bg-vm-green text-obsidian font-bold tracking-widest text-xs disabled:opacity-30 self-stretch md:self-end h-[36px]"
              >
                LOG PROGRESS
              </button>
            </div>

            {/* Prayer History Graph — Enhanced with range and stats */}
            {prayerHistory.length > 0 && (
              <div 
                className="bg-surface border border-surface2 p-4 mt-6 cursor-pointer group/card hover:border-vm-green/30 transition-colors"
                onClick={() => { 
                  triggerHaptic('medium'); 
                  setSelectedAuditDate(getLocalDateString()); 
                  setShowPrayerHistoryModal(true); 
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold tracking-widest text-vm-green flex items-center gap-1.5 group-hover/card:text-vm-green/70 transition-colors">
                    🌱 PRAYER COMMITMENT LOG <span className="text-[8px] opacity-60 font-normal lowercase tracking-normal text-text-dim">(click to audit)</span>
                  </h2>
                  <div className="flex items-center gap-3">
                    {/* Streak badge */}
                    {(() => {
                      let streak = 0;
                      for (let i = prayerHistory.length - 1; i >= 0; i--) {
                        if (prayerHistory[i].count === 5) streak++;
                        else break;
                      }
                      return streak > 0 ? (
                        <span className="text-[8px] bg-vm-green/10 border border-vm-green/30 px-2 py-0.5 text-vm-green font-bold tracking-wider font-mono">
                          🌿 {streak}D STREAK
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>

                {/* Line chart */}
                <div className="mb-3">
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
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.04]">
                  <div className="text-center">
                    <p className="text-sm font-bold text-vm-green font-mono">
                      {prayerHistory.filter(d => d.count === 5).length}
                    </p>
                    <p className="text-[7px] text-text-dim tracking-[0.2em]">5/5 DAYS</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-vm-green font-mono">
                      {prayerHistory.length > 0 
                        ? Math.round((prayerHistory.reduce((s, d) => s + d.count, 0) / (prayerHistory.length * 5)) * 100)
                        : 0}%
                    </p>
                    <p className="text-[7px] text-text-dim tracking-[0.2em]">COMPLETION</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-vm-green font-mono">
                      {prayerHistory.reduce((s, d) => s + d.count, 0)}
                    </p>
                    <p className="text-[7px] text-text-dim tracking-[0.2em]">TOTAL SALAH</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 💎 ELESIUM EMPIRE — BUSINESS + CONTENT */}
        {pillar === 'elesium' && (
          <div className="space-y-6 animate-fade-up">
            
            {/* Tabs Selector */}
            <div className="flex border border-surface2 rounded-sm overflow-hidden p-1 bg-surface/50">
              <button
                onClick={() => { triggerHaptic('light'); setElesiumTab('business'); }}
                className={`flex-1 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                  elesiumTab === 'business'
                    ? 'bg-vm-blue/20 text-vm-blue border border-vm-blue/30 shadow-[0_0_10px_rgba(76,126,201,0.2)]'
                    : 'text-text-dim hover:text-white hover:bg-white/5'
                }`}
              >
                <Zap className="w-3.5 h-3.5" /> Business
              </button>
              <button
                onClick={() => { triggerHaptic('light'); setElesiumTab('content'); }}
                className={`flex-1 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                  elesiumTab === 'content'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(167,139,250,0.2)]'
                    : 'text-text-dim hover:text-white hover:bg-white/5'
                }`}
              >
                <Target className="w-3.5 h-3.5" /> Content
              </button>
            </div>

            {/* ── CONTAINER 1: BUSINESS ─────────────────────────────────── */}
            {elesiumTab === 'business' && (
            <div
              className="border p-5 relative overflow-hidden space-y-5"
              style={{
                borderRadius: '3px',
                borderColor: 'rgba(76,126,201,0.35)',
                background: 'linear-gradient(135deg, rgba(76,126,201,0.05) 0%, rgba(0,0,0,0.70) 100%)',
                boxShadow: '0 0 20px rgba(76,126,201,0.06), inset 0 1px 0 rgba(76,126,201,0.12)',
              }}
            >
              {/* Section header */}
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-sm bg-vm-blue/15 border border-vm-blue/30 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-vm-blue" />
                </div>
                <div>
                  <h3 className="text-xs font-bold tracking-[0.2em] text-vm-blue uppercase font-mono">BUSINESS</h3>
                  <p className="text-[8px] text-text-dim tracking-widest uppercase font-mono mt-0.5">Empire Pipeline · Revenue · Outreach</p>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Emails Sent */}
                <div className="bg-obsidian border border-surface2 p-3 flex flex-col justify-between h-24">
                  <span className="text-[8px] text-text-dim tracking-widest uppercase font-mono">Outreach Today</span>
                  <div className="flex items-center justify-between">
                    <ScrubNumberInput value={emailsSent} onChangeValue={(val) => setEmailsSent(Number(val) || 0)} className="w-14 bg-transparent text-xl font-bold text-white font-mono outline-none" />
                    <div className="flex flex-col gap-1">
                      <button onClick={() => { triggerHaptic('light'); setEmailsSent(n => n+5); }} className="w-7 h-5 border border-surface2 hover:border-vm-blue text-[9px] flex items-center justify-center font-bold">+5</button>
                      <button onClick={() => { triggerHaptic('light'); setEmailsSent(n => Math.max(0, n-5)); }} className="w-7 h-5 border border-surface2 hover:border-vm-blue text-[9px] flex items-center justify-center font-bold">-5</button>
                    </div>
                  </div>
                </div>

                {/* Positive Replies */}
                <div className="bg-obsidian border border-surface2 p-3 flex flex-col justify-between h-24">
                  <span className="text-[8px] text-text-dim tracking-widest uppercase font-mono">Positive Replies</span>
                  <div className="flex items-center justify-between">
                    <ScrubNumberInput value={positiveReplies} onChangeValue={(val) => setPositiveReplies(Number(val) || 0)} className="w-14 bg-transparent text-xl font-bold text-white font-mono outline-none" />
                    <div className="flex flex-col gap-1">
                      <button onClick={() => { triggerHaptic('light'); setPositiveReplies(n => n+1); }} className="w-7 h-5 border border-surface2 hover:border-vm-blue text-[9px] flex items-center justify-center font-bold">+</button>
                      <button onClick={() => { triggerHaptic('light'); setPositiveReplies(n => Math.max(0, n-1)); }} className="w-7 h-5 border border-surface2 hover:border-vm-blue text-[9px] flex items-center justify-center font-bold">-</button>
                    </div>
                  </div>
                </div>

                {/* Meetings Booked */}
                <div className="bg-obsidian border border-surface2 p-3 flex flex-col justify-between h-24">
                  <span className="text-[8px] text-text-dim tracking-widest uppercase font-mono">Meetings / Month</span>
                  <div className="flex items-center justify-between">
                    <ScrubNumberInput value={meetingsBooked} onChangeValue={(val) => setMeetingsBooked(Number(val) || 0)} className="w-14 bg-transparent text-xl font-bold text-white font-mono outline-none" />
                    <div className="flex flex-col gap-1">
                      <button onClick={() => { triggerHaptic('light'); setMeetingsBooked(n => n+1); }} className="w-7 h-5 border border-surface2 hover:border-vm-blue text-[9px] flex items-center justify-center font-bold">+</button>
                      <button onClick={() => { triggerHaptic('light'); setMeetingsBooked(n => Math.max(0, n-1)); }} className="w-7 h-5 border border-surface2 hover:border-vm-blue text-[9px] flex items-center justify-center font-bold">-</button>
                    </div>
                  </div>
                </div>

                {/* MRR */}
                <div className="bg-obsidian border border-surface2 p-3 flex flex-col justify-between h-24">
                  <span className="text-[8px] text-text-dim tracking-widest uppercase font-mono">MRR (USD)</span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-white font-mono">$</span>
                      <ScrubNumberInput value={mrrUsd} onChangeValue={(val) => setMrrUsd(Number(val) || 0)} className="w-14 bg-transparent text-lg font-bold text-white font-mono outline-none" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => { triggerHaptic('light'); setMrrUsd(n => n+250); }} className="w-7 h-5 border border-surface2 hover:border-vm-blue text-[7px] flex items-center justify-center font-bold">+250</button>
                      <button onClick={() => { triggerHaptic('light'); setMrrUsd(n => Math.max(0, n-100)); }} className="w-7 h-5 border border-surface2 hover:border-vm-blue text-[7px] flex items-center justify-center font-bold">-100</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* MRR progress bar */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[8px] text-text-dim uppercase tracking-wider font-mono">TARGET: $1,000 MRR</span>
                  <span className="text-[8px] text-vm-blue font-bold font-mono">{Math.min(100, Math.round((mrrUsd / 1000) * 100))}%</span>
                </div>
                <div className="h-1 bg-surface2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-vm-blue transition-all duration-500"
                    style={{ width: `${Math.min(100, (mrrUsd / 1000) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Deep Work toggle + Save row */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleNNToggle('deep_work_4hr', !nns['deep_work_4hr'])}
                  className={`flex-1 flex items-center gap-2 px-3 py-2.5 border text-[10px] font-bold tracking-widest transition-colors ${
                    nns['deep_work_4hr']
                      ? 'border-vm-blue bg-vm-blue/10 text-vm-blue'
                      : 'border-surface2 text-text-dim hover:text-white hover:border-vm-blue/40'
                  }`}
                >
                  <Timer className="w-4 h-4 shrink-0" />
                  {nns['deep_work_4hr'] ? '✅ 4HR DEEP WORK DONE' : '4-HR DEEP WORK — MARK DONE'}
                </button>
                <button
                  onClick={handleElesiumSave}
                  disabled={isElesiumSaving}
                  className="px-5 py-2.5 bg-vm-blue text-white font-bold tracking-widest text-[10px] disabled:opacity-40 shrink-0"
                >
                  {isElesiumSaving ? 'SAVING...' : 'SYNC'}
                </button>
              </div>
            </div>
            )}

            {/* ── CONTAINER 2: CONTENT SYSTEM ───────────────────────────── */}
            {elesiumTab === 'content' && (
            <div
              className="border p-5 relative overflow-hidden space-y-5"
              style={{
                borderRadius: '3px',
                borderColor: 'rgba(167,139,250,0.35)',
                background: 'linear-gradient(135deg, rgba(167,139,250,0.05) 0%, rgba(0,0,0,0.70) 100%)',
                boxShadow: '0 0 20px rgba(167,139,250,0.06), inset 0 1px 0 rgba(167,139,250,0.12)',
              }}
            >
              {/* Section header */}
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-sm bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                  <Target className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold tracking-[0.2em] text-purple-400 uppercase font-mono">CONTENT SYSTEM</h3>
                  <p className="text-[8px] text-text-dim tracking-widest uppercase font-mono mt-0.5">Videos · Threads · Ideas Pipeline</p>
                </div>
              </div>

              {/* Content metrics */}
              <div className="grid grid-cols-2 gap-3">
                {/* Videos Posted */}
                <div className="bg-obsidian border border-surface2 p-3 flex flex-col justify-between h-24">
                  <span className="text-[8px] text-text-dim tracking-widest uppercase font-mono">Videos Posted</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-purple-400 font-mono tabular-nums">{videosPosted}</span>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => { triggerHaptic('light'); setVideosPosted(n => n + 1); }} className="w-7 h-5 border border-surface2 hover:border-purple-500 text-[9px] flex items-center justify-center font-bold text-purple-400">+</button>
                      <button onClick={() => { triggerHaptic('light'); setVideosPosted(n => Math.max(0, n - 1)); }} className="w-7 h-5 border border-surface2 hover:border-purple-500 text-[9px] flex items-center justify-center font-bold text-text-dim">-</button>
                    </div>
                  </div>
                </div>

                {/* Threads / Posts */}
                <div className="bg-obsidian border border-surface2 p-3 flex flex-col justify-between h-24">
                  <span className="text-[8px] text-text-dim tracking-widest uppercase font-mono">Threads / Posts</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-purple-400 font-mono tabular-nums">{threadsPosted}</span>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => { triggerHaptic('light'); setThreadsPosted(n => n + 1); }} className="w-7 h-5 border border-surface2 hover:border-purple-500 text-[9px] flex items-center justify-center font-bold text-purple-400">+</button>
                      <button onClick={() => { triggerHaptic('light'); setThreadsPosted(n => Math.max(0, n - 1)); }} className="w-7 h-5 border border-surface2 hover:border-purple-500 text-[9px] flex items-center justify-center font-bold text-text-dim">-</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content idea logger */}
              <div className="space-y-2">
                <label className="text-[8px] text-purple-400/70 tracking-[0.2em] uppercase font-mono block">💎 LOG CONTENT IDEA / HOOK</label>
                <textarea
                  value={contentIdea}
                  onChange={e => setContentIdea(e.target.value)}
                  placeholder="Drop a content idea, hook, or script concept..."
                  className="w-full bg-black/40 border border-purple-500/20 p-3 text-sm text-white font-mono focus:outline-none focus:border-purple-500/50 min-h-[80px] resize-none placeholder:text-white/20"
                />
                <button
                  disabled={!contentIdea.trim() || isContentSaving}
                  onClick={async () => {
                    if (!contentIdea.trim()) return;
                    setIsContentSaving(true);
                    triggerHaptic('medium');
                    try {
                      await api.logs.addEntry({
                        timestamp: new Date().toISOString(),
                        pillar: 'ELESIUM',
                        text: `🎯 [CONTENT IDEA] ${contentIdea.trim()}`,
                      });
                      setContentIdea('');
                      triggerHaptic('success');
                      await loadData();
                    } catch { /* ignore */ } finally {
                      setIsContentSaving(false);
                    }
                  }}
                  className="w-full py-3 bg-purple-500/20 border border-purple-500/40 hover:bg-purple-500/30 text-purple-300 font-bold tracking-[0.2em] text-[10px] disabled:opacity-30 transition-colors"
                >
                  {isContentSaving ? 'SAVING IDEA...' : 'LOCK IN IDEA →'}
                </button>
              </div>
            </div>
            )}

          </div>
        )}

        {/* 🎯 INFLUENCE content weapon */}
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
                ✍️ QUICK ESSAY & CONTENT IDEATOR TEMPLATES
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
                  ✍️ PIPELINE WORD COUNT LOGGER
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

        {/* 🧠 SELF discipline control */}
        {pillar === 'self' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up">
            <div className="space-y-6 flex flex-col">
              {/* Trigger Avoidance checklist */}
              <div className="bg-surface border border-vm-amethyst/30 p-5 flex-1" style={{ borderRadius: '2px', background: 'linear-gradient(135deg, rgba(168,85,247,0.02), rgba(0,0,0,0.65))' }}>
                <h3 className="text-xs font-bold tracking-widest text-vm-amethyst mb-3 uppercase flex items-center gap-1.5">
                  🧠 DAILY VULNERABILITY & TRIGGER CHECKLIST
                </h3>
                <p className="text-[9px] text-text-dim tracking-wide mb-4">CHECK OFF WHEN YOU SUCCESSFULLY COMBAT AND AVOID A DISCIPLINE TRIGGER:</p>

                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { key: 'no_sugar', label: '🚫 No Sugar Today' },
                    { key: 'sleep_on_floor', label: '🪵 Slept on Floor (Comfort Lock)' },
                    { key: 'cold_shower', label: '🚿 Neuro Cold Shower' },
                    { key: 'combat_training', label: '🥋 Combat Training (OCI)' },
                    { key: 'learned_concept', label: '🧠 Learned a New Concept / Deep Study' },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => handleNNToggle(item.key, !nns[item.key])}
                      className={`p-3.5 border text-left flex items-center justify-between gap-3 transition-colors ${
                        nns[item.key] 
                          ? 'border-vm-amethyst bg-vm-amethyst/10 text-vm-amethyst font-bold' 
                          : 'border-surface2 bg-obsidian text-text-dim hover:border-vm-amethyst/30 hover:text-white'
                      }`}
                    >
                      <span className="text-[10px] tracking-wider font-mono">{item.label}</span>
                      <span className="text-[8px] font-mono font-bold tracking-widest bg-obsidian/40 px-2 py-0.5 border border-white/[0.04]">
                        {nns[item.key] ? 'AVOIDED' : 'UNSECURED'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Knowledge Bank Log */}
              <div className="bg-surface border border-vm-amethyst/30 p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold tracking-widest text-vm-amethyst uppercase flex items-center gap-1.5">
                    📚 KNOWLEDGE BANK
                  </h3>
                  <button
                    onClick={handleOpenMaterials}
                    className="px-3 py-1 bg-vm-amethyst/10 border border-vm-amethyst/30 hover:bg-vm-amethyst/20 text-vm-amethyst text-[9px] font-bold tracking-widest uppercase transition-colors"
                    style={{ borderRadius: '2px' }}
                  >
                    📚 MATERIALS
                  </button>
                </div>
                <p className="text-[9px] text-text-dim tracking-wide">LOG ANY NEW CONCEPTS OR TOPICS STUDIED TODAY:</p>
                <textarea
                  value={learningText}
                  onChange={(e) => setLearningText(e.target.value)}
                  placeholder="e.g. Studied NAVY SEAL breathing patterns..."
                  className="w-full bg-black/40 border border-white/10 p-3 text-sm text-white font-mono focus:outline-none focus:border-vm-amethyst/50 min-h-[80px]"
                />
                <button
                  onClick={handleLogLearning}
                  disabled={!learningText.trim()}
                  className="w-full py-3 bg-vm-amethyst/20 border border-vm-amethyst/50 text-vm-amethyst font-bold text-[10px] tracking-widest hover:bg-vm-amethyst/30 disabled:opacity-40 transition-colors"
                >
                  UPLOAD TO BRAIN
                </button>

                {/* Today's topics studied list */}
                {(() => {
                  const todayStr = getLocalDateString();
                  const todaySelfEntries = pillarEntries.filter(e => {
                    const entryDate = e.timestamp.split('T')[0];
                    return entryDate === todayStr && e.text.startsWith('[LEARNING/CONCEPT]');
                  });

                  if (todaySelfEntries.length === 0) return null;

                  return (
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                      <p className="text-[9px] text-vm-green tracking-widest font-bold uppercase">TODAY&apos;S TOPICS STUDIED:</p>
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
                        {todaySelfEntries.map((e, idx) => {
                          const cleanText = e.text.replace('[LEARNING/CONCEPT] ', '');
                          return (
                            <div key={idx} className="p-2.5 bg-black/30 border border-vm-green/10 text-xs font-mono text-white flex items-start justify-between">
                              <span className="leading-relaxed">{cleanText}</span>
                              <span className="text-[7.5px] text-text-dim shrink-0 ml-2 font-mono mt-0.5">
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

            <div className="space-y-6 flex flex-col">
              {/* Accountability Lens Camera Zone */}
              <div 
                onClick={() => {
                  if (!isUploading && fileInputRef.current) {
                    fileInputRef.current.value = '';
                    fileInputRef.current.click();
                  }
                }}
                className="bg-surface border border-vm-green/30 p-8 flex flex-col items-center justify-center text-center flex-1 min-h-[250px] cursor-pointer hover:border-vm-green/50 active:scale-[0.99] transition-all"
                style={{ background: 'linear-gradient(135deg, rgba(76,170,110,0.04), rgba(0,0,0,0.75))' }}
              >
                <div className="w-20 h-20 rounded-full border-2 border-vm-green/50 flex items-center justify-center mb-4 bg-vm-green/10 shadow-[0_0_20px_rgba(76,170,110,0.2)]">
                  <Camera className="w-10 h-10 text-vm-green" />
                </div>
                <h3 className="text-sm font-bold text-vm-green tracking-widest font-mono mb-2">ACCOUNTABILITY LENS</h3>
                <p className="text-[9px] text-text-dim tracking-widest mb-6">SNAP PROOF OF YOUR DISCIPLINE.</p>
                <button
                  disabled={isUploading}
                  className="w-full py-4 bg-vm-green text-obsidian font-bold tracking-[0.2em] hover:bg-vm-green/90 transition-colors pointer-events-none"
                >
                  {isUploading ? 'PROCESSING...' : 'CAPTURE PROOF'}
                </button>
              </div>

              {/* Discipline 1-10 Slider */}
              <div className="bg-surface border border-surface2 p-5 space-y-4 shrink-0">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold tracking-widest text-vm-green uppercase flex items-center gap-1.5">
                    🧠 DAILY DISCIPLINE ACCOUNTABILITY SCORE
                  </h3>
                  <span className="text-lg font-bold text-vm-green font-mono">{disciplineScore}/10</span>
                </div>

                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={disciplineScore}
                    disabled={todayLog?.score !== undefined && todayLog?.score !== null}
                    onChange={e => setDisciplineScore(parseInt(e.target.value))}
                    className={`flex-1 accent-vm-green h-1 bg-surface2 rounded-lg appearance-none cursor-pointer ${
                      todayLog?.score !== undefined && todayLog?.score !== null ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                  />
                  <button
                    disabled={todayLog?.score !== undefined && todayLog?.score !== null}
                    onClick={handleDisciplineScoreSubmit}
                    className={`px-5 py-2 font-mono font-bold text-[10px] tracking-widest transition-all duration-300
                      ${todayLog?.score !== undefined && todayLog?.score !== null 
                        ? 'bg-vm-green/5 border border-vm-green/10 text-vm-green/40 opacity-50 cursor-not-allowed' 
                        : 'bg-vm-green/20 border border-vm-green/50 text-vm-green hover:bg-vm-green/30'
                      }`}
                  >
                    {todayLog?.score !== undefined && todayLog?.score !== null ? 'SCORE SECURED' : 'SECURE SCORE'}
                  </button>
                </div>
                {todayLog?.score !== undefined && todayLog?.score !== null ? (
                  <div className="space-y-1">
                    <p className="text-[8px] text-vm-green tracking-widest uppercase font-mono text-center animate-pulse">
                      ⚡ SCORE SECURED. NEXT DAY OPENS AT 12:00 AM MIDNIGHT ⚡
                    </p>
                  </div>
                ) : (
                  <p className="text-[8px] text-text-dim tracking-widest uppercase font-mono text-center">HONEST ACCOUNTABILITY DRIVES LONG-TERM EMPIRE POWER</p>
                )}
              </div>
            </div>
          </div>
        )}

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
          style={{ backgroundColor: meta.color.includes('gold') ? '#10D86A' : meta.color.includes('blue') ? '#4c7ec9' : meta.color.includes('purple') ? '#a78bfa' : '#4caa6e' }}
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
                🌿 SALAH LOG
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

      {/* 🌿 Prayer History Tracker/Audit Modal */}
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

      {/* 📚 Study Materials Modal */}
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
                  📚 STUDY MATERIALS & CORE READINGS
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
                  <div className="animate-spin text-2xl">⏳</div>
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
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚡' : 'ℹ'}
            </span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
