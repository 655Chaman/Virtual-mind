'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WeeklyMirror } from '@/components/ui/WeeklyMirror';
import { FlawHeatmap } from '@/components/ui/FlawHeatmap';
import { api } from '@/lib/api';
import { Brain, Play, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

const CHECKPOINT_QUESTIONS = [
  'Have I prayed ALL 5 Salah on time, every day?',
  'Can I read basic Arabic?',
  'Have I finished "The Sealed Nectar" + "Kitab At-Tawheed"?',
  'Is Elesium MVP live and acquiring users?',
  'Have I published at least 10 essays?',
  'Have I run at least a half-marathon distance in training?',
  'Am I waking up for Fajr without an alarm?',
  'Do I have a circle of 3-5 like-minded Muslim brothers?',
];

const FLAW_LABELS = [
  'Preparation over progress',
  'Terrified of being ordinary',
  'Escape hatches under pressure',
  'Intellectualizing emotions',
  'Treating relationships as systems',
  'Equates stillness with failure',
  'Arrogance as shield',
  'Binary thinker',
  'Building for invulnerability',
  'System-building as avoidance',
  'Starts with fire, abandons with silence',
  'Forgets he is human',
];

type CheckState = Record<number, boolean | null>;

export default function PatternsPage() {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeSuccess, setAnalyzeSuccess] = useState(false);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [mirror, setMirror] = useState<any>(null);
  const [flawStats, setFlawStats] = useState<any[]>([]);
  const [checkpointAnswers, setCheckpointAnswers] = useState<CheckState>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [h, m, fs] = await Promise.all([
          api.flaws.heatmap().catch(() => null),
          api.patterns.latest().catch(() => null),
          api.flaws.list().catch(() => []),
        ]);
        setHeatmapData(h);
        setMirror(m);
        setFlawStats(Array.isArray(fs) ? fs : []);
      } catch (err) {
        console.error('Patterns fetch failed', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAnalysis = async () => {
    setAnalyzing(true);
    setAnalyzeSuccess(false);
    try {
      // Get recent logs to pass to analysis
      const recentLogs = await api.logs.list(7).catch(() => []);
      await api.patterns.analyze().catch(() => null);
      const m = await api.patterns.latest().catch(() => null);
      setMirror(m);
      setAnalyzeSuccess(true);
      setTimeout(() => setAnalyzeSuccess(false), 4000);
    } catch (err) {
      console.error('Analysis failed', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleCheckpoint = (idx: number) => {
    setCheckpointAnswers(prev => ({
      ...prev,
      [idx]: prev[idx] === true ? false : prev[idx] === false ? null : true,
    }));
  };

  const answeredYes = Object.values(checkpointAnswers).filter(v => v === true).length;
  const answeredNo = Object.values(checkpointAnswers).filter(v => v === false).length;

  return (
    <div className="min-h-screen bg-obsidian text-gray-300 font-mono relative">
      <div className="scanline-overlay" />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-obsidian/95 backdrop-blur border-b border-surface2 px-6 md:px-10 py-4 pt-safe flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button id="patterns-back-btn" onClick={() => router.push('/command')} className="text-text-dim hover:text-gold transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-heading text-gold tracking-[0.2em]">PATTERN RECOGNITION</h1>
            <p className="text-text-dim text-[10px] tracking-widest">THE UNFILTERED MIRROR // VULNERABILITY MAPPING</p>
          </div>
        </div>
        <button
          id="run-analysis-btn"
          onClick={handleAnalysis}
          disabled={analyzing}
          className={`flex items-center gap-2 px-5 py-2 border text-xs tracking-widest transition-all ${
            analyzeSuccess
              ? 'border-vm-green/60 text-vm-green bg-vm-green/10'
              : 'border-gold/50 text-gold hover:bg-gold/10'
          } disabled:opacity-50`}
        >
          {analyzing
            ? <><RefreshCw className="w-3 h-3 animate-spin" /> ANALYZING...</>
            : analyzeSuccess
            ? <> ANALYSIS COMPLETE</>
            : <><Play className="w-3 h-3" /> RUN DEEP ANALYSIS</>
          }
        </button>
      </header>

      <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-10">

        {/* 90-Day Checkpoint */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-heading text-gold tracking-widest">90-DAY CHECKPOINT</h2>
            <div className="h-[1px] flex-1 bg-surface2" />
            <div className="text-[10px] text-text-dim">
              {answeredYes} YES / {answeredNo} NO / {8 - answeredYes - answeredNo} UNANSWERED
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {CHECKPOINT_QUESTIONS.map((q, i) => {
              const ans = checkpointAnswers[i];
              return (
                <div
                  key={i}
                  id={`checkpoint-${i}`}
                  onClick={() => toggleCheckpoint(i)}
                  className={`p-3 border cursor-pointer text-xs leading-relaxed transition-all duration-200 flex items-center gap-3 ${
                    ans === true ? 'border-vm-green/50 bg-vm-green/10 text-vm-green' :
                    ans === false ? 'border-vm-red/50 bg-vm-red/10 text-vm-red' :
                    'border-surface2 text-gray-500 hover:border-gold/30'
                  }`}
                >
                  <span className={`w-10 text-center font-bold shrink-0 text-[11px] ${
                    ans === true ? 'text-vm-green' : ans === false ? 'text-vm-red' : 'text-text-dim/40'
                  }`}>
                    {ans === true ? 'YES' : ans === false ? 'NO' : '—'}
                  </span>
                  <span>{i + 1}. {q}</span>
                </div>
              );
            })}
          </div>
          {answeredNo > 0 && (
            <div className="mt-3 flex items-center gap-2 text-vm-red text-xs border border-vm-red/30 bg-vm-red/5 p-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {answeredNo} drift point{answeredNo > 1 ? 's' : ''} detected. The system does not lie. Correct course now.
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Weekly Mirror */}
          <div className="space-y-4">
            <h2 className="text-lg font-heading text-gold tracking-widest border-b border-surface2 pb-2">LATEST MIRROR ANALYSIS</h2>
            <div className="bg-surface border border-surface2 p-6 hover-lift">
              <WeeklyMirror data={mirror || {
                summary: 'AWAITING ANALYSIS — Run Deep Analysis to generate your mirror.',
                flaw_appearances: [],
                pillar_focus: { DEEN: '', ELESIUM: '', INFLUENCE: '', SELF: '' },
                directive: 'No data yet. File your logs and run analysis.',
              }} />
            </div>
          </div>

          {/* Flaw Stats */}
          <div className="space-y-4">
            <h2 className="text-lg font-heading text-gold tracking-widest border-b border-surface2 pb-2">VULNERABILITY FREQUENCY (30D)</h2>
            <div className="bg-surface border border-surface2 p-6 space-y-2 hover-lift">
              {flawStats.length === 0 ? (
                <p className="text-text-dim text-xs tracking-widest text-center py-4">No flaw data yet. Log your days first.</p>
              ) : (
                flawStats
                  .sort((a, b) => (b.count_30d ?? 0) - (a.count_30d ?? 0))
                  .map((flaw: any, i: number) => {
                    const count = flaw.count_30d ?? 0;
                    const maxCount = Math.max(...flawStats.map((f: any) => f.count_30d ?? 0), 1);
                    const pct = (count / maxCount) * 100;
                    const label = FLAW_LABELS[flaw.id - 1] ?? flaw.name ?? `Flaw #${flaw.id}`;
                    return (
                      <div key={flaw.id}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-400 truncate pr-4">{flaw.id}. {label}</span>
                          <span className={`text-xs font-bold shrink-0 ${count > 5 ? 'text-vm-red' : count > 2 ? 'text-gold' : 'text-text-dim'}`}>
                            {count}×
                          </span>
                        </div>
                        <div className="h-1 bg-surface2">
                          <div
                            className={`h-full transition-all duration-700 ${count > 5 ? 'bg-vm-red/70' : count > 2 ? 'bg-gold/60' : 'bg-surface'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>

        {/* Flaw Heatmap */}
        <section>
          <h2 className="text-lg font-heading text-gold tracking-widest border-b border-surface2 pb-2 mb-6">30-DAY VULNERABILITY HEATMAP</h2>
          <div className="bg-surface border border-surface2 p-6 overflow-x-auto hover-lift">
            <FlawHeatmap data={heatmapData || {}} />
          </div>
        </section>
      </div>
    </div>
  );
}
