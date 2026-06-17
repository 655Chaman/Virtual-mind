'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, getLocalDateString } from '@/lib/api';
import { RestTimer } from '@/components/ui/RestTimer';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Check, 
  History, 
  Dumbbell, 
  Sparkles
} from 'lucide-react';
import { ScrubNumberInput } from '@/components/ui/ScrubNumberInput';

function SessionLoggerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetDate = searchParams.get('date') || getLocalDateString();

  const [workout, setWorkout] = useState<any>({
    date: targetDate,
    day_name: '',
    split_name: '',
    is_rest_day: false,
    exercises: []
  });
  
  const [exerciseHistory, setExerciseHistory] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Timer state
  const [showTimer, setShowTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [timerTrigger, setTimerTrigger] = useState(0);

  // Modal state
  const [addExerciseModal, setAddExerciseModal] = useState({ open: false, value: '' });
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{ open: boolean; exerciseIndex: number | null }>({ open: false, exerciseIndex: null });
  const [renameExerciseState, setRenameExerciseState] = useState<{ index: number | null; value: string }>({ index: null, value: '' });
  const [renameWorkoutState, setRenameWorkoutState] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisMetrics, setAnalysisMetrics] = useState<any>(null);
  const [workoutHistoryCount, setWorkoutHistoryCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);

  useEffect(() => {
    async function initSession() {
      try {
        const res = await api.workout.session.start(targetDate);
        setSessionStartTime(res.start_time);
      } catch (err) {
        // Fallback to localStorage if completely offline during initiation
        console.warn('Could not reach backend for session start, using local storage fallback');
        const storageKey = `vm_workout_start_${targetDate}`;
        let startTime = parseInt(localStorage.getItem(storageKey) || '0');
        if (!startTime) {
          startTime = Date.now();
          localStorage.setItem(storageKey, startTime.toString());
        }
        setSessionStartTime(startTime);
      }
    }
    initSession();
  }, [targetDate]);

  useEffect(() => {
    if (!sessionStartTime) return;
    const interval = setInterval(() => {
      const elapsedMs = Date.now() - sessionStartTime;
      const elapsedMinutes = Math.floor(elapsedMs / 60000);
      setWorkout((prev: any) => {
        if (prev.duration_minutes === elapsedMinutes) return prev;
        return { ...prev, duration_minutes: elapsedMinutes };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  useEffect(() => {
    async function loadWorkoutSession() {
      setLoading(true);
      try {
        let loadedWorkout = null;
        const historyData = await api.workout.history(50).catch(() => []);
        setWorkoutHistoryCount(historyData.length);
        const existingWorkout = historyData.find((w: any) => w.date === targetDate);
        
        if (existingWorkout) {
          loadedWorkout = existingWorkout;
        } else {
          const todayData = await api.workout.today();
          loadedWorkout = todayData.workout;
          loadedWorkout.date = targetDate;
          const dateObj = new Date(targetDate);
          const localDateObj = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
          loadedWorkout.day_name = localDateObj.toLocaleDateString('en-US', { weekday: 'long' });
        }
        
        const historyMap: Record<string, any> = {};
        if (loadedWorkout?.exercises) {
          await Promise.all(
            loadedWorkout.exercises.map(async (ex: any) => {
              const exHistory = await api.workout.exerciseHistory(ex.exercise_name, targetDate).catch(() => []);
              if (exHistory && exHistory.length > 0) {
                historyMap[ex.exercise_name] = exHistory[0];
              }
            })
          );
        }
        setExerciseHistory(historyMap);

        const updatedExercises = loadedWorkout.exercises.map((ex: any) => {
          if (!ex.sets || ex.sets.length === 0) {
            const pastSession = historyMap[ex.exercise_name];
            if (pastSession && pastSession.sets && pastSession.sets.length > 0) {
              return {
                ...ex,
                sets: pastSession.sets.map((s: any) => ({
                  set_number: s.set_number,
                  weight: s.weight,
                  reps: s.reps,
                  completed: false
                }))
              };
            } else {
              return {
                ...ex,
                sets: [
                  { set_number: 1, weight: 20, reps: 10, completed: false },
                  { set_number: 2, weight: 20, reps: 10, completed: false },
                  { set_number: 3, weight: 20, reps: 10, completed: false }
                ]
              };
            }
          }
          return ex;
        });

        setWorkout({ ...loadedWorkout, exercises: updatedExercises });
      } catch (err) {
        console.error("Failed to load session", err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkoutSession();
  }, [targetDate]);

  const handleInputChange = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: string) => {
    setWorkout((prev: any) => {
      const newExercises = [...prev.exercises];
      const newSets = [...newExercises[exerciseIndex].sets];
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], sets: newSets };
      return { ...prev, exercises: newExercises };
    });
  };

  const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
    setWorkout((prev: any) => {
      const newExercises = [...prev.exercises];
      const newSets = [...newExercises[exerciseIndex].sets];
      const prevCompleted = newSets[setIndex].completed;
      
      newSets[setIndex] = { ...newSets[setIndex], completed: !prevCompleted };
      newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], sets: newSets };

      if (!prevCompleted) {
        setShowTimer(true);
        setTimerSeconds(90);
        setTimerTrigger(t => t + 1);
      }
      
      return { ...prev, exercises: newExercises };
    });
  };

  const addSet = (exerciseIndex: number) => {
    setWorkout((prev: any) => {
      const newExercises = [...prev.exercises];
      const sets = newExercises[exerciseIndex].sets || [];
      const nextNumber = sets.length + 1;
      const lastSet = sets[sets.length - 1];
      const defaultWeight = lastSet ? lastSet.weight : 20;
      const defaultReps = lastSet ? lastSet.reps : 10;
      
      newExercises[exerciseIndex] = {
        ...newExercises[exerciseIndex],
        sets: [...sets, { set_number: nextNumber, weight: defaultWeight, reps: defaultReps, completed: false }]
      };
      return { ...prev, exercises: newExercises };
    });
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    setWorkout((prev: any) => {
      const newExercises = [...prev.exercises];
      const sets = newExercises[exerciseIndex].sets.filter((_: any, i: number) => i !== setIndex);
      const updatedSets = sets.map((s: any, idx: number) => ({ ...s, set_number: idx + 1 }));
      newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], sets: updatedSets };
      return { ...prev, exercises: newExercises };
    });
  };

  const confirmAddExercise = () => {
    const exerciseName = addExerciseModal.value.trim();
    if (!exerciseName) return;
    setWorkout((prev: any) => ({
      ...prev,
      exercises: [...prev.exercises, { exercise_name: exerciseName, sets: [{ set_number: 1, weight: 20, reps: 10, completed: false }] }]
    }));
    setAddExerciseModal({ open: false, value: '' });
  };

  const confirmRemoveExercise = () => {
    if (confirmDeleteModal.exerciseIndex === null) return;
    setWorkout((prev: any) => ({
      ...prev,
      exercises: prev.exercises.filter((_: any, i: number) => i !== confirmDeleteModal.exerciseIndex)
    }));
    setConfirmDeleteModal({ open: false, exerciseIndex: null });
  };

  const confirmRenameExercise = () => {
    if (renameExerciseState.index === null) return;
    const newName = renameExerciseState.value.trim();
    if (newName) {
      setWorkout((prev: any) => {
        const newExercises = [...prev.exercises];
        newExercises[renameExerciseState.index!].exercise_name = newName;
        return { ...prev, exercises: newExercises };
      });
    }
    setRenameExerciseState({ index: null, value: '' });
  };

  const handleSaveWorkout = async () => {
    setSaving(true);
    setStatusMessage('');
    try {
      const cleanExercises = workout.exercises.map((ex: any) => ({
        ...ex,
        sets: ex.sets.map((s: any) => ({
          ...s,
          weight: parseFloat(s.weight as any) || 0,
          reps: parseInt(s.reps as any) || 0
        }))
      }));

      const cleanWorkout = { ...workout, exercises: cleanExercises };
      await api.workout.log(cleanWorkout);
      
      let totalVolume = 0; let totalSets = 0; let completedSets = 0;
      cleanExercises.forEach((ex: any) => {
        ex.sets.forEach((s: any) => {
          totalSets++;
          if (s.completed) {
            completedSets++;
            totalVolume += (s.weight * s.reps);
          }
        });
      });

      const completionRate = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
      const durationNum = parseInt(cleanWorkout.duration_minutes as any) || 0;
      const cognitiveScore = Math.min(100, Math.round(completionRate * 0.7 + (durationNum > 45 ? 30 : (durationNum / 45) * 30)));

      setAnalysisMetrics({
        volume: totalVolume,
        consistency: workoutHistoryCount + (cleanExercises.length > 0 ? 1 : 0),
        cognitiveScore,
        duration: durationNum,
        completionRate: Math.round(completionRate)
      });
      setShowAnalysisModal(true);
    } catch (err: any) {
      setStatusMessage(`ERROR: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center font-mono gap-6">
        <div className="w-10 h-10 border border-white/20 border-t-white/80 rounded-full animate-spin" />
        <p className="text-text-dim text-[10px] tracking-[0.4em] animate-pulse uppercase">Booting HUD...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-gray-300 font-mono relative pb-32">
      <div className="scanline-overlay pointer-events-none" />

      <div className="px-6 pb-6 pt-safe max-w-2xl mx-auto space-y-12">
        
        {/* STICKY HUD HEADER: With solid background to occlude scrolling text and prevent XP widget clash */}
        <header className="sticky top-0 z-40 flex flex-col items-center pt-6 pb-4 space-y-4 bg-obsidian/95 backdrop-blur-xl -mx-6 px-6 shadow-[0_10px_30px_rgba(10,10,10,0.9)]">
          <div className="w-full flex justify-between items-center mb-4">
            <button
              onClick={() => router.push('/workout')}
              className="text-text-dim hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-[10px] tracking-[0.3em] text-vm-scarlet uppercase font-bold animate-pulse">
              [ LIVE SESSION ]
            </div>
            <div className="w-5" /> {/* Spacer */}
          </div>
          
          {renameWorkoutState ? (
            <input
              type="text"
              autoFocus
              value={workout.split_name}
              onChange={(e) => setWorkout((prev: any) => ({ ...prev, split_name: e.target.value }))}
              onBlur={() => setRenameWorkoutState(false)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setRenameWorkoutState(false); }}
              className="bg-surface text-2xl font-heading text-white text-center uppercase tracking-[0.1em] focus:outline-none w-full p-4 rounded-xl border border-vm-scarlet/50"
            />
          ) : (
            <div className="relative group w-full cursor-pointer" onDoubleClick={() => setRenameWorkoutState(true)}>
              <div className="absolute inset-0 bg-gradient-to-r from-vm-scarlet/20 via-transparent to-vm-scarlet/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="bg-surface border border-surface2/80 rounded-xl p-6 relative overflow-hidden text-center shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-vm-scarlet to-transparent opacity-50" />
                <h1 className="text-2xl md:text-3xl font-heading text-white tracking-[0.15em] uppercase drop-shadow-md">
                  {workout.split_name}
                </h1>
                <span className="text-[9px] text-vm-scarlet uppercase tracking-[0.3em] font-bold mt-2 block">
                  T + {workout.duration_minutes || 0} MINUTES ELAPSED
                </span>
              </div>
            </div>
          )}
        </header>

        {/* EXERCISES (No borders, pure minimalism) */}
        <div className="space-y-16">
          {workout.exercises.map((ex: any, exIdx: number) => {
            const pastSession = exerciseHistory[ex.exercise_name];
            const pastSets = pastSession ? pastSession.sets : [];

            return (
              <div key={exIdx} className="bg-surface/40 rounded-2xl border border-surface2 p-4 md:p-6 shadow-lg relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/5 group-hover:bg-vm-scarlet/50 transition-colors" />
                
                <div className="flex justify-between items-center bg-white/5 border border-white/5 rounded-lg px-4 py-3 mb-6">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-8 h-8 rounded border border-white/10 flex items-center justify-center bg-obsidian shrink-0">
                      <Dumbbell className="w-4 h-4 text-vm-scarlet drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                    </div>
                    {renameExerciseState.index === exIdx ? (
                      <input
                        type="text"
                        autoFocus
                        value={renameExerciseState.value}
                        onChange={(e) => setRenameExerciseState((s) => ({ ...s, value: e.target.value }))}
                        onBlur={confirmRenameExercise}
                        onKeyDown={(e) => { if (e.key === 'Enter') confirmRenameExercise(); }}
                        className="bg-obsidian border border-vm-scarlet/50 text-white focus:outline-none text-sm font-heading uppercase tracking-widest w-full px-3 py-1 rounded"
                      />
                    ) : (
                      <h3 
                        className="text-sm md:text-base font-heading text-white uppercase tracking-widest cursor-pointer hover:text-vm-scarlet transition-colors truncate"
                        onDoubleClick={() => setRenameExerciseState({ index: exIdx, value: ex.exercise_name })}
                      >
                        {ex.exercise_name}
                      </h3>
                    )}
                  </div>
                  <button onClick={() => setConfirmDeleteModal({ open: true, exerciseIndex: exIdx })} className="text-white/20 hover:text-red-500 transition-colors ml-4 p-2 rounded-md hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {pastSets.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-[9px] text-white/40 uppercase tracking-widest mb-4 bg-obsidian/50 px-3 py-2 rounded-md border border-white/5">
                    <History className="w-3 h-3 text-sky-400" />
                    <span className="text-sky-400 font-bold">TARGET:</span>
                    {pastSets.map((s: any, sIdx: number) => (
                      <span key={sIdx} className="bg-white/5 px-1.5 py-0.5 rounded">
                        {s.weight}KG x {s.reps}
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-12 gap-3 text-[9px] text-white/30 uppercase tracking-widest font-bold px-2">
                    <div className="col-span-2 text-left">SET</div>
                    <div className="col-span-4 text-center">KG <span className="hidden md:inline">(SCRUB)</span></div>
                    <div className="col-span-3 text-center">REPS</div>
                    <div className="col-span-3 text-right">DONE</div>
                  </div>

                  {ex.sets.map((set: any, setIdx: number) => (
                    <div key={setIdx} className={`grid grid-cols-12 gap-3 items-center group transition-all duration-300 ${set.completed ? 'opacity-40 saturate-0' : 'opacity-100'} bg-obsidian/40 rounded-xl p-2 border border-white/5 hover:border-white/20`}>
                      <div className="col-span-2 text-center">
                        <div className="w-7 h-7 rounded bg-surface border border-surface2 flex items-center justify-center text-xs font-mono text-white/50 shadow-inner">
                          0{set.set_number}
                        </div>
                      </div>

                      <div className="col-span-4">
                        <ScrubNumberInput
                          step={2.5}
                          sensitivity={8}
                          className="w-full bg-surface border border-surface2 rounded-md text-center text-base md:text-lg font-mono text-white py-1.5 focus:outline-none focus:border-vm-scarlet/50 shadow-inner"
                          value={set.weight === '' ? '' : Number(set.weight)}
                          onChangeValue={(val) => handleInputChange(exIdx, setIdx, 'weight', val.toString())}
                        />
                      </div>

                      <div className="col-span-3">
                        <ScrubNumberInput
                          step={1}
                          sensitivity={12}
                          className="w-full bg-surface border border-surface2 rounded-md text-center text-base md:text-lg font-mono text-white py-1.5 focus:outline-none focus:border-vm-scarlet/50 shadow-inner"
                          value={set.reps === '' ? '' : Number(set.reps)}
                          onChangeValue={(val) => handleInputChange(exIdx, setIdx, 'reps', val.toString())}
                        />
                      </div>

                      <div className="col-span-3 flex justify-end items-center gap-2 pr-1">
                        {ex.sets.length > 1 && (
                          <button onClick={() => removeSet(exIdx, setIdx)} className="text-white/10 hover:text-red-500 text-[10px] p-2">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleSetComplete(exIdx, setIdx)}
                          className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center ${
                            set.completed 
                              ? 'bg-emerald-500 border-emerald-500 text-obsidian shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-95' 
                              : 'border-white/10 bg-surface text-transparent hover:border-emerald-500/50 hover:bg-emerald-500/10'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => addSet(exIdx)}
                  className="w-full py-3 mt-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 border-dashed text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Plus className="w-3 h-3" /> ADD SET
                </button>
              </div>
            );
          })}
        </div>

        {/* HUD FOOTER / CONTROLS */}
        <div className="pt-12 flex flex-col items-center gap-6">
          <button
            onClick={() => setAddExerciseModal({ open: true, value: '' })}
            className="w-full max-w-xs h-16 rounded-2xl border-2 border-white/10 bg-surface flex items-center justify-center gap-3 text-white/50 hover:text-white hover:border-vm-scarlet/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)] transition-all group active:scale-95"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-vm-scarlet/20 transition-colors">
              <Plus className="w-5 h-5 group-hover:text-vm-scarlet" />
            </div>
            <span className="text-[11px] uppercase tracking-widest font-bold">ADD NEW MODULE</span>
          </button>

          <input
            type="text"
            className="w-full bg-transparent border-b border-white/10 text-center text-[10px] uppercase tracking-widest font-mono text-white focus:outline-none focus:border-white/50 mt-10 py-2"
            value={workout.notes || ''}
            onChange={(e) => setWorkout((prev: any) => ({ ...prev, notes: e.target.value }))}
            placeholder="[ ENTER SESSION PROTOCOL NOTES... ]"
          />

          {statusMessage && (
            <div className={`text-[10px] uppercase tracking-widest font-bold ${statusMessage.startsWith('ERROR') ? 'text-vm-scarlet' : 'text-white animate-pulse'}`}>
              {statusMessage}
            </div>
          )}

          <button
            onClick={handleSaveWorkout}
            disabled={saving}
            className="w-full mt-8 py-5 bg-transparent border-2 border-vm-scarlet text-vm-scarlet font-heading text-xl font-bold tracking-[0.3em] uppercase hover:bg-vm-scarlet hover:text-white disabled:opacity-50 transition-all rounded-xl shadow-[0_0_30px_rgba(244,63,94,0.3)] hover:shadow-[0_0_50px_rgba(244,63,94,0.6)] backdrop-blur-sm"
          >
            {saving ? 'SYNCING DATA...' : 'FINISH PROTOCOL'}
          </button>
        </div>
      </div>

      {showTimer && <RestTimer key={timerTrigger} initialSeconds={timerSeconds} onClose={() => setShowTimer(false)} />}

      {/* Add Exercise Modal (Minimal) */}
      {addExerciseModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-sm flex flex-col items-center text-center">
            <h2 className="text-[10px] text-white tracking-[0.4em] uppercase mb-8">INITIATE NEW MODULE</h2>
            <input
              type="text"
              autoFocus
              className="w-full bg-transparent border-b border-white text-center text-xl font-heading text-white focus:outline-none uppercase tracking-widest pb-2 mb-12"
              value={addExerciseModal.value}
              onChange={(e) => setAddExerciseModal((s) => ({ ...s, value: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmAddExercise();
                if (e.key === 'Escape') setAddExerciseModal({ open: false, value: '' });
              }}
              placeholder="MODULE DESIGNATION"
            />
            <div className="flex gap-8">
              <button onClick={() => setAddExerciseModal({ open: false, value: '' })} className="text-[10px] uppercase tracking-widest text-white/50 hover:text-white">CANCEL</button>
              <button onClick={confirmAddExercise} className="text-[10px] uppercase tracking-widest font-bold text-white hover:text-vm-scarlet">CONFIRM</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Exercise Modal (Minimal) */}
      {confirmDeleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-sm flex flex-col items-center text-center">
            <h2 className="text-[10px] text-vm-scarlet tracking-[0.4em] uppercase mb-8 font-bold">TERMINATE MODULE?</h2>
            <div className="flex gap-8">
              <button onClick={() => setConfirmDeleteModal({ open: false, exerciseIndex: null })} className="text-[10px] uppercase tracking-widest text-white/50 hover:text-white">CANCEL</button>
              <button onClick={confirmRemoveExercise} className="text-[10px] uppercase tracking-widest font-bold text-vm-scarlet hover:text-white">TERMINATE</button>
            </div>
          </div>
        </div>
      )}

      {/* Post Workout Modal */}
      {showAnalysisModal && analysisMetrics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
          <div className="w-full max-w-md flex flex-col items-center text-center">
            <Sparkles className="w-12 h-12 text-white mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
            <h2 className="font-heading text-3xl text-white tracking-[0.2em] uppercase mb-12">PROTOCOL<br/>COMPLETE</h2>
            
            <div className="w-full space-y-6 text-[10px] uppercase tracking-widest font-mono">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">TIME ELAPSED</span>
                <span className="text-white font-bold">{analysisMetrics.duration} MIN</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">TOTAL VOLUME</span>
                <span className="text-white font-bold">{analysisMetrics.volume} KG</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">COMPLETION</span>
                <span className="text-white font-bold">{analysisMetrics.completionRate}%</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/workout')}
              className="mt-16 py-4 px-12 border border-white text-white text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-white hover:text-obsidian transition-colors rounded"
            >
              RETURN TO BASE
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-obsidian flex items-center justify-center text-text-dim text-xs tracking-widest uppercase">Initializing...</div>}>
      <SessionLoggerContent />
    </Suspense>
  );
}
