import React from 'react';

interface PhaseCountdownProps {
  currentDay: number;
  totalDays: number;
  phaseName?: string;
}

export function PhaseCountdown({ currentDay, totalDays, phaseName = "Phase 0" }: PhaseCountdownProps) {
  const percentage = Math.min(100, Math.max(0, (currentDay / totalDays) * 100));
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-2">
        <h3 className="font-heading text-gold text-lg">{phaseName.toUpperCase()}</h3>
        <span className="font-mono text-sm text-text-dim">DAY {currentDay} / {totalDays}</span>
      </div>
      <div className="h-1.5 w-full bg-surface2 rounded-full overflow-hidden border border-surface">
        <div 
          className="h-full bg-gold transition-all duration-1000 shadow-[0_0_10px_rgba(201,168,76,0.8)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
