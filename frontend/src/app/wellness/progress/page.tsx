'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Moon, Zap, Droplets, Timer, Activity, TrendingUp, Target, Award } from 'lucide-react';
import { api } from '@/lib/api';
import { triggerHaptic } from '@/lib/utils';

const RANGES = ['7d', '14d', '30d', '90d', '180d', '365d'] as const;
const RANGE_LABELS: Record<string, string> = {
  '7d': '7D', '14d': '14D', '30d': '30D', '90d': '3M', '180d': '6M', '365d': '1Y'
};

function StatCard({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color: string }) {
  return (
    <div className="bg-obsidian border border-white/[0.06] p-3 text-center">
      <div className={`text-lg font-bold font-mono ${color}`}>
        {value}{unit && <span className="text-[10px] text-text-dim ml-0.5">{unit}</span>}
      </div>
      <div className="text-[7px] text-text-dim tracking-[0.3em] uppercase mt-1">{label}</div>
    </div>
  );
}

function LineChart({ 
  data, 
  valueKey, 
  goalValue, 
  color, 
  goalColor = 'rgba(201,168,76,0.6)',
  unit = '',
  maxOverride,
}: { 
  data: any[]; 
  valueKey: string; 
  goalValue?: number; 
  color: string; 
  goalColor?: string; 
  unit?: string;
  maxOverride?: number;
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-text-dim text-[10px] tracking-widest border border-white/[0.04] bg-obsidian">
        NO DATA AVAILABLE
      </div>
    );
  }

  // Sort chronologically (ascending)
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));

  // If only one data point, duplicate to show a line
  const chartPoints = sortedData.length === 1 
    ? [
        { ...sortedData[0], date: 'Prev' },
        sortedData[0]
      ] 
    : sortedData;

  const width = 500;
  const height = 160;
  const paddingLeft = 40;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const values = chartPoints.map((d) => d[valueKey] || 0);
  const minVal = 0;
  const maxVal = maxOverride ?? Math.max(...values, goalValue || 0, 1) * 1.15;
  const valRange = maxVal - minVal;

  const getCoords = (index: number, val: number) => {
    const x = paddingLeft + (index / (chartPoints.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((val - minVal) / valRange) * chartHeight;
    return { x, y };
  };

  let pathD = '';
  chartPoints.forEach((d, i) => {
    const { x, y } = getCoords(i, d[valueKey] || 0);
    if (i === 0) {
      pathD = `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  });

  // Grid lines
  const gridCount = 3;
  const gridLines = [];
  for (let i = 0; i <= gridCount; i++) {
    const val = minVal + (i / gridCount) * valRange;
    const y = paddingTop + chartHeight - (i / gridCount) * chartHeight;
    gridLines.push({ y, val });
  }

  // Goal line coordinates
  const goalY = goalValue && valRange > 0
    ? paddingTop + chartHeight - ((goalValue - minVal) / valRange) * chartHeight
    : null;

  const labelStep = Math.max(1, Math.ceil(chartPoints.length / 10));

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible font-mono text-[8px] fill-text-dim">
        <defs>
          <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Grid lines */}
        {gridLines.map((line, idx) => (
          <g key={idx} className="opacity-10">
            <line
              x1={paddingLeft}
              y1={line.y}
              x2={width - paddingRight}
              y2={line.y}
              stroke="#ffffff"
              strokeWidth="0.8"
              strokeDasharray="4 4"
            />
            <text x={paddingLeft - 8} y={line.y + 3} textAnchor="end" fill="#ffffff">
              {line.val.toFixed(1)}{unit}
            </text>
          </g>
        ))}

        {/* Goal line */}
        {goalY !== null && goalY >= paddingTop && goalY <= paddingTop + chartHeight && (
          <g>
            <line
              x1={paddingLeft}
              y1={goalY}
              x2={width - paddingRight}
              y2={goalY}
              stroke={goalColor}
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text
              x={width - paddingRight}
              y={goalY - 4}
              textAnchor="end"
              fill={goalColor}
              className="font-bold text-[7px]"
            >
              GOAL {goalValue}{unit}
            </text>
          </g>
        )}

        {/* Main Line path */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          filter="url(#line-glow)"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Circles on data points */}
        {chartPoints.map((d, i) => {
          const val = d[valueKey] || 0;
          const { x, y } = getCoords(i, val);
          
          let tooltipXOffset = 0;
          let textAnchor = 'middle';
          if (i === 0) {
            tooltipXOffset = 18;
            textAnchor = 'start';
          } else if (i === chartPoints.length - 1) {
            tooltipXOffset = -18;
            textAnchor = 'end';
          }

          return (
            <g key={i} className="group/point">
              <circle
                cx={x}
                cy={y}
                r="10"
                fill="transparent"
                className="cursor-pointer"
              />
              <circle
                cx={x}
                cy={y}
                r="3.5"
                fill="#060606"
                stroke={color}
                strokeWidth="1.8"
                className="transition-transform duration-150 cursor-pointer group-hover/point:scale-125"
              />
              <g className="opacity-0 group-hover/point:opacity-100 transition-opacity duration-150 pointer-events-none">
                <rect
                  x={x - 22 + tooltipXOffset}
                  y={y - 26}
                  width="44"
                  height="16"
                  fill="#060606"
                  stroke={color}
                  strokeWidth="0.8"
                  rx="2"
                />
                <text
                  x={x + tooltipXOffset}
                  y={y - 15}
                  textAnchor="middle"
                  fill="#ffffff"
                  className="font-bold text-[7.5px]"
                >
                  {val.toFixed(1)}{unit}
                </text>
              </g>
            </g>
          );
        })}

        {/* X axis labels */}
        {chartPoints.map((d, i) => {
          if (i % labelStep !== 0 && i !== chartPoints.length - 1) return null;
          const { x } = getCoords(i, d[valueKey] || 0);
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

export default function WellnessProgress() {
  const router = useRouter();
  const [range, setRange] = useState<string>('30d');
  const [loading, setLoading] = useState(true);
  
  const [sleepData, setSleepData] = useState<any>(null);
  const [fastData, setFastData] = useState<any>(null);
  const [hydrationData, setHydrationData] = useState<any>(null);
  const [readinessData, setReadinessData] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sleep, fast, hydration, readiness] = await Promise.all([
        api.wellness.sleep.progress(range).catch(() => null),
        api.wellness.fast.progress(range).catch(() => null),
        api.wellness.hydration.progress(range).catch(() => null),
        api.wellness.readiness.progress(range).catch(() => null),
      ]);
      setSleepData(sleep);
      setFastData(fast);
      setHydrationData(hydration);
      setReadinessData(readiness);
    } catch { /* non-critical */ }
    setLoading(false);
  }, [range]);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div className="min-h-screen bg-obsidian text-gray-300 font-mono relative pb-10 overflow-x-hidden">
      <div className="scanline-overlay" />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-obsidian/95 backdrop-blur-sm border-b border-white/[0.04] px-4 py-4 pt-safe flex items-center gap-3">
        <button
          onClick={() => { triggerHaptic('light'); router.push('/wellness'); }}
          className="p-2 -ml-2 text-text-dim hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-gold font-mono font-bold tracking-[0.3em] text-base">📊 PROGRESS</h1>
          <p className="text-[9px] text-text-dim tracking-widest mt-0.5">WELLNESS ANALYTICS ENGINE</p>
        </div>
        <TrendingUp className="w-4 h-4 text-text-dim/50" />
      </header>

      {/* Range Selector */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-1 bg-surface border border-white/[0.06] p-1">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => { triggerHaptic('light'); setRange(r); }}
              className={`flex-1 py-2 text-[10px] font-bold tracking-widest font-mono transition-all ${
                range === r
                  ? 'bg-gold/15 text-gold border border-gold/40'
                  : 'text-text-dim hover:text-white border border-transparent'
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border border-gold/20 border-t-gold/80 rounded-full animate-spin" />
          <p className="text-text-dim text-[10px] tracking-[0.4em] animate-pulse">CRUNCHING DATA...</p>
        </div>
      ) : (
        <div className="px-4 space-y-6 pb-8">

          {/* ── SLEEP ──────────────────────────────────────────── */}
          <section className="bg-surface border border-indigo-500/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] tracking-[0.3em] font-bold text-indigo-300">SLEEP ANALYTICS</span>
              </div>
              {sleepData?.summary && (
                <span className="text-[9px] text-indigo-300/70 font-mono">
                  {sleepData.summary.goal_compliance_pct}% GOAL HIT
                </span>
              )}
            </div>
            
            <LineChart 
              data={sleepData?.data || []} 
              valueKey="hours" 
              goalValue={7.5} 
              color="rgb(129, 140, 248)" 
              goalColor="rgba(129, 140, 248, 0.5)"
              unit="h"
            />

            {sleepData?.summary && (
              <div className="grid grid-cols-4 gap-2">
                <StatCard label="AVG SLEEP" value={sleepData.summary.avg_hours} unit="h" color="text-indigo-300" />
                <StatCard label="GOAL" value={sleepData.summary.goal_hours} unit="h" color="text-text-dim" />
                <StatCard label="BEST" value={sleepData.summary.best_night_hours} unit="h" color="text-vm-green" />
                <StatCard label="WORST" value={sleepData.summary.worst_night_hours} unit="h" color="text-vm-red" />
              </div>
            )}
          </section>

          {/* ── FASTING ────────────────────────────────────────── */}
          <section className="bg-surface border border-orange-500/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-[10px] tracking-[0.3em] font-bold text-orange-300">FASTING ANALYTICS</span>
              </div>
              {fastData?.summary && (
                <span className="text-[9px] text-orange-300/70 font-mono">
                  STREAK: {fastData.summary.current_streak}
                </span>
              )}
            </div>
            
            <LineChart 
              data={fastData?.data || []} 
              valueKey="hours" 
              goalValue={16} 
              color="rgb(251, 146, 60)" 
              goalColor="rgba(251, 146, 60, 0.5)"
              unit="h"
            />

            {fastData?.summary && (
              <div className="grid grid-cols-4 gap-2">
                <StatCard label="AVG FAST" value={fastData.summary.avg_hours} unit="h" color="text-orange-300" />
                <StatCard label="GOAL" value={`${fastData.summary.goal_hours}h`} color="text-text-dim" />
                <StatCard label="LONGEST" value={fastData.summary.longest_fast_hours} unit="h" color="text-vm-green" />
                <StatCard label="MAX STREAK" value={fastData.summary.max_streak} color="text-gold" />
              </div>
            )}
          </section>

          {/* ── HYDRATION ──────────────────────────────────────── */}
          <section className="bg-surface border border-blue-500/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] tracking-[0.3em] font-bold text-blue-300">HYDRATION ANALYTICS</span>
              </div>
              {hydrationData?.summary && (
                <span className="text-[9px] text-blue-300/70 font-mono">
                  {hydrationData.summary.goal_compliance_pct}% COMPLIANCE
                </span>
              )}
            </div>
            
            <LineChart 
              data={hydrationData?.data || []} 
              valueKey="liters" 
              goalValue={4.5} 
              color="rgb(96, 165, 250)" 
              goalColor="rgba(96, 165, 250, 0.5)"
              unit="L"
            />

            {hydrationData?.summary && (
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="AVG DAILY" value={hydrationData.summary.avg_liters} unit="L" color="text-blue-300" />
                <StatCard label="BEST DAY" value={(hydrationData.summary.best_day_ml / 1000).toFixed(1)} unit="L" color="text-vm-green" />
                <StatCard label="DAYS LOGGED" value={hydrationData.summary.total_days} color="text-text-dim" />
              </div>
            )}
          </section>

          {/* ── READINESS ──────────────────────────────────────── */}
          <section className="bg-surface border border-gold/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gold" />
                <span className="text-[10px] tracking-[0.3em] font-bold text-gold">READINESS TREND</span>
              </div>
              {readinessData?.summary && (
                <span className="text-[9px] text-gold/70 font-mono">
                  {readinessData.summary.peak_state_days} PEAK DAYS
                </span>
              )}
            </div>
            
            <LineChart 
              data={readinessData?.data || []} 
              valueKey="score" 
              goalValue={13}
              maxOverride={15}
              color="rgb(201, 168, 76)" 
              goalColor="rgba(201, 168, 76, 0.5)"
              unit="/15"
            />

            {readinessData?.summary && (
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="AVG SCORE" value={readinessData.summary.avg_score} unit="/15" color="text-gold" />
                <StatCard label="BEST" value={readinessData.summary.best_day_score} unit="/15" color="text-vm-green" />
                <StatCard label="DAYS LOGGED" value={readinessData.summary.total_days} color="text-text-dim" />
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  );
}
