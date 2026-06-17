'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Moon, Zap, Droplets, Activity, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { triggerHaptic } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const RANGES = ['7d', '14d', '30d', '90d', '180d', '365d'] as const;
const RANGE_LABELS: Record<string, string> = {
  '7d': '7D', '14d': '14D', '30d': '30D', '90d': '3M', '180d': '6M', '365d': '1Y'
};

function StatCard({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color: string }) {
  return (
    <div className="bg-surface border border-white/[0.06] p-3 text-center rounded-xl shadow-lg hover:border-white/20 transition-colors">
      <div className={`text-lg font-bold font-mono ${color}`}>
        {value}{unit && <span className="text-[10px] text-text-dim ml-0.5">{unit}</span>}
      </div>
      <div className="text-[7px] text-text-dim tracking-[0.3em] uppercase mt-1">{label}</div>
    </div>
  );
}

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const dateObj = new Date(label);
    const dateStr = isNaN(dateObj.getTime()) ? label : dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    
    return (
      <div className="bg-obsidian/95 border border-white/20 p-3 rounded shadow-2xl backdrop-blur">
        <p className="text-[9px] text-text-dim tracking-widest font-mono mb-1 uppercase">{dateStr}</p>
        <p className="text-sm font-bold font-mono text-white">
          {Number(val).toFixed(1)}{unit}
        </p>
      </div>
    );
  }
  return null;
};

