'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  Dumbbell, 
  TrendingUp, 
  Calendar, 
  Clock, 
  ChevronRight, 
  ArrowLeft, 
  Zap, 
  CheckCircle,
  FileText,
  AlertCircle,
  Activity
} from 'lucide-react';
import { DecryptedText } from '@/components/ui/DecryptedText';
import { triggerHaptic } from '@/lib/utils';

export default function WorkoutDashboard() {
  const router = useRouter();
  const [todayData, setTodayData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [today, hist] = await Promise.all([
        api.workout.today().catch((err) => {
          console.error("Failed to fetch today's split", err);
          return null;
        }),
        api.workout.history(10).catch((err) => {
          console.error("Failed to fetch workout history", err);
          return [];
        })
      ]);
      setTodayData(today);
      setHistory(Array.isArray(hist) ? hist : []);
    } catch (err: any) {
      setError(err.message || 'Failed to sync workout data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center font-mono gap-6">
        <div className="scanline-overlay" />
        <div className="relative">
          <div className="w-16 h-16 border border-vm-scarlet/20 border-t-vm-scarlet/80 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-vm-scarlet/60 text-[10px] tracking-widest">FIT</div>
        </div>
        <p className="text-text-dim text-xs tracking-[0.4em] animate-pulse">SYNCING WORKOUT KERNEL...</p>
      </div>
    );
  }

  const isRestDay = todayData?.workout?.is_rest_day ?? true;
  const isLogged = todayData?.logged ?? false;
  const todayWorkout = todayData?.workout;

  return (
    <div className="min-h-screen bg-obsidian text-gray-300 font-mono relative pb-28 no-select overflow-x-hidden">
      <div className="scanline-overlay" />

      <div className="w-full px-4 pt-safe pb-12 space-y-8 animate-fade-up">
        {/* Header */}
        <header className="flex justify-between items-center border-b border-surface2 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/home')}
              className="p-3 bg-surface hover:bg-surface2 border border-surface2 text-text-dim hover:text-vm-scarlet transition-colors flex items-center justify-center"
              title="Return to Folder Hub"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-heading text-vm-scarlet tracking-[0.2em] drop-shadow-[0_0_12px_rgba(244,63,94,0.3)]">
                <DecryptedText text="PHYSICAL TRAINING" animateOnHover={true} />
              </h1>
              <p className="text-[10px] text-text-dim tracking-widest mt-0.5 uppercase">
                VIRTUAL MIND 2.0 // WORKOUT MODULE
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div className="bg-vm-red/10 border border-vm-red/40 p-4 text-xs text-vm-red flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* 1. TODAY'S STATUS BOARD */}
        <div className="bg-surface border border-vm-scarlet/30 p-6 rounded-sm relative overflow-hidden shadow-lg" style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.04), rgba(0,0,0,0.65))' }}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.08)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-vm-scarlet tracking-wider uppercase font-mono">
              <Calendar className="w-4 h-4" /> Today // {todayWorkout?.day_name}
            </div>
            <h2 className="text-2xl font-heading tracking-widest text-white uppercase">
              {todayWorkout?.split_name}
            </h2>
            {isRestDay ? (
              <p className="text-[11px] text-vm-scarlet tracking-widest max-w-md font-mono mt-2 leading-relaxed">
                ACTIVE RECOVERY MODE. REST, HYDRATE, STUDY, AND PREPARE YOUR NERVOUS SYSTEM FOR UPCOMING HIGH-INTENSITY DAYS.
              </p>
            ) : (
              <div className="space-y-2 mt-2">
                <p className="text-[10px] tracking-widest text-text-dim uppercase font-mono">
                  TARGET EXERCISES FOR TODAY:
                </p>
                <ul className="flex flex-wrap gap-x-4 gap-y-2">
                  {todayWorkout?.exercises?.map((ex: any, i: number) => (
                    <li key={i} className="text-[11px] text-white font-mono tracking-widest flex items-center gap-1.5 uppercase">
                      <span className="w-1.5 h-1.5 bg-vm-scarlet rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]" /> {ex.exercise_name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* CTA — START WORKOUT (outside the dark card so it's always visible) */}
        {isLogged ? (
          <div className="bg-vm-scarlet/10 border border-vm-scarlet/40 p-4 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-vm-scarlet text-xs font-bold tracking-[0.1em] flex items-center gap-2 uppercase font-mono">
              <CheckCircle className="w-4 h-4" /> WORKOUT LOGGED FOR TODAY
            </span>
            <button
              onClick={() => { triggerHaptic(); router.push('/workout/session'); }}
              className="w-full sm:w-auto px-6 py-3 bg-[var(--color-obsidian)] border border-[var(--color-vm-scarlet)] text-[var(--color-vm-scarlet)] font-bold text-[10px] tracking-[0.2em] transition-all hover:bg-vm-scarlet/20 rounded-sm"
            >
              EDIT TODAY'S LOG
            </button>
          </div>
        ) : (
          <button
            onClick={() => { triggerHaptic(); router.push('/workout/session'); }}
            style={{ backgroundColor: 'var(--color-vm-scarlet)', color: 'var(--color-obsidian)' }}
            className="w-full py-5 hover:opacity-90 active:scale-[0.98] font-bold text-sm tracking-[0.25em] shadow-[0_0_24px_rgba(244,63,94,0.4)] transition-all duration-200 flex items-center justify-center gap-3 uppercase rounded-sm"
          >
            <Dumbbell className="w-5 h-5 shrink-0" />
            {isRestDay ? 'START ANYWAY' : 'START WORKOUT'}
          </button>
        )}

        {/* CTA — RECOVERY (below start workout) */}
        <button
          onClick={() => { triggerHaptic('medium'); router.push('/wellness'); }}
          className="w-full py-5 border border-blue-500/30 bg-[rgba(76,126,201,0.03)] hover:bg-[rgba(76,126,201,0.1)] active:scale-[0.98] font-bold text-sm tracking-[0.25em] text-blue-400 shadow-[0_0_15px_rgba(76,126,201,0.2)] transition-all duration-200 flex items-center justify-center gap-3 uppercase rounded-sm"
        >
          <Activity className="w-5 h-5 shrink-0" />
          RECOVERY
        </button>


      </div>
    </div>
  );
}
