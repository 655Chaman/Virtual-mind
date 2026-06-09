import React from 'react';

interface HeatmapProps {
  data: Record<string, number[]>; // flawName -> array of severity (1-10) for last 30 days. length=30, 0 if not triggered.
  daysCount?: number;
}

export function FlawHeatmap({ data, daysCount = 30 }: HeatmapProps) {
  const flaws = Object.keys(data);
  const days = Array.from({ length: daysCount }, (_, i) => i);

  // Get color mapped by severity (0: off, 1-3: yellow, 4-7: orange, 8-10: red)
  const getSeverityColor = (severity: number) => {
    if (severity === 0) return 'bg-obsidian border border-surface2';
    if (severity <= 3) return 'bg-gold/40 border border-gold';
    if (severity <= 7) return 'bg-orange-500/60 border border-orange-500';
    return 'bg-vm-red/80 border border-vm-red shadow-[0_0_10px_rgba(201,76,76,0.6)]';
  };

  return (
    <div className="w-full overflow-x-auto overflow-y-hidden pb-4">
      <div className="flex flex-col gap-1 min-w-max">
        {flaws.map(flaw => (
          <div key={flaw} className="flex items-center gap-2">
            <span className="w-48 text-xs font-mono text-text-dim text-right truncate" title={flaw}>
              {flaw}
            </span>
            <div className="flex gap-1">
              {days.map(day => {
                const arr = data[flaw];
                const sev = arr && arr[day] ? arr[day] : 0;
                return (
                  <div 
                    key={day} 
                    className={`w-4 h-4 rounded-sm ${getSeverityColor(sev)}`}
                    title={`Day ${day+1}: Severity ${sev}`}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
