'use client';

interface Protocol {
  code: string;
  name: string;
  emoji: string;
  tagline?: string;
  status?: 'active' | 'breached' | 'partial' | 'skipped';
  streak?: number;
}

interface ProtocolStatusGridProps {
  protocols: Record<string, any>;
  summary?: {
    active: number;
    breached: number;
    partial: number;
    skipped: number;
    aos_health_score: number;
    is_ramadan: boolean;
  };
}

const STATUS_STYLES: Record<string, string> = {
  active: 'border-vm-green/50 bg-vm-green/5 text-vm-green',
  breached: 'border-vm-red/50 bg-vm-red/5 text-vm-red',
  partial: 'border-gold/40 bg-gold/5 text-gold',
  skipped: 'border-surface2 bg-surface text-text-dim',
};

const STATUS_DOT: Record<string, string> = {
  active: 'bg-vm-green glow-green',
  breached: 'bg-vm-red glow-red',
  partial: 'bg-gold',
  skipped: 'bg-surface2',
};

export function ProtocolStatusGrid({ protocols, summary }: ProtocolStatusGridProps) {
  const entries = Object.values(protocols);

  const healthScore = summary?.aos_health_score ?? 0;
  const healthColor = healthScore >= 80 ? 'text-vm-green' : healthScore >= 50 ? 'text-gold' : 'text-vm-red';

  return (
    <div>
      {/* Health Score */}
      {summary && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface2">
          <div>
            <span className={`text-2xl font-heading ${healthColor}`}>{healthScore}%</span>
            <span className="text-text-dim text-[10px] tracking-widest ml-2">SYSTEM HEALTH</span>
          </div>
          <div className="flex gap-3 text-[10px]">
            <span className="text-vm-green">{summary.active} ACTIVE</span>
            {summary.breached > 0 && <span className="text-vm-red">{summary.breached} BREACH</span>}
            {summary.partial > 0 && <span className="text-gold">{summary.partial} PARTIAL</span>}
          </div>
        </div>
      )}

      {/* Protocol grid */}
      <div className="grid grid-cols-1 gap-2">
        {entries.map((proto: any) => {
          const status = proto.status ?? 'skipped';
          const styleClass = STATUS_STYLES[status] ?? STATUS_STYLES.skipped;
          const dotClass = STATUS_DOT[status] ?? STATUS_DOT.skipped;
          return (
            <div key={proto.code} className={`flex items-center justify-between p-2.5 border text-xs ${styleClass}`}>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
                <span className="tracking-wider font-bold">{proto.emoji} {proto.code}</span>
                <span className="text-text-dim/60 hidden sm:block">— {proto.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {proto.streak != null && proto.streak > 0 && (
                  <span className="text-[9px] text-text-dim">{proto.streak}d</span>
                )}
                <span className="uppercase tracking-widest text-[9px] opacity-70">{status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
