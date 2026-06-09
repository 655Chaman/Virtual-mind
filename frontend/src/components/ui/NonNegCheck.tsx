import React from 'react';
import { Square, CheckSquare } from 'lucide-react';

interface NonNegCheckProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function NonNegCheck({ label, checked, onChange }: NonNegCheckProps) {
  return (
    <div 
      className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors duration-200 
        ${checked ? 'border-vm-green bg-vm-green/10 text-vm-green' : 'border-surface2 bg-surface text-text-dim hover:border-gold/50 hover:text-gold'}`}
      onClick={() => onChange(!checked)}
    >
      {checked ? (
        <CheckSquare className="w-5 h-5 flex-shrink-0 drop-shadow-[0_0_5px_rgba(76,170,110,0.8)]" />
      ) : (
        <Square className="w-5 h-5 flex-shrink-0" />
      )}
      <span className="font-mono text-sm leading-tight">{label}</span>
    </div>
  );
}
