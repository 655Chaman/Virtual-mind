'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, getLocalDateString } from '@/lib/api';
import { Terminal, CheckSquare, Square, Zap, Shield, Brain } from 'lucide-react';

const PILLAR_COLORS: Record<string, string> = {
  DEEN: 'border-gold/50 text-gold hover:bg-gold/10',
  ELESIUM: 'border-vm-blue/50 text-vm-blue hover:bg-vm-blue/10',
  INFLUENCE: 'border-purple-500/50 text-purple-400 hover:bg-purple-500/10',
  SELF: 'border-vm-green/50 text-vm-green hover:bg-vm-green/10',
};

// ── CLASSIC NON-NEGOTIABLES ─────────────────────────────────────────────────
const CLASSIC_NNS = [
  { key: 'salah_5', label: '5 Salah On Time', icon: '' },
  { key: 'quran_30min', label: '30 Min Quran', icon: '' },
  { key: 'deep_work_4hr', label: '4 Hours Deep Work', icon: '' },
  { key: 'physical_training', label: 'Physical Training (1hr)', icon: '' },
  { key: 'reading_1hr', label: '1 Hour Reading Before Bed', icon: '' },
  { key: 'adhkar', label: 'Adhkar Morning & Evening', icon: '' },
  { key: 'no_phone_before_8', label: 'No Phone Before 8 AM', icon: '' },
  { key: 'no_sugar', label: 'No Sugar (Weekday)', icon: '' },
];

// ── A.O.S. 2.0 PROTOCOL HABITS ─────────────────────────────────────────────
const AOS_HABITS = [
  { key: 'ice_bath', label: 'Ice Bath', protocol: 'F.M.S.', xp: '+15 XP' },
  { key: 'cold_shower', label: 'Cold Shower', protocol: 'NEUROPLASTICITY', xp: '+5 XP' },
  { key: 'microbursts', label: 'Combat Microbursts', protocol: 'F.M.S.', xp: '+10 XP' },
  { key: 'combat_training', label: 'Combat Training', protocol: 'O.C.I.', xp: '+20 XP' },
  { key: 'memorization_session', label: 'Memorization Session', protocol: 'M.S.L.', xp: '+15 XP' },
  { key: 'app_lock_on', label: 'App Lock ON All Day', protocol: 'D.A.M.', xp: '+10 XP' },
  { key: 'sleep_on_floor', label: 'Slept on Floor', protocol: 'D.A.M.', xp: '+10 XP' },
  { key: 'fajr_without_alarm', label: 'Fajr Without Alarm', protocol: 'NEUROPLASTICITY', xp: '+25 XP' },
  { key: 'smt_completed', label: 'Sunday Master Task Done (Sunday only)', protocol: 'S.M.T.', xp: '+50 XP' },
  { key: 'ramadan_mode_active', label: 'Ramadan Mode (2x XP Multiplier)', protocol: 'D.D.F.', xp: '2x ALL' },
];

// ── FLAWS ───────────────────────────────────────────────────────────────────
const FLAWS = [
  'Confuses preparation with progress',
  'Terrified of being ordinary',
  'Uses escape hatches under pressure',
  'Intellectualizes emotions instead of feeling them',
  'Treats relationships as systems to optimize',
  'Equates stillness with failure',
  'Projects confidence as a shield',
  'Binary thinker in a gradient world',
  'Builds toward invulnerability, not expansion',
  'System-building as avoidance of execution',
  'Starts with fire, abandons with silence',
  'Forgets he is human',
];

type NNState = Record<string, boolean>;

function HabitCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      id={`habit-${label.replace(/\s+/g, '-').toLowerCase()}`}
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center gap-3 p-3 border text-left text-sm transition-all duration-200 ${
        checked
          ? 'border-vm-green/60 bg-vm-green/10 text-vm-green'
          : 'border-surface2 text-gray-500 hover:border-gold/30 hover:text-gray-300'
      }`}
    >
      {checked
        ? <CheckSquare className="w-4 h-4 shrink-0" />
        : <Square className="w-4 h-4 shrink-0 opacity-40" />}
      <span className="leading-tight">{label}</span>
    </button>
  );
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export default function LogPage() {
  const router = useRouter();
  const [classicNNs, setClassicNNs] = useState<NNState>(
    Object.fromEntries(CLASSIC_NNS.map(n => [n.key, false]))
  );
  const [aosHabits, setAosHabits] = useState<NNState>(
    Object.fromEntries(AOS_HABITS.map(n => [n.key, false]))
  );
  const [flawsChecked, setFlawsChecked] = useState<boolean[]>(new Array(12).fill(false));
  const [activePillars, setActivePillars] = useState<Set<string>>(new Set());
  const [logText, setLogText] = useState('');
  const [workDone, setWorkDone] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [madeSale, setMadeSale] = useState<boolean | null>(null);
  const [closedClient, setClosedClient] = useState<boolean | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [xpResult, setXpResult] = useState<any>(null);

  // Ruthless validations
  const isElesiumActive = activePillars.has('ELESIUM');
  const hasValidNarrative = logText.trim().length >= 250;
  const hasValidWorkDone = !isElesiumActive || workDone.trim().length >= 50;
  const missedDeepWork = !classicNNs['deep_work_4hr'];
  const hasCheckedFlaw = flawsChecked.some(f => f);
  const flawDodging = missedDeepWork && !hasCheckedFlaw;
  const elesiumUnanswered = isElesiumActive && (madeSale === null || closedClient === null);

  const canSubmit = hasValidNarrative && hasValidWorkDone && !flawDodging && !elesiumUnanswered && submitState !== 'loading';

  const togglePillar = (pillar: string) => {
    setActivePillars(prev => {
      const next = new Set(prev);
      next.has(pillar) ? next.delete(pillar) : next.add(pillar);
      return next;
    });
  };

  const toggleFlaw = (idx: number, val: boolean) => {
    const next = [...flawsChecked];
    next[idx] = val;
    setFlawsChecked(next);
  };

  const submitLog = async () => {
    if (!canSubmit) return;
    setSubmitState('loading');
    try {
      const logData = {
        date: getLocalDateString(),
        timestamp: new Date().toISOString(),
        text: logText,
        pillars: Array.from(activePillars),
        non_negotiables: { ...classicNNs, ...aosHabits },
        flaw_triggers: flawsChecked.map((c, i) => c ? i + 1 : null).filter(Boolean),
        work_done: workDone,
        lessons_learned: lessonsLearned,
        no_sales_today: isElesiumActive ? !madeSale : false,
        no_clients_today: isElesiumActive ? !closedClient : false,
      };
      const result = await api.logs.submit(logData);
      setXpResult(result);
      setSubmitState('success');
    } catch (err) {
      console.error('Submission failed', err);
      setSubmitState('error');
    }
  };

  if (submitState === 'success' && xpResult) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center font-mono p-8">
        <div className="max-w-lg w-full text-center">
          <div className="text-vm-green text-6xl mb-4 animate-pulse"></div>
          <h2 className="text-3xl font-heading text-vm-green tracking-widest mb-2">LOG SECURED</h2>
          <p className="text-text-dim text-xs tracking-widest mb-8">ACCOUNTABILITY REGISTERED. THE SYSTEM HAS WITNESSED.</p>

          <div className="bg-surface border border-vm-green/30 p-6 mb-6">
            <div className="text-5xl font-heading text-gold mb-2">{xpResult.xp_earned ?? 0} XP</div>
            <p className="text-text-dim text-xs tracking-widest">EARNED TODAY</p>

            {xpResult.perks_unlocked?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-surface2">
                <p className="text-gold text-xs tracking-widest mb-2">PERKS UNLOCKED</p>
                {xpResult.perks_unlocked.map((p: string) => (
                  <span key={p} className="inline-block px-3 py-1 border border-gold/40 text-gold text-xs mr-2 mb-2">{p}</span>
                ))}
              </div>
            )}

            {xpResult.active_penalties?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-surface2">
                <p className="text-vm-red text-xs tracking-widest mb-2">ACTIVE PENALTIES</p>
                {xpResult.active_penalties.map((p: string) => (
                  <span key={p} className="inline-block px-3 py-1 border border-vm-red/40 text-vm-red text-xs mr-2 mb-2">{p.replace(/_/g, ' ').toUpperCase()}</span>
                ))}
              </div>
            )}
          </div>

          <button id="go-command-btn" onClick={() => router.push('/command')} className="px-8 py-3 border border-gold/50 text-gold hover:bg-gold/10 transition-colors tracking-widest text-sm">
            ENTER COMMAND CENTER
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-gray-300 font-mono">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-obsidian/95 backdrop-blur border-b border-surface2 px-6 md:px-10 py-4 pt-safe flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading text-gold tracking-[0.2em] drop-shadow-[0_0_10px_rgba(201,168,76,0.3)]">DAILY CONSOLIDATION</h1>
          <p className="text-text-dim text-[10px] tracking-widest mt-0.5">TRUTH WITHOUT FILTERS // A.O.S. 2.0</p>
        </div>
        <button id="log-return-btn" onClick={() => router.push('/command')} className="text-text-dim hover:text-gold transition-colors text-xs tracking-widest">[ RETURN ]</button>
      </header>

      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        {/* Pillar Selection */}
        <section className="mb-8">
          <p className="text-text-dim text-xs tracking-[0.3em] mb-3">WHICH PILLARS DID YOU OPERATE IN TODAY?</p>
          <div className="grid grid-cols-4 gap-3">
            {['DEEN', 'ELESIUM', 'INFLUENCE', 'SELF'].map(p => (
              <button
                key={p}
                id={`pillar-${p.toLowerCase()}`}
                onClick={() => togglePillar(p)}
                className={`py-3 border text-xs tracking-[0.3em] font-bold transition-all duration-200 ${
                  activePillars.has(p) ? PILLAR_COLORS[p] + ' bg-opacity-20' : 'border-surface2 text-text-dim hover:border-surface'
                } ${activePillars.has(p) ? PILLAR_COLORS[p] : ''}`}
              >
                {p}
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left: Habits */}
          <div className="xl:col-span-1 space-y-6">
            {/* Classic Non-Negotiables */}
            <div className="bg-surface border border-surface2 p-5">
              <h3 className="text-gold font-bold tracking-widest mb-4 flex items-center gap-2 text-sm">
                <Brain className="w-4 h-4" /> DAILY NON-NEGOTIABLES
              </h3>
              <div className="space-y-1.5">
                {CLASSIC_NNS.map(n => (
                  <HabitCheck
                    key={n.key}
                    label={`${n.icon} ${n.label}`}
                    checked={classicNNs[n.key]}
                    onChange={v => setClassicNNs(prev => ({ ...prev, [n.key]: v }))}
                  />
                ))}
              </div>
            </div>

            {/* A.O.S. Protocol Habits */}
            <div className="bg-surface border border-surface2 p-5">
              <h3 className="text-gold font-bold tracking-widest mb-1 flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4" /> A.O.S. PROTOCOL HABITS
              </h3>
              <p className="text-text-dim text-[10px] tracking-widest mb-4">APEX OMEGA SYSTEM 2.0</p>
              <div className="space-y-1.5">
                {AOS_HABITS.map(n => (
                  <div key={n.key} className="relative">
                    <HabitCheck
                      label={n.label}
                      checked={aosHabits[n.key]}
                      onChange={v => setAosHabits(prev => ({ ...prev, [n.key]: v }))}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2 pointer-events-none">
                      <span className="text-[9px] text-text-dim/60">{n.protocol}</span>
                      <span className="text-[9px] text-gold/60">{n.xp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flaw Manifestations */}
            <div className={`bg-surface border p-5 ${flawDodging ? 'border-vm-red animate-pulse' : 'border-surface2'}`}>
              <h3 className="text-vm-red font-bold tracking-widest mb-1 text-sm">FLAW MANIFESTATIONS</h3>
              <p className={`text-[10px] mb-4 leading-relaxed ${flawDodging ? 'text-vm-red' : 'text-text-dim'}`}>
                {flawDodging 
                  ? ' YOU MISSED DEEP WORK. YOU MUST SELECT AT LEAST ONE FLAW TRIGGERED TODAY.' 
                  : 'Did any of your 12 core vulnerabilities surface today?'}
              </p>
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {FLAWS.map((flaw, idx) => (
                  <label
                    key={idx}
                    className={`flex items-start gap-3 p-2.5 border cursor-pointer transition-all duration-200 ${
                      flawsChecked[idx]
                        ? 'border-vm-red/50 bg-vm-red/10 text-vm-red'
                        : 'border-surface2 text-gray-500 hover:border-vm-red/20'
                    }`}
                  >
                    <input type="checkbox" className="mt-0.5 accent-red-500 shrink-0" checked={flawsChecked[idx]} onChange={e => toggleFlaw(idx, e.target.checked)} />
                    <span className="text-xs leading-tight">{idx + 1}. {flaw}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Narrative */}
          <div className="xl:col-span-2 space-y-6">
            {/* Operator Narrative */}
            <div className="bg-surface border border-surface2 flex flex-col" style={{ minHeight: '320px' }}>
              <div className="bg-surface2 px-6 py-3 flex items-center gap-3 border-b border-surface flex-shrink-0">
                <Terminal className="w-4 h-4 text-gold" />
                <span className="text-xs tracking-[0.3em] text-gold font-bold">OPERATOR NARRATIVE</span>
              </div>
              <textarea
                id="operator-narrative"
                className="flex-1 w-full bg-transparent p-6 text-gray-300 font-mono text-sm leading-relaxed resize-none focus:outline-none placeholder-text-dim/30"
                placeholder="State the reality of the day. Do not intellectualize. What happened? What failed? What succeeded? What cost you? Do not hide from the mirror."
                value={logText}
                onChange={e => setLogText(e.target.value)}
                rows={8}
              />
              <div className="px-6 pb-2 text-right">
                <span className={`text-[10px] tracking-widest ${!hasValidNarrative ? 'text-vm-red/60' : 'text-vm-green/60'}`}>
                  {logText.length} chars {!hasValidNarrative ? `(min 250 required by A.O.S.)` : ' SECURED'}
                </span>
              </div>
            </div>

            {/* Work Done */}
            <div className={`bg-surface border ${isElesiumActive && !hasValidWorkDone ? 'border-vm-red/50' : 'border-surface2'}`}>
              <div className="bg-surface2 px-6 py-3 border-b border-surface flex justify-between items-center">
                <span className="text-xs tracking-[0.3em] text-gold-dim font-bold">WHAT WORK WAS DONE TODAY</span>
                {isElesiumActive && (
                  <span className={`text-[9px] tracking-widest ${hasValidWorkDone ? 'text-vm-green' : 'text-vm-red'}`}>
                    {hasValidWorkDone ? '' : 'ELESIUM PILLAR REQUIRES PROOF (>50 CHRS)'}
                  </span>
                )}
              </div>
              <textarea
                id="work-done"
                className="w-full bg-transparent p-5 text-gray-300 font-mono text-sm leading-relaxed resize-none focus:outline-none placeholder-text-dim/30"
                placeholder="List the actual deliverables. Emails sent, code written, content created. Be specific."
                value={workDone}
                onChange={e => setWorkDone(e.target.value)}
                rows={4}
              />
              {isElesiumActive && (
                <div className="px-5 pb-5 pt-2 border-t border-surface2 bg-obsidian/30 flex justify-between items-center gap-6">
                  <div className="flex-1">
                    <p className={`text-[10px] tracking-widest mb-2 ${madeSale === null ? 'text-gold' : 'text-text-dim'}`}>MADE A SALE TODAY?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setMadeSale(true)} className={`flex-1 py-1 text-xs border ${madeSale === true ? 'bg-vm-green/20 border-vm-green text-vm-green' : 'border-surface2 text-text-dim'}`}>YES</button>
                      <button onClick={() => setMadeSale(false)} className={`flex-1 py-1 text-xs border ${madeSale === false ? 'bg-vm-red/20 border-vm-red text-vm-red' : 'border-surface2 text-text-dim'}`}>NO</button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className={`text-[10px] tracking-widest mb-2 ${closedClient === null ? 'text-gold' : 'text-text-dim'}`}>CLOSED A CLIENT TODAY?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setClosedClient(true)} className={`flex-1 py-1 text-xs border ${closedClient === true ? 'bg-vm-green/20 border-vm-green text-vm-green' : 'border-surface2 text-text-dim'}`}>YES</button>
                      <button onClick={() => setClosedClient(false)} className={`flex-1 py-1 text-xs border ${closedClient === false ? 'bg-vm-red/20 border-vm-red text-vm-red' : 'border-surface2 text-text-dim'}`}>NO</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Lessons Learned */}
            <div className="bg-surface border border-surface2">
              <div className="bg-surface2 px-6 py-3 border-b border-surface">
                <span className="text-xs tracking-[0.3em] text-gold-dim font-bold">LESSONS LEARNED</span>
              </div>
              <textarea
                id="lessons-learned"
                className="w-full bg-transparent p-5 text-gray-300 font-mono text-sm leading-relaxed resize-none focus:outline-none placeholder-text-dim/30"
                placeholder="What did today teach you? What would you do differently? What was the insight?"
                value={lessonsLearned}
                onChange={e => setLessonsLearned(e.target.value)}
                rows={4}
              />
            </div>

            {/* Error state */}
            {submitState === 'error' && (
              <div className="border border-vm-red/50 bg-vm-red/10 p-4 text-vm-red text-sm">
                SUBMISSION FAILED — System offline or validation error. Check API connection.
              </div>
            )}

            {/* Submit */}
            <div className="flex flex-col items-end gap-3 pt-6">
              {/* Accountability Block Reasoning */}
              {!canSubmit && (
                <div className="text-right space-y-1">
                  {!hasValidNarrative && (
                     <p className="text-[10px] text-vm-red/80 tracking-widest"> NARRATIVE TOO SHORT ({logText.length}/250)</p>
                  )}
                  {isElesiumActive && !hasValidWorkDone && (
                     <p className="text-[10px] text-vm-red/80 tracking-widest"> ELESIUM PROOF REQUIRED ({workDone.length}/50)</p>
                  )}
                  {isElesiumActive && (madeSale === null || closedClient === null) && (
                     <p className="text-[10px] text-vm-red/80 tracking-widest"> SALES/CLIENT QUESTIONS UNANSWERED</p>
                  )}
                  {flawDodging && (
                     <p className="text-[10px] text-vm-red/80 tracking-widest"> MISSED DEEP WORK: SELECT A FLAW MANIFESTATION</p>
                  )}
                </div>
              )}
              
              <button
                id="secure-log-btn"
                onClick={submitLog}
                disabled={!canSubmit}
                className="group flex items-center gap-3 px-10 py-4 bg-vm-green/10 hover:bg-vm-green/20 border border-vm-green/60 hover:border-vm-green text-vm-green font-bold tracking-[0.3em] disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed transition-all duration-300"
              >
                {submitState === 'loading' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-vm-green/30 border-t-vm-green rounded-full animate-spin" />
                    SECURING...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    SECURE LOG
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
