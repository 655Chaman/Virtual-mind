'use client';

import { useState } from 'react';
import { Zap, Brain, Smile } from 'lucide-react';

interface ReadinessModalProps {
  sleepId?: number | null;
  onComplete: (score: number) => void;
  onDismiss: () => void;
}

const QUESTIONS = [
  { key: 'energy', label: 'Energy Level', icon: Zap, description: 'How energised do you feel?', color: 'text-gold' },
  { key: 'clarity', label: 'Mental Clarity', icon: Brain, description: 'How sharp is your mind?', color: 'text-blue-400' },
  { key: 'mood', label: 'Mood State', icon: Smile, description: 'How is your emotional state?', color: 'text-vm-green' },
] as const;

const LABELS: Record<number, string> = {
  1: 'CRITICAL', 2: 'LOW', 3: 'MODERATE', 4: 'GOOD', 5: 'PEAK'
};
const COLORS: Record<number, string> = {
  1: 'border-vm-red text-vm-red bg-vm-red/10',
  2: 'border-orange-500 text-orange-400 bg-orange-500/10',
  3: 'border-yellow-500 text-yellow-400 bg-yellow-500/10',
  4: 'border-vm-green text-vm-green bg-vm-green/10',
  5: 'border-gold text-gold bg-gold/10',
};

export function ReadinessModal({ sleepId, onComplete, onDismiss }: ReadinessModalProps) {
  const [scores, setScores] = useState<Record<string, number>>({ energy: 0, clarity: 0, mood: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allAnswered = QUESTIONS.every(q => scores[q.key] > 0);
  const totalScore = scores.energy + scores.clarity + scores.mood;

  const readinessLabel = totalScore >= 13 ? 'PEAK STATE' :
    totalScore >= 10 ? 'OPERATIONAL' :
    totalScore >= 7 ? 'SUBOPTIMAL' : 'RECOVERY NEEDED';

  const readinessColor = totalScore >= 13 ? 'text-gold' :
    totalScore >= 10 ? 'text-vm-green' :
    totalScore >= 7 ? 'text-yellow-400' : 'text-vm-red';

  const handleSubmit = async () => {
    if (!allAnswered || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const getApiBase = () => {
        if (typeof window !== 'undefined') {
          return `${window.location.protocol}//${window.location.hostname}:8001`;
        }
        return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      };
      const API_BASE = getApiBase();
      await fetch(`${API_BASE}/api/wellness/readiness`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...scores, sleep_id: sleepId ?? null }),
      });
      onComplete(totalScore);
    } catch (err) {
      console.warn('[Readiness] Submit failed:', err);
      onDismiss();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-obsidian/95 flex flex-col items-center justify-center p-6 font-mono">
      <div className="w-full max-w-sm space-y-6">

        {/* Header */}
        <div className="text-center border-b border-surface2 pb-4">
          <p className="text-[10px] tracking-[0.5em] text-text-dim mb-1">MORNING PROTOCOL</p>
          <h2 className="text-xl font-bold text-gold tracking-widest">READINESS CHECK-IN</h2>
          <p className="text-xs text-text-dim mt-1">Rate yourself. 15 seconds. No excuses.</p>
        </div>

        {/* Questions */}
        <div className="space-y-5">
          {QUESTIONS.map(q => {
            const Icon = q.icon;
            const selected = scores[q.key];
            return (
              <div key={q.key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${q.color}`} />
                  <span className="text-xs font-bold tracking-widest text-gray-200">{q.label}</span>
                  <span className="text-[10px] text-text-dim ml-auto">{q.description}</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button
                      key={v}
                      onClick={() => setScores(p => ({ ...p, [q.key]: v }))}
                      className={`py-2.5 border text-xs font-bold tracking-widest transition-all ${
                        selected === v
                          ? COLORS[v]
                          : 'border-surface2 text-text-dim hover:border-gold/40 hover:text-gold bg-surface'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                {selected > 0 && (
                  <p className={`text-[10px] tracking-widest text-right ${COLORS[selected].split(' ')[1]}`}>
                    {LABELS[selected]}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Score Preview */}
        {allAnswered && (
          <div className="bg-surface border border-surface2 p-4 text-center">
            <p className="text-[10px] text-text-dim tracking-widest mb-1">TODAY'S READINESS SCORE</p>
            <p className={`text-3xl font-bold tracking-widest ${readinessColor}`}>{totalScore}<span className="text-sm text-text-dim">/15</span></p>
            <p className={`text-xs font-bold tracking-[0.3em] mt-1 ${readinessColor}`}>{readinessLabel}</p>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onDismiss}
            className="py-3 border border-surface2 text-text-dim text-xs tracking-widest hover:border-gold/30 transition-colors"
          >
            SKIP
          </button>
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting}
            className="py-3 bg-gold/10 border border-gold/60 text-gold text-xs font-bold tracking-widest hover:bg-gold/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'LOCKING IN...' : 'LOCK IN'}
          </button>
        </div>
      </div>
    </div>
  );
}
