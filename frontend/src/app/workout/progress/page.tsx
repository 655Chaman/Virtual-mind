'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Activity } from 'lucide-react';
import { DecryptedText } from '@/components/ui/DecryptedText';
import { triggerHaptic } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function WorkoutProgress() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState('');

  // 1. Fetch historical data using api.workout.history(30)
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await api.workout.history(30).catch(() => []);
        setHistory(data);
      } catch (err) {
        console.error("Failed to gather workout history", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 2. Group the volume (weight * reps) by Date and Exercise
  const { exercises, chartData } = useMemo(() => {
    const exerciseVolumes: Record<string, { date: string; volume: number }[]> = {};
    const uniqueExercises = new Set<string>();

    // Process history chronologically (ascending)
    const sortedHistory = [...history].sort((a, b) => a.date.localeCompare(b.date));

    sortedHistory.forEach((w) => {
      const dateStr = w.date.includes('-') ? w.date.split('-').slice(1).join('/') : w.date;
      
      w.exercises?.forEach((ex: any) => {
        const name = ex.exercise_name;
        if (!name) return;
        
        let volume = 0;
        ex.sets?.forEach((s: any) => {
          // Calculate volume (weight * reps)
          if (s.completed !== false) {
            volume += (Number(s.weight) || 0) * (Number(s.reps) || 0);
          }
        });
        
        if (volume > 0) {
          uniqueExercises.add(name);
          if (!exerciseVolumes[name]) exerciseVolumes[name] = [];
          
          // Check if same date already exists for this exercise (aggregate multiple sessions in a day)
          const existingDateEntry = exerciseVolumes[name].find(d => d.date === dateStr);
          if (existingDateEntry) {
            existingDateEntry.volume += volume;
          } else {
            exerciseVolumes[name].push({ date: dateStr, volume });
          }
        }
      });
    });

    const sortedExercises = Array.from(uniqueExercises).sort();
    return {
      exercises: sortedExercises,
      chartData: exerciseVolumes
    };
  }, [history]);

  // Set default exercise if not set
  useEffect(() => {
    if (exercises.length > 0 && !selectedExercise) {
      setSelectedExercise(exercises[0]);
    }
  }, [exercises, selectedExercise]);

  const currentChartData = selectedExercise ? (chartData[selectedExercise] || []) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center font-mono gap-6">
        <Activity className="w-8 h-8 text-vm-scarlet animate-pulse" />
        <p className="text-text-dim text-xs tracking-[0.4em] uppercase">SYNCING TELEMETRY...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-gray-300 font-mono relative pb-16">
      <div className="scanline-overlay pointer-events-none" />

      <div className="px-4 pb-4 pt-safe md:px-8 md:pb-8 max-w-[1000px] mx-auto space-y-12 animate-fade-up">
        {/* Header - Borderless */}
        <header className="flex justify-between items-center pt-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/workout')}
              className="text-text-dim hover:text-vm-scarlet transition-colors"
              title="Return to Workout Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-heading text-white tracking-[0.2em] drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
                <DecryptedText text="PROGRESSION HUD" animateOnHover={true} />
              </h1>
              <p className="text-[10px] text-vm-scarlet tracking-widest mt-1 uppercase">
                LOAD/VOLUME TELEMETRY // LAST 30 DAYS
              </p>
            </div>
          </div>
        </header>

        {/* Exercise Selector - Row of glowing buttons */}
        <div className="space-y-4">
          <div className="text-[10px] text-text-dim uppercase tracking-widest">
            SELECT MODULE FOR ANALYSIS
          </div>
          
          {exercises.length === 0 ? (
            <div className="text-vm-scarlet text-xs tracking-widest uppercase">
              NO DATA FOUND IN THE LAST 30 DAYS.
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {exercises.map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    triggerHaptic();
                    setSelectedExercise(name);
                  }}
                  className={`px-4 py-2 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 rounded-sm ${
                    selectedExercise === name
                      ? 'bg-transparent text-vm-scarlet shadow-[0_0_15px_rgba(255,77,77,0.3)] border-b-2 border-vm-scarlet'
                      : 'bg-transparent text-text-dim hover:text-white border-b-2 border-transparent hover:border-white/20'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Landscape Chart Interface */}
        {selectedExercise && currentChartData.length > 0 && (
          <div className="w-full pt-8 h-[60vh] min-h-[400px]">
            <div className="text-center mb-6">
              <h2 className="text-xl font-heading text-vm-green tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(76,170,110,0.5)]">
                {selectedExercise} VOLUME
              </h2>
            </div>
            
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentChartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <XAxis 
                  dataKey="date" 
                  stroke="#666" 
                  tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }} 
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#666" 
                  tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(10, 10, 10, 0.9)', 
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    boxShadow: '0 0 20px rgba(255,77,77,0.2)'
                  }}
                  itemStyle={{ color: '#ff4d4d' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#ff4d4d" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0a0a0a', stroke: '#ff4d4d', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#ff4d4d', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
