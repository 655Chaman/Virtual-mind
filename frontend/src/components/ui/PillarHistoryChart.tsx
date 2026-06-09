'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/lib/api';
import { Activity, ShieldAlert, Sparkles, Zap, Flame } from 'lucide-react';

interface DayHistory {
  date: string;
  DEEN: number;
  ELESIUM: number;
  INFLUENCE: number;
  SELF: number;
}

const PILLARS = [
  { key: 'DEEN', label: 'Deen', color: '#c9a84c', glow: 'rgba(201,168,76,0.3)', icon: '🕌' },
  { key: 'ELESIUM', label: 'Elesium', color: '#4c7ec9', glow: 'rgba(76,126,201,0.3)', icon: '⚡' },
  { key: 'INFLUENCE', label: 'Influence', color: '#a855f7', glow: 'rgba(168,85,247,0.3)', icon: '🎯' },
  { key: 'SELF', label: 'Self', color: '#4caa6e', glow: 'rgba(76,170,110,0.3)', icon: '🧠' },
];

export function PillarHistoryChart() {
  const [days, setDays] = useState(14);
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [visiblePillars, setVisiblePillars] = useState<Record<string, boolean>>({
    DEEN: true,
    ELESIUM: true,
    INFLUENCE: true,
    SELF: true,
  });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.history.pillars(days);
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to load pillar history chart data', err);
    } finally {
      setLoading(false);
    }
  }, [days]);


  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const togglePillar = (pillar: string) => {
    setVisiblePillars(prev => ({ ...prev, [pillar]: !prev[pillar] }));
  };

  // SVG Chart Dimensions
  const paddingX = 40;
  const paddingY = 20;
  const svgWidth = 600;
  const svgHeight = 240;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  // Compute SVG coordinates for each line
  const linesData = useMemo(() => {
    if (history.length < 2) return [];

    const numPoints = history.length;
    const xStep = chartWidth / (numPoints - 1);

    return PILLARS.map(p => {
      const points = history.map((day, idx) => {
        const x = paddingX + idx * xStep;
        // score goes from 0 to 100, invert to map to SVG Y (0 at top)
        const score = (day as any)[p.key] || 0;
        const y = paddingY + chartHeight - (score / 100) * chartHeight;
        return { x, y, score, date: day.date };
      });

      // SVG path command builder
      let path = '';
      if (points.length > 0) {
        path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          // Add cubic bezier curve smoothing
          const cpX1 = points[i - 1].x + xStep / 2;
          const cpY1 = points[i - 1].y;
          const cpX2 = points[i].x - xStep / 2;
          const cpY2 = points[i].y;
          path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
        }
      }

      return {
        key: p.key,
        color: p.color,
        glow: p.glow,
        points,
        path,
      };
    });
  }, [history, chartWidth, chartHeight]);

  // Hover tracker lines
  const hoverLineX = useMemo(() => {
    if (hoveredIdx === null || history.length === 0) return null;
    const xStep = chartWidth / (history.length - 1);
    return paddingX + hoveredIdx * xStep;
  }, [hoveredIdx, history, chartWidth]);

  return (
    <div className="bg-surface border border-surface2 p-5 hover-lift w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-surface2 pb-3 mb-4">
        <div>
          <h3 className="text-gold font-bold tracking-widest text-xs flex items-center gap-2">
            <Activity className="w-4.5 h-4.5 text-gold" /> PILLAR COMPLIANCE METRICS
          </h3>
          <p className="text-[10px] text-text-dim tracking-wider mt-0.5">TRACKING INDIVIDUAL LIFE ASPECT SCORE TRENDS</p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2.5 py-1 border text-[10px] tracking-widest transition-colors ${
                days === d
                  ? 'border-gold/60 bg-gold/15 text-gold font-bold'
                  : 'border-surface2 text-text-dim hover:border-surface hover:text-gray-300'
              }`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Pillar Toggles / Legend */}
      <div className="flex flex-wrap gap-2.5 mb-5">
        {PILLARS.map(p => {
          const isVisible = visiblePillars[p.key];
          return (
            <button
              key={p.key}
              onClick={() => togglePillar(p.key)}
              className={`flex items-center gap-2 px-3 py-1.5 border text-xs tracking-wider transition-all duration-200 ${
                isVisible
                  ? 'bg-obsidian font-bold'
                  : 'border-surface2 opacity-35 hover:opacity-50'
              }`}
              style={{
                borderColor: isVisible ? p.color : '',
                color: isVisible ? p.color : '',
                boxShadow: isVisible ? `0 0 10px ${p.glow}` : '',
              }}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* SVG Chart Frame */}
      {loading ? (
        <div className="h-56 w-full flex items-center justify-center text-xs tracking-widest text-text-dim animate-pulse">
          DIAGNOSTIC PLOTS RENDERING...
        </div>
      ) : history.length < 2 ? (
        <div className="h-56 w-full flex items-center justify-center text-xs tracking-widest text-text-dim border border-dashed border-surface2">
          NO HISTORICAL COMPLIANCE LOGS DETECTED.
        </div>
      ) : (
        <div className="relative w-full overflow-hidden select-none">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const svgX = ((e.clientX - rect.left) / rect.width) * svgWidth;
              const xStep = chartWidth / (history.length - 1);
              const idx = Math.min(
                history.length - 1,
                Math.max(0, Math.round((svgX - paddingX) / xStep))
              );
              setHoveredIdx(idx);
            }}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Grid Lines */}
            {[0, 25, 50, 75, 100].map((val) => {
              const y = paddingY + chartHeight - (val / 100) * chartHeight;
              return (
                <g key={val} className="opacity-15">
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="#ffffff"
                    strokeWidth="0.5"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    fill="#ffffff"
                    fontSize="8"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {val}%
                  </text>
                </g>
              );
            })}

            {/* X Axis Dates labels */}
            {history.map((day, idx) => {
              const xStep = chartWidth / (history.length - 1);
              const x = paddingX + idx * xStep;
              // Show label on start, end, and middle increments
              const shouldShowLabel = 
                days === 7 ||
                (days === 14 && idx % 3 === 0) ||
                (days === 30 && idx % 6 === 0);

              if (!shouldShowLabel) return null;
              
              const dateLabel = new Date(day.date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
              });

              return (
                <text
                  key={day.date}
                  x={x}
                  y={svgHeight - 4}
                  fill="#6b6352"
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="middle"
                  className="opacity-70"
                >
                  {dateLabel}
                </text>
              );
            })}

            {/* Render Lines */}
            {linesData.map(line => {
              if (!visiblePillars[line.key]) return null;
              return (
                <g key={line.key}>
                  {/* Outer glow stroke */}
                  <path
                    d={line.path}
                    fill="none"
                    stroke={line.color}
                    strokeWidth="5"
                    className="opacity-15 blur-[2px]"
                  />
                  {/* Clean main line */}
                  <path
                    d={line.path}
                    fill="none"
                    stroke={line.color}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Render dot markers on points for short histories */}
                  {days <= 14 && line.points.map((pt, i) => (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r="2.5"
                      fill="#060606"
                      stroke={line.color}
                      strokeWidth="1.5"
                    />
                  ))}
                </g>
              );
            })}

            {/* Hover Interaction Vertical Bar */}
            {hoverLineX !== null && (
              <g>
                <line
                  x1={hoverLineX}
                  y1={paddingY}
                  x2={hoverLineX}
                  y2={paddingY + chartHeight}
                  stroke="#ffffff"
                  strokeWidth="0.8"
                  className="opacity-25"
                />
                
                {/* Dots intersections */}
                {linesData.map(line => {
                  if (!visiblePillars[line.key] || hoveredIdx === null) return null;
                  const pt = line.points[hoveredIdx];
                  if (!pt) return null;
                  return (
                    <circle
                      key={line.key}
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill={line.color}
                      stroke="#060606"
                      strokeWidth="1.5"
                      style={{ filter: `drop-shadow(0 0 4px ${line.color})` }}
                    />
                  );
                })}
              </g>
            )}
          </svg>

          {/* Floating HUD Tooltip when hovering */}
          {hoveredIdx !== null && history[hoveredIdx] && (
            <div className="mt-3 p-3 bg-obsidian border border-surface2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] font-mono leading-none animate-fade-up">
              <div className="col-span-2 text-gold-dim tracking-wider border-b border-surface2 pb-1.5 mb-0.5">
                COMPLIANCE LOG: {new Date(history[hoveredIdx].date).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
              </div>
              {PILLARS.map(p => {
                const val = (history[hoveredIdx] as any)[p.key] || 0;
                return (
                  <div key={p.key} className="flex justify-between items-center py-0.5">
                    <span className="flex items-center gap-1 text-text-dim">
                      <span>{p.icon}</span>
                      <span>{p.label}:</span>
                    </span>
                    <span className="font-bold font-mono" style={{ color: p.color }}>
                      {val}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
