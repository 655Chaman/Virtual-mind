import React from 'react';
import { Flame } from 'lucide-react';

export function StreakBadge({ count, pillar }: { count: number, pillar: string }) {
  return (
    <div className="flex items-center gap-2 bg-obsidian border border-surface2 px-3 py-1 rounded-full text-sm font-mono text-gold shadow-lg shadow-black">
      <Flame className="w-4 h-4 text-gold-bright" />
      <span>{count} DAY STREAK</span>
      <span className="text-text-dim px-1">|</span>
      <span className="text-xs tracking-wider">{pillar}</span>
    </div>
  );
}