// Recharts Wrapper Component
function ProgressChart({ 
  data, 
  valueKey, 
  goalValue, 
  color, 
  unit = '',
  maxOverride,
  gradientId
}: { 
  data: any[]; 
  valueKey: string; 
  goalValue?: number; 
  color: string; 
  unit?: string;
  maxOverride?: number;
  gradientId: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-text-dim text-[10px] tracking-widest border border-white/[0.04] bg-obsidian rounded-xl">
        NO DATA AVAILABLE
      </div>
    );
  }

  // Sort chronologically (ascending)
  const chartPoints = [...data].sort((a, b) => a.date.localeCompare(b.date));
  
  // Format dates for X-Axis display
  const formattedData = chartPoints.map(d => {
    const dateObj = new Date(d.date);
    const label = isNaN(dateObj.getTime()) ? d.date : dateObj.getDate().toString();
    return { ...d, _displayDate: label };
  });

  const maxValue = Math.max(...formattedData.map(d => Number(d[valueKey]) || 0));
  const domainMax = maxOverride || Math.max(maxValue, goalValue || 0) * 1.2;

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
            <filter id={`glow-${gradientId}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <XAxis 
            dataKey="_displayDate" 
            stroke="#444" 
            tick={{ fill: '#666', fontSize: 9, fontFamily: 'monospace' }} 
            axisLine={false}
            tickLine={false}
            dy={10}
            minTickGap={20}
          />
          <YAxis 
            stroke="#444" 
            tick={{ fill: '#666', fontSize: 9, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            domain={[0, domainMax]}
            tickFormatter={(val) => val.toFixed(0)}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
          
          {goalValue && (
            <ReferenceLine 
              y={goalValue} 
              stroke={color} 
              strokeOpacity={0.5} 
              strokeDasharray="3 3" 
              label={{ position: 'insideTopRight', value: `GOAL ${goalValue}${unit}`, fill: color, fontSize: 8, fontFamily: 'monospace', dy: -5 }} 
            />
          )}
          
          <Area 
            type="monotone" 
            dataKey={valueKey} 
            stroke={color} 
            strokeWidth={2.5}
            fillOpacity={1} 
            fill={`url(#${gradientId})`} 
            activeDot={{ r: 5, fill: '#0a0a0a', stroke: color, strokeWidth: 2 }}
            filter={`url(#glow-${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
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
    <div className="min-h-[100dvh] bg-obsidian text-gray-300 font-mono relative overflow-x-hidden">
      <div className="scanline-overlay pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-obsidian/95 backdrop-blur-md border-b border-white/[0.04] px-6 py-4 pt-safe flex items-center gap-4">
        <button
          onClick={() => { triggerHaptic('light'); router.push('/wellness'); }}
          className="p-2 -ml-2 text-text-dim hover:text-white transition-colors bg-surface border border-surface2 rounded-full"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-heading font-bold tracking-[0.3em] text-lg uppercase drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
            ANALYSIS
          </h1>
          <p className="text-[9px] text-text-dim tracking-widest mt-0.5 uppercase">SYSTEM RECOVERY TRENDS</p>
        </div>
        <TrendingUp className="w-5 h-5 text-text-dim/50" />
      </header>

      <div className="px-6 max-w-2xl mx-auto pb-24 animate-fade-up">
        {/* Range Selector */}
        <div className="pt-6 pb-4">
          <div className="flex gap-2">
            {RANGES.map(r => (
              <button
                key={r}
                onClick={() => { triggerHaptic('light'); setRange(r); }}
                className={`flex-1 py-2 text-[10px] font-bold tracking-widest font-mono transition-all rounded-lg ${
                  range === r
                    ? 'bg-white/10 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                    : 'text-text-dim hover:text-white border border-transparent bg-surface'
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-10 h-10 border border-white/20 border-t-white/80 rounded-full animate-spin" />
            <p className="text-text-dim text-[10px] tracking-[0.4em] animate-pulse">RENDERING TELEMETRY...</p>
          </div>
        ) : (
          <div className="space-y-10 mt-4">

            {/* ── SLEEP ──────────────────────────────────────────── */}
            <section className="bg-transparent space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <Moon className="w-5 h-5 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                  <span className="text-[12px] tracking-[0.3em] font-bold text-white uppercase">SLEEP</span>
                </div>
                {sleepData?.summary && (
                  <span className="text-[9px] text-indigo-400 font-mono tracking-widest">
                    {sleepData.summary.goal_compliance_pct}% HIT
                  </span>
                )}
              </div>
              
              <ProgressChart 
                data={sleepData?.data || []} 
                valueKey="hours" 
                goalValue={7.5} 
                color="#818cf8" 
                unit="h"
                gradientId="sleep-grad"
              />

              {sleepData?.summary && (
                <div className="grid grid-cols-4 gap-3">
                  <StatCard label="AVG" value={sleepData.summary.avg_hours} unit="h" color="text-indigo-400" />
                  <StatCard label="GOAL" value={sleepData.summary.goal_hours} unit="h" color="text-text-dim" />
                  <StatCard label="BEST" value={sleepData.summary.best_night_hours} unit="h" color="text-emerald-400" />
                  <StatCard label="WORST" value={sleepData.summary.worst_night_hours} unit="h" color="text-red-400" />
                </div>
              )}
            </section>

            {/* ── FASTING ────────────────────────────────────────── */}
            <section className="bg-transparent space-y-4">
              <div className="flex items-center justify-between border-b border-orange-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" />
                  <span className="text-[12px] tracking-[0.3em] font-bold text-white uppercase">FASTING</span>
                </div>
                {fastData?.summary && (
                  <span className="text-[9px] text-orange-400 font-mono tracking-widest">
                    STREAK: {fastData.summary.current_streak}
                  </span>
                )}
              </div>
              
              <ProgressChart 
                data={fastData?.data || []} 
                valueKey="hours" 
                goalValue={16} 
                color="#fb923c" 
                unit="h"
                gradientId="fast-grad"
              />

              {fastData?.summary && (
                <div className="grid grid-cols-4 gap-3">
                  <StatCard label="AVG" value={fastData.summary.avg_hours} unit="h" color="text-orange-400" />
                  <StatCard label="GOAL" value={fastData.summary.goal_hours} unit="h" color="text-text-dim" />
                  <StatCard label="MAX" value={fastData.summary.longest_fast_hours} unit="h" color="text-emerald-400" />
                  <StatCard label="STREAK" value={fastData.summary.max_streak} color="text-orange-400" />
                </div>
              )}
            </section>

            {/* ── HYDRATION ──────────────────────────────────────── */}
            <section className="bg-transparent space-y-4">
              <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                  <span className="text-[12px] tracking-[0.3em] font-bold text-white uppercase">HYDRATION</span>
                </div>
                {hydrationData?.summary && (
                  <span className="text-[9px] text-blue-400 font-mono tracking-widest">
                    {hydrationData.summary.goal_compliance_pct}% HIT
                  </span>
                )}
              </div>
              
              <ProgressChart 
                data={hydrationData?.data || []} 
                valueKey="liters" 
                goalValue={4.5} 
                color="#60a5fa" 
                unit="L"
                gradientId="hyd-grad"
              />

              {hydrationData?.summary && (
                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="AVG" value={hydrationData.summary.avg_liters} unit="L" color="text-blue-400" />
                  <StatCard label="BEST" value={(hydrationData.summary.best_day_ml / 1000).toFixed(1)} unit="L" color="text-emerald-400" />
                  <StatCard label="LOGS" value={hydrationData.summary.total_days} color="text-text-dim" />
                </div>
              )}
            </section>

            {/* ── READINESS ──────────────────────────────────────── */}
            <section className="bg-transparent space-y-4">
              <div className="flex items-center justify-between border-b border-yellow-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                  <span className="text-[12px] tracking-[0.3em] font-bold text-white uppercase">READINESS</span>
                </div>
                {readinessData?.summary && (
                  <span className="text-[9px] text-yellow-500 font-mono tracking-widest">
                    {readinessData.summary.peak_state_days} PEAK DAYS
                  </span>
                )}
              </div>
              
              <ProgressChart 
                data={readinessData?.data || []} 
                valueKey="score" 
                goalValue={13}
                maxOverride={15}
                color="#eab308" 
                unit="/15"
                gradientId="read-grad"
              />

              {readinessData?.summary && (
                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="AVG" value={readinessData.summary.avg_score} unit="/15" color="text-yellow-500" />
                  <StatCard label="BEST" value={readinessData.summary.best_day_score} unit="/15" color="text-emerald-400" />
                  <StatCard label="LOGS" value={readinessData.summary.total_days} color="text-text-dim" />
                </div>
              )}
            </section>

          </div>
        )}
      </div>
    </div>
  );
}
