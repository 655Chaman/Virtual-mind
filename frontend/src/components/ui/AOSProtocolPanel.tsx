'use client';

interface Protocol {
  code: string;
  name: string;
  emoji: string;
  tagline: string;
  status: string;
  status_label: string;
  color: string;
  completed_habits: string[];
  missing_habits: string[];
  bonus_completed: string[];
}

interface Penalty {
  type: string;
  description: string;
  severity: string;
  protocol?: string;
}

interface Perk {
  name: string;
  description: string;
  streak: number;
  required: number;
}

interface AOSProtocolPanelProps {
  protocols: Record<string, Protocol>;
  summary: {
    active: number;
    breached: number;
    partial: number;
    skipped: number;
    aos_health_score: number;
    is_ramadan: boolean;
  };
  penalties?: Penalty[];
  perks?: Perk[];
}

const STATUS_CONFIG = {
  active: {
    border: 'border-vm-green/40',
    bg: 'bg-vm-green/5',
    dot: 'bg-vm-green',
    pulse: true,
  },
  breached: {
    border: 'border-vm-red/60',
    bg: 'bg-vm-red/10',
    dot: 'bg-vm-red',
    pulse: false,
  },
  partial: {
    border: 'border-gold/40',
    bg: 'bg-gold/5',
    dot: 'bg-gold',
    pulse: false,
  },
  skipped: {
    border: 'border-surface2',
    bg: 'bg-transparent',
    dot: 'bg-text-dim',
    pulse: false,
  },
};

function ProtocolTile({ protocol }: { protocol: Protocol }) {
  const config = STATUS_CONFIG[protocol.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.skipped;

  return (
    <div
      className={`
        border p-3 transition-all duration-300 group cursor-default
        ${config.border} ${config.bg}
        hover:border-opacity-80
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">{protocol.emoji}</span>
          <div className="min-w-0">
            <div className="text-xs font-mono text-text-dim tracking-widest truncate">
              {protocol.code}
            </div>
            <div className="text-xs text-gray-300 font-mono truncate leading-tight mt-0.5">
              {protocol.name.split(' ').slice(0, 3).join(' ')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot} ${config.pulse ? 'animate-pulse' : ''}`}
          />
        </div>
      </div>

      <div
        className={`
          mt-2 text-[10px] tracking-[0.2em] font-mono font-bold
          ${protocol.status === 'active' ? 'text-vm-green' : ''}
          ${protocol.status === 'breached' ? 'text-vm-red' : ''}
          ${protocol.status === 'partial' ? 'text-gold' : ''}
          ${protocol.status === 'skipped' ? 'text-text-dim' : ''}
        `}
      >
        {protocol.status_label}
      </div>

      {/* Missing habits hint */}
      {protocol.missing_habits.length > 0 && protocol.status !== 'skipped' && (
        <div className="mt-1.5 text-[9px] text-vm-red/70 font-mono truncate">
          ✗ {protocol.missing_habits[0].replace(/_/g, ' ')}
          {protocol.missing_habits.length > 1 && ` +${protocol.missing_habits.length - 1}`}
        </div>
      )}

      {/* Bonus habits */}
      {protocol.bonus_completed.length > 0 && (
        <div className="mt-1.5 text-[9px] text-gold-bright/70 font-mono truncate">
          ⚡ {protocol.bonus_completed[0].replace(/_/g, ' ')}
        </div>
      )}
    </div>
  );
}

export function AOSProtocolPanel({ protocols, summary, penalties = [], perks = [] }: AOSProtocolPanelProps) {
  const healthColor =
    summary.aos_health_score >= 80
      ? 'text-vm-green'
      : summary.aos_health_score >= 50
      ? 'text-gold'
      : 'text-vm-red';

  return (
    <div className="space-y-4">
      {/* Health Score Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className={`text-2xl font-heading font-bold ${healthColor}`}>
            {summary.aos_health_score}%
          </span>
          <span className="text-text-dim text-xs ml-2 tracking-widest">AOS HEALTH</span>
        </div>
        <div className="text-right text-xs font-mono text-text-dim">
          <div>
            <span className="text-vm-green">{summary.active}</span> ACTIVE ·{' '}
            <span className="text-vm-red">{summary.breached}</span> BREACHED
          </div>
          {summary.is_ramadan && (
            <div className="text-gold-bright mt-0.5">🌙 RAMADAN ULTRA MODE</div>
          )}
        </div>
      </div>

      {/* Protocol Grid — 2 columns */}
      <div className="grid grid-cols-2 gap-2">
        {Object.values(protocols).map((protocol) => (
          <ProtocolTile key={protocol.code} protocol={protocol} />
        ))}
      </div>

      {/* Active Penalties */}
      {penalties.length > 0 && (
        <div className="space-y-2 border-t border-vm-red/20 pt-3">
          <h4 className="text-[10px] tracking-[0.3em] text-vm-red font-mono">ACTIVE PENALTIES</h4>
          {penalties.map((p, i) => (
            <div
              key={i}
              className={`
                border p-2 text-xs font-mono
                ${p.severity === 'critical' ? 'border-vm-red/60 bg-vm-red/10 text-vm-red animate-pulse' : ''}
                ${p.severity === 'high' ? 'border-vm-red/40 bg-vm-red/5 text-vm-red/80' : ''}
                ${p.severity === 'moderate' ? 'border-gold/40 bg-gold/5 text-gold' : ''}
              `}
            >
              {p.description}
            </div>
          ))}
        </div>
      )}

      {/* Perks Unlocked */}
      {perks.length > 0 && (
        <div className="space-y-2 border-t border-gold/20 pt-3">
          <h4 className="text-[10px] tracking-[0.3em] text-gold font-mono">PERKS UNLOCKED</h4>
          {perks.map((perk, i) => (
            <div
              key={i}
              className="border border-gold/40 bg-gold/5 p-2 text-xs font-mono text-gold-bright"
            >
              <div className="font-bold">⚔ {perk.name}</div>
              <div className="text-text-dim mt-0.5 text-[10px]">{perk.description}</div>
              <div className="text-gold text-[10px] mt-1">
                {perk.streak}d streak / {perk.required}d required
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
