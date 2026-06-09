'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, TrendingUp, BarChart2, Award, Zap, Calendar, Dumbbell, Activity } from 'lucide-react';
import { DecryptedText } from '@/components/ui/DecryptedText';
import { triggerHaptic } from '@/lib/utils';

interface DataPoint {
  date: string;
  value: number;
}

// Beautiful pixel-perfect SVG Line Chart component
function PerformanceLineChart({ data, title, unit }: { data: DataPoint[]; title: string; unit: string }) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center border border-surface2 bg-obsidian text-text-dim text-xs">
        No progression data points found.
      </div>
    );
  }

  // Sort data chronologically (ascending)
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));

  // If only one data point, duplicate it to show a line
  const chartPoints = sortedData.length === 1 
    ? [
        { ...sortedData[0], date: 'Prev' },
        sortedData[0]
      ] 
    : sortedData;

  const width = 600;
  const height = 240;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const values = chartPoints.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valRange = maxVal - minVal === 0 ? 10 : maxVal - minVal;

  // Let's add some margin to the top and bottom of the values for layout padding
  const graphMin = Math.max(0, minVal - valRange * 0.15);
  const graphMax = maxVal + valRange * 0.15;
  const graphRange = graphMax - graphMin;

  // Map point to SVG coordinates
  const getCoords = (index: number, val: number) => {
    const x = paddingLeft + (index / (chartPoints.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((val - graphMin) / graphRange) * chartHeight;
    return { x, y };
  };

  // Build the path string
  let pathD = '';
  let areaD = '';
  
  chartPoints.forEach((d, i) => {
    const { x, y } = getCoords(i, d.value);
    if (i === 0) {
      pathD = `M ${x} ${y}`;
      areaD = `M ${x} ${paddingTop + chartHeight} L ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
      areaD += ` L ${x} ${y}`;
    }
  });

  const lastCoords = getCoords(chartPoints.length - 1, chartPoints[chartPoints.length - 1].value);
  areaD += ` L ${lastCoords.x} ${paddingTop + chartHeight} Z`;

  // Draw grid lines
  const gridCount = 4;
  const gridLines = [];
  for (let i = 0; i <= gridCount; i++) {
    const val = graphMin + (i / gridCount) * graphRange;
    const y = paddingTop + chartHeight - (i / gridCount) * chartHeight;
    gridLines.push({ y, val: Math.round(val * 10) / 10 });
  }

  return (
    <div className="bg-surface border border-surface2 p-5 rounded-lg relative overflow-hidden">
      <div className="scanline-overlay" />
      <h3 className="text-gold font-bold text-xs tracking-wider uppercase mb-4 flex items-center gap-1.5">
        <TrendingUp className="w-3.5 h-3.5" /> {title}
      </h3>

      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px] h-auto font-mono text-[9px] fill-text-dim">
          <defs>
            {/* Linear gradient for neon line glow */}
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#c9a84c" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={line.y}
                x2={width - paddingRight}
                y2={line.y}
                className="stroke-surface2"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text x={paddingLeft - 8} y={line.y + 3} textAnchor="end" className="fill-text-dim/60">
                {line.val} {unit}
              </text>
            </g>
          ))}

          {/* Area under the line */}
          <path d={areaD} fill="url(#areaGradient)" />

          {/* Glowing Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#c9a84c"
            strokeWidth="2.5"
            filter="url(#glow)"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Circles on data points */}
          {chartPoints.map((d, i) => {
            const { x, y } = getCoords(i, d.value);
            return (
              <g key={i} className="group">
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  className="fill-obsidian stroke-gold hover:fill-gold transition-colors duration-150 cursor-pointer"
                  strokeWidth="2"
                />
                {/* Micro tooltip label */}
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  className="fill-white font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[8px]"
                >
                  {d.value}
                </text>
              </g>
            );
          })}

          {/* X axis labels */}
          {chartPoints.map((d, i) => {
            const { x } = getCoords(i, d.value);
            // Display date format: MM/DD
            const formattedDate = d.date.includes('-')
              ? d.date.split('-').slice(1).join('/')
              : d.date;

            return (
              <text
                key={i}
                x={x}
                y={height - paddingBottom + 16}
                textAnchor="middle"
                className="fill-text-dim/80 text-[8px]"
              >
                {formattedDate}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function WorkoutProgress() {
  const router = useRouter();
  const [exercises, setExercises] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exerciseHistory, setExerciseHistory] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [range, setRange] = useState(30);

  const RANGES = [
    { label: '7D', days: 7 },
    { label: '14D', days: 14 },
    { label: '30D', days: 30 },
    { label: '3M', days: 90 },
    { label: '6M', days: 180 },
    { label: '1Y', days: 365 },
  ];

  // Load all unique exercises from logged history
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const historyData = await api.workout.history(range).catch(() => []);
        setHistory(historyData);

        // Collect all unique exercise names
        const exerciseNames = new Set<string>();
        historyData.forEach((w: any) => {
          w.exercises?.forEach((e: any) => {
            if (e.exercise_name) {
              exerciseNames.add(e.exercise_name);
            }
          });
        });

        const sortedNames = Array.from(exerciseNames).sort();
        setExercises(sortedNames);

        if (sortedNames.length > 0) {
          setSelectedExercise(sortedNames[0]);
        }
      } catch (err) {
        console.error("Failed to gather workout history for analytics", err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [range]);

  // Fetch performance data when selected exercise changes
  useEffect(() => {
    if (!selectedExercise) return;

    async function loadExerciseHistory() {
      setAnalyticsLoading(true);
      try {
        const data = await api.workout.exerciseHistory(selectedExercise);
        // data will be sorted descending from API, let's reverse it to chronological ascending for charts
        setExerciseHistory([...data].reverse());
      } catch (err) {
        console.error("Failed to fetch exercise progress", err);
      } finally {
        setAnalyticsLoading(false);
      }
    }
    loadExerciseHistory();
  }, [selectedExercise]);

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center font-mono gap-6">
        <div className="scanline-overlay" />
        <div className="relative">
          <div className="w-16 h-16 border border-gold/20 border-t-gold/80 rounded-full animate-spin" />
        </div>
        <p className="text-text-dim text-xs tracking-[0.4em]">SYNCING ANALYTICS...</p>
      </div>
    );
  }

  // Map exercise history to chart data points
  const oneRepMaxData: DataPoint[] = exerciseHistory.map((h) => ({
    date: h.date,
    value: h.estimated_1rm || 0
  }));

  const maxWeightData: DataPoint[] = exerciseHistory.map((h) => ({
    date: h.date,
    value: h.max_weight || 0
  }));

  const volumeData: DataPoint[] = exerciseHistory.map((h) => ({
    date: h.date,
    value: h.volume || 0
  }));

  // Calculations for current records
  const personalRecord1RM = oneRepMaxData.length > 0 
    ? Math.max(...oneRepMaxData.map(d => d.value)) 
    : 0;

  const personalRecordWeight = maxWeightData.length > 0 
    ? Math.max(...maxWeightData.map(d => d.value)) 
    : 0;

  const currentVolume = volumeData.length > 0 
    ? volumeData[volumeData.length - 1].value 
    : 0;

  return (
    <div className="min-h-screen bg-obsidian text-gray-300 font-mono relative pb-16">
      <div className="scanline-overlay" />

      <div className="px-4 pb-4 pt-safe md:px-8 md:pb-8 md:pt-safe max-w-[900px] mx-auto space-y-8 animate-fade-up">
        {/* Header */}
        <header className="flex justify-between items-center border-b border-surface2 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/workout')}
              className="p-2 bg-surface hover:bg-surface2 border border-surface2 text-text-dim hover:text-gold transition-colors"
              title="Return to Workout Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-heading text-gold tracking-[0.2em] drop-shadow-[0_0_12px_rgba(201,168,76,0.3)]">
                <DecryptedText text="PROGRESS ANALYTICS" animateOnHover={true} />
              </h1>
              <p className="text-[10px] text-text-dim tracking-widest mt-0.5">
                VIRTUAL MIND 2.0 // STRENGTH & VOLUME TELEMETRY
              </p>
            </div>
          </div>
        </header>

        {/* Quick Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <button
            onClick={() => { triggerHaptic(); router.push('/workout/session'); }}
            style={{ backgroundColor: 'var(--color-vm-green)', color: 'var(--color-obsidian)' }}
            className="flex-1 py-4 hover:opacity-90 active:scale-[0.98] font-bold text-xs tracking-[0.25em] shadow-[0_0_24px_rgba(76,170,110,0.4)] transition-all duration-200 flex items-center justify-center gap-3 uppercase rounded-sm"
          >
            <Dumbbell className="w-4 h-4 shrink-0" />
            START WORKOUT
          </button>
          
          <button
            onClick={() => { triggerHaptic('medium'); router.push('/wellness'); }}
            className="flex-1 py-4 border border-blue-500/30 bg-[rgba(76,126,201,0.03)] hover:bg-[rgba(76,126,201,0.1)] active:scale-[0.98] font-bold text-xs tracking-[0.25em] text-blue-400 shadow-[0_0_15px_rgba(76,126,201,0.2)] transition-all duration-200 flex items-center justify-center gap-3 uppercase rounded-sm"
          >
            <Activity className="w-4 h-4 shrink-0" />
            RECOVERY
          </button>
        </div>

        {/* Range Selector */}
        <div className="flex gap-1 bg-surface border border-surface2 p-1 rounded">
          {RANGES.map(r => (
            <button
              key={r.days}
              onClick={() => setRange(r.days)}
              className={`flex-1 py-2 text-[10px] font-bold tracking-widest font-mono transition-all rounded-sm ${
                range === r.days
                  ? 'bg-gold/15 text-gold border border-gold/40'
                  : 'text-text-dim hover:text-white border border-transparent'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Workout Overview Stats */}
        {history.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-surface border border-surface2 p-3 text-center rounded">
              <div className="text-lg font-bold text-gold font-mono">{history.length}</div>
              <div className="text-[7px] text-text-dim tracking-[0.2em] mt-1">SESSIONS</div>
            </div>
            <div className="bg-surface border border-surface2 p-3 text-center rounded">
              <div className="text-lg font-bold text-vm-green font-mono">
                {(history.length / Math.max(1, Math.ceil(range / 7))).toFixed(1)}
              </div>
              <div className="text-[7px] text-text-dim tracking-[0.2em] mt-1">PER WEEK</div>
            </div>
            <div className="bg-surface border border-surface2 p-3 text-center rounded">
              <div className="text-lg font-bold text-white font-mono">
                {Math.round(history.reduce((s: number, h: any) => s + (h.duration_minutes || 0), 0) / Math.max(1, history.length))}
              </div>
              <div className="text-[7px] text-text-dim tracking-[0.2em] mt-1">AVG MIN</div>
            </div>
            <div className="bg-surface border border-surface2 p-3 text-center rounded">
              <div className="text-lg font-bold text-white font-mono">
                {new Set(history.flatMap((h: any) => (h.exercises || []).map((e: any) => e.exercise_name))).size}
              </div>
              <div className="text-[7px] text-text-dim tracking-[0.2em] mt-1">EXERCISES</div>
            </div>
          </div>
        )}

        {/* 1. SELECTION CONTROLS */}
        <div className="bg-surface border border-surface2 p-5 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-text-dim uppercase tracking-wider block">Select Exercise to Analyze</label>
            {exercises.length === 0 ? (
              <p className="text-xs text-vm-red">No exercises logged yet. Log workouts first.</p>
            ) : (
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="bg-obsidian border border-surface2 text-white font-bold p-2 text-sm focus:outline-none focus:border-gold/30 rounded min-w-[240px]"
              >
                {exercises.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quick HUD Metrics */}
          {selectedExercise && (
            <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
              <div className="bg-obsidian border border-surface2 p-3 text-center rounded min-w-[100px]">
                <div className="text-xs text-text-dim tracking-wide font-bold">1RM MAX</div>
                <div className="text-sm font-bold text-gold mt-1">{personalRecord1RM} kg</div>
              </div>
              <div className="bg-obsidian border border-surface2 p-3 text-center rounded min-w-[100px]">
                <div className="text-xs text-text-dim tracking-wide font-bold">MAX WEIGHT</div>
                <div className="text-sm font-bold text-white mt-1">{personalRecordWeight} kg</div>
              </div>
              <div className="bg-obsidian border border-surface2 p-3 text-center rounded min-w-[100px]">
                <div className="text-xs text-text-dim tracking-wide font-bold">LAST VOL</div>
                <div className="text-sm font-bold text-white mt-1">{currentVolume} kg</div>
              </div>
            </div>
          )}
        </div>

        {/* 2. PROGRESS CHARTS */}
        {analyticsLoading ? (
          <div className="h-64 flex flex-col items-center justify-center bg-surface border border-surface2 rounded-lg gap-4">
            <div className="w-8 h-8 border border-gold/20 border-t-gold/80 rounded-full animate-spin" />
            <p className="text-xs text-text-dim tracking-widest">LOADING ANALYTICS STREAM...</p>
          </div>
        ) : selectedExercise ? (
          <div className="space-y-6">
            {/* Strength Progression (Estimated 1RM) */}
            <PerformanceLineChart
              data={oneRepMaxData}
              title="Estimated One Rep Max (1RM) Trend"
              unit="kg"
            />

            {/* Max Weight progression */}
            <PerformanceLineChart
              data={maxWeightData}
              title="Peak Weight Lifted Trend"
              unit="kg"
            />

            {/* Total Workout Volume progression */}
            <PerformanceLineChart
              data={volumeData}
              title="Total Exercise Volume Trend"
              unit="kg"
            />
          </div>
        ) : (
          <div className="bg-surface border border-surface2 p-12 text-center text-text-dim text-xs rounded-lg">
            No exercise selected. Sync a workout session first.
          </div>
        )}
      </div>
    </div>
  );
}
