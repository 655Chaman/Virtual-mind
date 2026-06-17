'use client';

import { useState } from 'react';
import { Zap, Brain, Smile, Activity } from 'lucide-react';
import { triggerHaptic } from '@/lib/utils';

interface ReadinessModalProps {
  sleepId?: number | null;
  onComplete: (score: number) => void;
  onDismiss: () => void;
}

const QUESTIONS = [
  { key: 'energy', label: 'ENERGY', icon: Zap, description: 'Physical Fuel', color: 'bg-gold' },
  { key: 'clarity', label: 'CLARITY', icon: Brain, description: 'Mental Sharpness', color: 'bg-blue-400' },
  { key: 'mood', label: 'MOOD', icon: Smile, description: 'Emotional State', color: 'bg-vm-green' },
] as const;

export function ReadinessModal({ sleepId, onComplete, onDismiss }: ReadinessModalProps) {
  const [scores, setScores] = useState<Record<string, number>>({ energy: 0, clarity: 0, mood: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Each slider is 0 to 10. Total score out of 30.
  const allAnswered = QUESTIONS.every(q => scores[q.key] > 0);
  const totalScore = scores.energy + scores.clarity + scores.mood;

  const readinessLabel = totalScore >= 25 ? 'PEAK STATE' :
    totalScore >= 18 ? 'OPERATIONAL' :
    totalScore >= 12 ? 'SUBOPTIMAL' : 'RECOVERY NEEDED';

  const readinessColor = totalScore >= 25 ? 'text-gold' :
    totalScore >= 18 ? 'text-vm-green' :
    totalScore >= 12 ? 'text-yellow-400' : 'text-vm-red';

  const handleSubmit = async () => {
    if (!allAnswered || isSubmitting) return;
    triggerHaptic('heavy');
    setIsSubmitting(true);
    try {
      const getApiBase = () => {
        if (typeof window !== 'undefined') {
          return `${window.location.protocol}//${window.location.hostname}:8001`;
        }
        return 'http://127.0.0.1:8001';
      };
      const API_BASE = getApiBase();
      
      // We map 30 max back to a 15 max equivalent for API compatibility if needed, 
      // or just send the raw out of 30. Let's scale back to /10 or /15 for consistency if the backend expects it.
      // The backend doesn't do strict validation on the exact max, it sums them.
      // But let's send energy/clarity/mood mapped to 1-5 scale for the API
      const apiScores = {
        energy: Math.ceil(scores.energy / 2),
        clarity: Math.ceil(scores.clarity / 2),
        mood: Math.ceil(scores.mood / 2),
      };

      await fetch(`${API_BASE}/api/wellness/readiness`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...apiScores, sleep_id: sleepId ?? null }),
      });
      // Return a score normalized to 10 for display in the app
      const finalDisplayScore = Math.round((totalScore / 30) * 10);
      onComplete(finalDisplayScore);
    } catch (err) {
      console.warn('[Readiness] Submit failed:', err);
      onDismiss();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-obsidian/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 font-mono no-select">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">

        {/* Header */}
        <div className="text-center space-y-2">
          <Activity className="w-8 h-8 text-gold mx-auto animate-pulse drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
          <h2 className="text-2xl font-bold text-white tracking-[0.3em] uppercase">SYSTEM CALIBRATION</h2>
          <p className="text-[10px] text-text-dim tracking-widest uppercase">Assess parameters before engaging</p>
        </div>

        {/* Sliders */}
        <div className="space-y-8 bg-surface border border-surface2 p-6 rounded-2xl shadow-2xl">
          {QUESTIONS.map(q => {
            const Icon = q.icon;
            const val = scores[q.key];
            const pct = (val / 10) * 100;
            return (
              <div key={q.key} className="space-y-4 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md bg-white/5`}>
                      <Icon className={`w-4 h-4 text-white`} />
                    </div>
                    <div>
                      <span className="text-[12px] font-bold tracking-widest text-white block">{q.label}</span>
                      <span className="text-[9px] text-text-dim tracking-wider uppercase">{q.description}</span>
                    </div>
                  </div>
                  <span className="text-xl font-bold tracking-widest text-white font-mono">{val > 0 ? val : '-'}</span>
                </div>
                
                <div className="relative h-12 flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={val}
                    onChange={(e) => {
                      triggerHaptic('light');
                      setScores(p => ({ ...p, [q.key]: parseInt(e.target.value) }));
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />
                  {/* Custom Track */}
                  <div className="w-full h-2 bg-obsidian border border-surface2 rounded-full overflow-hidden relative z-10 pointer-events-none">
                    <div 
                      className={`h-full transition-all duration-200 ${q.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {/* Thumb Indicator */}
                  {val > 0 && (
                    <div 
                      className="absolute h-4 w-4 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10 pointer-events-none transition-all duration-200"
                      style={{ left: `calc(${pct}% - 8px)` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Score Preview & Actions */}
        <div className="space-y-4">
          {allAnswered ? (
            <div className="text-center animate-in zoom-in-95 duration-300">
              <p className={`text-[14px] font-bold tracking-[0.4em] uppercase ${readinessColor} drop-shadow-md`}>
                {readinessLabel}
              </p>
            </div>
          ) : (
            <div className="text-center h-[21px]">
              <p className="text-[10px] text-text-dim tracking-widest uppercase">Input all parameters</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onDismiss}
              className="py-4 border border-surface2 text-text-dim text-[10px] font-bold tracking-[0.3em] hover:text-white transition-colors rounded-full uppercase"
            >
              ABORT
            </button>
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || isSubmitting}
              className={`py-4 font-bold tracking-[0.3em] uppercase text-[10px] rounded-full transition-all ${
                allAnswered && !isSubmitting
                  ? 'bg-gold/10 border border-gold text-gold hover:bg-gold/20 shadow-[0_0_20px_rgba(255,215,0,0.2)]'
                  : 'bg-surface border border-surface2 text-text-dim opacity-50'
              }`}
            >
              {isSubmitting ? '...' : 'INITIALIZE'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
