'use client';

import { useMemo } from 'react';

interface XPDay {
  date: string;
  xp: number;
  penalties?: number;
}

interface XPHistoryChartProps {
  history: XPDay[];
  target?: number;
}

export function XPHistoryChart({ history, target = 200 }: XPHistoryChartProps) {
  const maxXP = useMemo(() => Math.max(...history.map(d => d.xp), target, 1), [history, target]);

  const last14 = history.slice(-14);
  const totalXP = history.reduce((s, d) => s + d.xp, 0);
  const avgXP = history.length > 0 ? Math.round(totalXP / history.filter(d => d.xp > 0).length || 1) : 0;
  const aboveTarget = history.filter(d => d.xp >= target).length;

  return (
    <div>
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-xl font-heading text-gold">{totalXP.toLocaleString()}</div>
          <div className="text-[10px] text-text-dim tracking-widest">TOTAL XP</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-heading text-gold-bright">{avgXP}</div>
          <div className="text-[10px] text-text-dim tracking-widest">AVG / DAY</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-heading text-vm-green">{aboveTarget}</div>
          <div className="text-[10px] text-text-dim tracking-widest">DAYS HIT TARGET</div>
        </div>
      </div>

      {/* Line chart — last 14 days */}
      {(() => {
        const width = 500;
        const height = 120;
        const paddingLeft = 35;
        const paddingRight = 15;
        const paddingTop = 15;
        const paddingBottom = 25;

        const chartWidth = width - paddingLeft - paddingRight;
        const chartHeight = height - paddingTop - paddingBottom;

        const chartMax = Math.max(...last14.map((d) => d.xp), target, 1) * 1.15;

        const getCoords = (index: number, val: number) => {
          const x = paddingLeft + (index / Math.max(1, last14.length - 1)) * chartWidth;
          const y = paddingTop + chartHeight - (val / chartMax) * chartHeight;
          return { x, y };
        };

        let pathD = '';
        last14.forEach((d, i) => {
          const { x, y } = getCoords(i, d.xp);
          if (i === 0) {
            pathD = `M ${x} ${y}`;
          } else {
            pathD += ` L ${x} ${y}`;
          }
        });

        const gridLines = [0, chartMax * 0.33, chartMax * 0.66, chartMax];
        const targetY = paddingTop + chartHeight - (target / chartMax) * chartHeight;

        return (
          <div className="relative w-full overflow-hidden select-none mb-3">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible font-mono text-[7px] fill-text-dim">
              <defs>
                <filter id="xp-line-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid lines */}
              {gridLines.map((lineVal, idx) => {
                const y = paddingTop + chartHeight - (lineVal / chartMax) * chartHeight;
                return (
                  <g key={idx} className="opacity-10">
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
                      {Math.round(lineVal)}
                    </text>
                  </g>
                );
              })}

              {/* Target Line */}
              {targetY >= paddingTop && targetY <= paddingTop + chartHeight && (
                <g>
                  <line
                    x1={paddingLeft}
                    y1={targetY}
                    x2={width - paddingRight}
                    y2={targetY}
                    stroke="rgba(201,168,76,0.6)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={width - paddingRight}
                    y={targetY - 4}
                    textAnchor="end"
                    fill="rgba(201,168,76,0.8)"
                    className="font-bold text-[6px]"
                  >
                    TARGET {target} XP
                  </text>
                </g>
              )}

              {/* Path */}
              <path
                d={pathD}
                fill="none"
                stroke="#c9a84c"
                strokeWidth="2"
                filter="url(#xp-line-glow)"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Points */}
              {last14.map((day, i) => {
                const { x, y } = getCoords(i, day.xp);
                const isAbove = day.xp >= target;
                const pointColor = isAbove ? 'rgb(76, 170, 110)' : '#c9a84c';
                const dayLabel = new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

                let tooltipXOffset = 0;
                if (i === 0) tooltipXOffset = 22;
                else if (i === last14.length - 1) tooltipXOffset = -22;

                return (
                  <g key={day.date} className="group/point">
                    <circle
                      cx={x}
                      cy={y}
                      r="8"
                      fill="transparent"
                      className="cursor-pointer"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="3.5"
                      fill={day.xp === 0 ? '#1f1f1f' : '#060606'}
                      stroke={pointColor}
                      strokeWidth="1.8"
                      className="transition-transform duration-150 cursor-pointer group-hover/point:scale-125"
                    />
                    <g className="opacity-0 group-hover/point:opacity-100 transition-opacity duration-150 pointer-events-none">
                      <rect
                        x={x - 26 + tooltipXOffset}
                        y={y - 30}
                        width="52"
                        height="22"
                        fill="#060606"
                        stroke={pointColor}
                        strokeWidth="0.8"
                        rx="2"
                      />
                      <text
                        x={x + tooltipXOffset}
                        y={y - 20}
                        textAnchor="middle"
                        fill="#ffffff"
                        className="font-bold text-[7px]"
                      >
                        {day.xp} XP
                      </text>
                      {day.penalties ? (
                        <text
                          x={x + tooltipXOffset}
                          y={y - 12}
                          textAnchor="middle"
                          fill="#f87171"
                          className="text-[6.5px]"
                        >
                          -{day.penalties} Pen
                        </text>
                      ) : (
                        <text
                          x={x + tooltipXOffset}
                          y={y - 12}
                          textAnchor="middle"
                          fill={isAbove ? 'rgb(76, 170, 110)' : '#c9a84c'}
                          className="text-[6.5px]"
                        >
                          {dayLabel}
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}

              {/* X axis labels */}
              {last14.map((day, i) => {
                const { x } = getCoords(i, day.xp);
                const dateObj = new Date(day.date);
                const formattedLabel = isNaN(dateObj.getTime())
                  ? day.date
                  : dateObj.getDate().toString();

                return (
                  <text
                    key={day.date}
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
      })()}
    </div>
  );
}
