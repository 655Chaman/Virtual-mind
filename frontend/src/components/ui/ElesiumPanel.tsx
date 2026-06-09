'use client';

import { TrendingUp, Activity, Terminal, ShieldAlert } from 'lucide-react';

interface ElesiumPanelProps {
  data: any;
}

export function ElesiumPanel({ data }: ElesiumPanelProps) {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-text-dim/40 text-xs tracking-widest">
        <span className="animate-pulse">ELESIUM DATA OFFLINE</span>
        <span className="text-[10px] mt-1 text-text-dim/20">Connect Notion or submit logs with outreach data</span>
      </div>
    );
  }

  const metrics = [
    { label: 'OUTREACH SENT (7D)', value: data.outreach_7d ?? '—', unit: 'emails' },
    { label: 'REPLY RATE', value: data.reply_rate != null ? `${data.reply_rate}%` : '—', unit: '' },
    { label: 'CALLS BOOKED', value: data.calls_booked ?? '—', unit: 'this week' },
    { label: 'MRR PROXY', value: data.mrr_proxy != null ? `$${data.mrr_proxy}` : '$0', unit: '' },
  ];

  const phase1TargetMRR = 1000;
  const currentMRR = data.mrr_proxy ?? 0;
  const progressPct = Math.min(100, (currentMRR / phase1TargetMRR) * 100);

  const live = data.live || {};
  const isConnected = live.is_connected;

  return (
    <div className="relative">
      {/* Live Pipeline HUD */}
      <div className="flex items-center justify-between mb-4 border-b border-surface/30 pb-3">
        <div className="flex items-center gap-2">
          <Activity className={`w-3 h-3 ${isConnected ? 'text-vm-green animate-pulse' : 'text-text-dim/30'}`} />
          <span className="text-[10px] font-bold tracking-[0.2em] text-text-dim/80">LIVE EXECUTION PIPELINE</span>
        </div>
        {isConnected ? (
          <div className="flex items-center gap-3">
             <div className="text-[9px] text-text-dim/40 flex gap-1">
               <span className="text-vm-blue">LEADS:</span>
               <span className="text-text-dim">{live.leads_scraped_total}</span>
             </div>
             <div className="text-[9px] text-text-dim/40 flex gap-1">
               <span className="text-gold">L-ACT:</span>
               <span className="text-text-dim truncate max-w-[80px]">{live.last_activity ? live.last_activity.split(' ')[1] : '—'}</span>
             </div>
          </div>
        ) : (
          <span className="text-[9px] text-text-dim/20 italic">HQ DISCONNECTED</span>
        )}
      </div>

      {!live.recent_outreach && live.is_connected && (
        <div className="mb-4 p-2 bg-vm-red/5 border border-vm-red/20 flex items-center gap-2">
          <ShieldAlert className="w-3 h-3 text-vm-red" />
          <span className="text-[9px] text-vm-red/80 tracking-widest font-bold">OUTREACH STAGNANT (24H GAP)</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {metrics.map(m => (
          <div key={m.label} className="bg-obsidian border border-surface2 p-3">
            <div className="text-xl font-heading text-gold">{m.value}</div>
            <div className="text-[9px] text-text-dim tracking-widest mt-0.5">{m.label}</div>
            {m.unit && <div className="text-[9px] text-text-dim/40">{m.unit}</div>}
          </div>
        ))}
      </div>

      {/* MRR Progress to $1K */}
      <div>
        <div className="flex justify-between text-[10px] text-text-dim mb-1">
          <span>PHASE 0 MRR TARGET</span>
          <span className="text-gold">${currentMRR} / $1,000</span>
        </div>
        <div className="h-1.5 bg-surface2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold/50 to-gold transition-all duration-1000"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-[9px] text-text-dim/40 mt-1 text-right">{Math.round(progressPct)}% to checkpoint target</p>
      </div>
    </div>
  );
}
