'use client';

interface XPBreakdownItem {
  item: string;
  xp: number;
  type: 'base' | 'bonus' | 'penalty' | 'multiplier';
}

interface XPBarProps {
  totalXp: number;
  rawXp: number;
  breakdown: XPBreakdownItem[];
  isRamadan?: boolean;
  dailyTarget?: number;
}

const ITEM_LABELS: Record<string, string> = {
  salah_5: 'Salah ×5',
  quran_30min: 'Quran 30min',
  deep_work_4hr: 'Deep Work 4hr',
  physical_training: 'Physical Training',
  reading_1hr: 'Reading 1hr',
  adhkar: 'Adhkar',
  no_phone_before_8: 'No Phone Before 8',
  no_sugar: 'No Sugar',
  ice_bath: 'Ice Bath',
  cold_shower: 'Cold Shower',
  microbursts: 'Combat Microbursts',
  memorization_session: 'Memorization',
  app_lock_on: 'App Lock',
  sleep_on_floor: 'Sleep on Floor',
  combat_training: 'Combat Training',
  fajr_without_alarm: 'Fajr Without Alarm',
  smt_completed: 'Sunday Master Task',
  salah_on_time_bonus: '⚡ Salah Bonus',
  ice_bath_bonus: '⚡ Ice Bath Bonus',
  cold_shower_bonus: '⚡ Cold Shower Bonus',
  combat_training_bonus: '⚡ Combat Bonus',
  microbursts_bonus: '⚡ Microburst Bonus',
  app_lock_on_bonus: '⚡ App Lock Bonus',
  memorization_session_bonus: '⚡ Memorization Bonus',
  sleep_on_floor_bonus: '⚡ Floor Sleep Bonus',
  fajr_without_alarm_bonus: '⚡ Fajr Warrior Bonus',
  smt_completed_bonus: '⚡ SMT Completion',
  missed_salah_penalty: '💀 Missed Salah',
  training_skipped_penalty: '💀 Training Skipped',
  smt_failed_penalty: '💀 SMT Failed',
  ramadan_ultra_mode_2x: '🌙 Ramadan 2x',
};

export function XPBar({
  totalXp,
  rawXp,
  breakdown,
  isRamadan = false,
  dailyTarget = 200,
}: XPBarProps) {
  const progress = Math.min(100, Math.round((totalXp / dailyTarget) * 100));
  const baseXp = breakdown.filter((b) => b.type === 'base').reduce((s, b) => s + b.xp, 0);
  const bonusXp = breakdown.filter((b) => b.type === 'bonus').reduce((s, b) => s + b.xp, 0);
  const penaltyXp = Math.abs(breakdown.filter((b) => b.type === 'penalty').reduce((s, b) => s + b.xp, 0));
  const penalties = breakdown.filter((b) => b.type === 'penalty');
  const bonuses = breakdown.filter((b) => b.type === 'bonus');

  return (
    <div className="space-y-4">
      {/* XP Header */}
      <div className="flex justify-between items-baseline">
        <div>
          <span className="text-3xl font-heading text-gold drop-shadow-[0_0_10px_rgba(201,168,76,0.4)]">
            {totalXp}
          </span>
          <span className="text-text-dim text-xs ml-2 tracking-widest">XP</span>
          {isRamadan && (
            <span className="ml-3 text-xs text-gold-bright bg-gold/10 border border-gold/20 px-2 py-0.5 tracking-widest">
              🌙 RAMADAN 2×
            </span>
          )}
        </div>
        <span className="text-text-dim text-xs tracking-widest">
          TARGET: {dailyTarget} XP
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-obsidian border border-surface2 overflow-hidden">
        {/* Base XP segment */}
        <div
          className="absolute left-0 top-0 h-full bg-gold/60 transition-all duration-700"
          style={{ width: `${Math.min(100, (baseXp / dailyTarget) * 100)}%` }}
        />
        {/* Bonus XP segment */}
        <div
          className="absolute top-0 h-full bg-gold transition-all duration-700"
          style={{
            left: `${Math.min(100, (baseXp / dailyTarget) * 100)}%`,
            width: `${Math.min(100 - (baseXp / dailyTarget) * 100, (bonusXp / dailyTarget) * 100)}%`,
          }}
        />
        {/* Glow effect at tip */}
        {progress > 0 && (
          <div
            className="absolute top-0 h-full w-4 bg-gold blur-sm opacity-80 transition-all duration-700"
            style={{ left: `${Math.max(0, progress - 2)}%` }}
          />
        )}
      </div>

      {/* XP Breakdown Row */}
      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
        <div className="bg-obsidian border border-surface2 p-2 text-center">
          <div className="text-gold text-sm font-bold">{baseXp}</div>
          <div className="text-text-dim tracking-wider mt-0.5">BASE</div>
        </div>
        <div className="bg-obsidian border border-gold/30 p-2 text-center">
          <div className="text-gold-bright text-sm font-bold">+{bonusXp}</div>
          <div className="text-text-dim tracking-wider mt-0.5">BONUS</div>
        </div>
        <div className={`bg-obsidian border p-2 text-center ${penaltyXp > 0 ? 'border-vm-red/40' : 'border-surface2'}`}>
          <div className={`text-sm font-bold ${penaltyXp > 0 ? 'text-vm-red' : 'text-text-dim'}`}>
            -{penaltyXp}
          </div>
          <div className="text-text-dim tracking-wider mt-0.5">PENALTY</div>
        </div>
      </div>

      {/* Bonus details */}
      {bonuses.length > 0 && (
        <div className="space-y-1">
          {bonuses.map((b, i) => (
            <div key={i} className="flex justify-between items-center text-xs">
              <span className="text-gold-bright/80">{ITEM_LABELS[b.item] || b.item}</span>
              <span className="text-gold font-mono">+{b.xp} XP</span>
            </div>
          ))}
        </div>
      )}

      {/* Penalty details */}
      {penalties.length > 0 && (
        <div className="space-y-1 border-t border-vm-red/20 pt-2">
          {penalties.map((p, i) => (
            <div key={i} className="flex justify-between items-center text-xs">
              <span className="text-vm-red/80">{ITEM_LABELS[p.item] || p.item}</span>
              <span className="text-vm-red font-mono">{p.xp} XP</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
