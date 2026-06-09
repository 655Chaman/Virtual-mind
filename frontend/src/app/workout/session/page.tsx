'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, getLocalDateString } from '@/lib/api';
import { RestTimer } from '@/components/ui/RestTimer';
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Trash2, 
  Save, 
  Check, 
  History, 
  Dumbbell, 
  Clock,
  Sparkles
} from 'lucide-react';
import { DecryptedText } from '@/components/ui/DecryptedText';
import { ScrubNumberInput } from '@/components/ui/ScrubNumberInput';

// Main content component that uses searchParams
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
  const [timerTrigger, setTimerTrigger] = useState(0); // Dummy state to reset/trigger timer

  // Modal state — replaces native prompt() / confirm()
  const [addExerciseModal, setAddExerciseModal] = useState({ open: false, value: '' });
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{ open: boolean; exerciseIndex: number | null }>({ open: false, exerciseIndex: null });
  const [renameExerciseState, setRenameExerciseState] = useState<{ index: number | null; value: string }>({ index: null, value: '' });
  const [renameWorkoutState, setRenameWorkoutState] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisMetrics, setAnalysisMetrics] = useState<any>(null);
  const [workoutHistoryCount, setWorkoutHistoryCount] = useState(0);

  // Auto-calculate duration using persistent storage
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);

  useEffect(() => {
    // Only access localStorage on client side
    const storageKey = `vm_workout_start_${targetDate}`;
    let startTime = parseInt(localStorage.getItem(storageKey) || '0');
    if (!startTime) {
      startTime = Date.now();
      localStorage.setItem(storageKey, startTime.toString());
    }
    setSessionStartTime(startTime);
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
    }, 1000); // Check every second for better responsiveness
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Fetch today's split and historical data
  useEffect(() => {
    async function loadWorkoutSession() {
      setLoading(true);
      try {
        let loadedWorkout = null;
        
        // 1. Fetch workout logs for targetDate
        const historyData = await api.workout.history(50).catch(() => []);
        setWorkoutHistoryCount(historyData.length);
        const existingWorkout = historyData.find((w: any) => w.date === targetDate);
        
        if (existingWorkout) {
          loadedWorkout = existingWorkout;
        } else {
          // Fetch split template
          const todayData = await api.workout.today();
          loadedWorkout = todayData.workout;
          loadedWorkout.date = targetDate;
          
          // Set day name based on targetDate
          const dateObj = new Date(targetDate);
          // Correct timezone offset issues
          const localDateObj = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
          loadedWorkout.day_name = localDateObj.toLocaleDateString('en-US', { weekday: 'long' });
        }
        
        // 2. Fetch history for all exercises to show targets and pre-fill sets
        const historyMap: Record<string, any> = {};
        if (loadedWorkout?.exercises) {
          await Promise.all(
            loadedWorkout.exercises.map(async (ex: any) => {
              const exHistory = await api.workout.exerciseHistory(ex.exercise_name, targetDate).catch(() => []);
              if (exHistory && exHistory.length > 0) {
                historyMap[ex.exercise_name] = exHistory[0]; // Get the most recent past session
              }
            })
          );
        }
        setExerciseHistory(historyMap);

        // 3. Pre-fill sets if they are empty
        const updatedExercises = loadedWorkout.exercises.map((ex: any) => {
          if (!ex.sets || ex.sets.length === 0) {
            const pastSession = historyMap[ex.exercise_name];
            if (pastSession && pastSession.sets && pastSession.sets.length > 0) {
              // Copy structure from past session but set completed=false
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
              // Create 3 default sets
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

        setWorkout({
          ...loadedWorkout,
          exercises: updatedExercises
        });
      } catch (err) {
        console.error("Failed to load workout session config", err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkoutSession();
  }, [targetDate]);

  // Adjust weight or reps for a set
  const adjustSetValue = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', increment: number) => {
    setWorkout((prev: any) => {
      const newExercises = [...prev.exercises];
      const newSets = [...newExercises[exerciseIndex].sets];
      const currentVal = Number(newSets[setIndex][field]) || 0;
      
      newSets[setIndex] = {
        ...newSets[setIndex],
        [field]: Math.max(0, currentVal + increment)
      };
      
      newExercises[exerciseIndex] = {
        ...newExercises[exerciseIndex],
        sets: newSets
      };
      
      return { ...prev, exercises: newExercises };
    });
  };

  const handleInputChange = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: string) => {
    // Keep the raw value in state so the user can backspace, type decimals, and empty inputs normally
    setWorkout((prev: any) => {
      const newExercises = [...prev.exercises];
      const newSets = [...newExercises[exerciseIndex].sets];
      newSets[setIndex] = {
        ...newSets[setIndex],
        [field]: value
      };
      newExercises[exerciseIndex] = {
        ...newExercises[exerciseIndex],
        sets: newSets
      };
      return { ...prev, exercises: newExercises };
    });
  };

  // Toggle set completion and trigger rest timer
  const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
    setWorkout((prev: any) => {
      const newExercises = [...prev.exercises];
      const newSets = [...newExercises[exerciseIndex].sets];
      const prevCompleted = newSets[setIndex].completed;
      
      newSets[setIndex] = {
        ...newSets[setIndex],
        completed: !prevCompleted
      };
      
      newExercises[exerciseIndex] = {
        ...newExercises[exerciseIndex],
        sets: newSets
      };

      // Trigger rest timer only when checking the set off (toggling false -> true)
      if (!prevCompleted) {
        setShowTimer(true);
        setTimerTrigger(t => t + 1);
      }
      
      return { ...prev, exercises: newExercises };
    });
  };

  // Add a new set to an exercise
  const addSet = (exerciseIndex: number) => {
    setWorkout((prev: any) => {
      const newExercises = [...prev.exercises];
      const sets = newExercises[exerciseIndex].sets || [];
      const nextNumber = sets.length + 1;
      
      // Inherit weight/reps from last set if exists
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

  // Remove a set from an exercise
  const removeSet = (exerciseIndex: number, setIndex: number) => {
    setWorkout((prev: any) => {
      const newExercises = [...prev.exercises];
      const sets = newExercises[exerciseIndex].sets.filter((_: any, i: number) => i !== setIndex);
      // Recalculate set numbers
      const updatedSets = sets.map((s: any, idx: number) => ({ ...s, set_number: idx + 1 }));
      newExercises[exerciseIndex] = {
        ...newExercises[exerciseIndex],
        sets: updatedSets
      };
      return { ...prev, exercises: newExercises };
    });
  };

  // Add a custom exercise to today's workout
  const addCustomExercise = () => {
    setAddExerciseModal({ open: true, value: '' });
  };

  const confirmAddExercise = () => {
    const exerciseName = addExerciseModal.value.trim();
    if (!exerciseName) return;
    setWorkout((prev: any) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          exercise_name: exerciseName,
          sets: [{ set_number: 1, weight: 20, reps: 10, completed: false }]
        }
      ]
    }));
    setAddExerciseModal({ open: false, value: '' });
  };

  // Delete exercise entirely
  const removeExercise = (exerciseIndex: number) => {
    setConfirmDeleteModal({ open: true, exerciseIndex });
  };

  const confirmRemoveExercise = () => {
    const idx = confirmDeleteModal.exerciseIndex;
    if (idx === null) return;
    setWorkout((prev: any) => ({
      ...prev,
      exercises: prev.exercises.filter((_: any, i: number) => i !== idx)
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

  // Save workout to backend
  const handleSaveWorkout = async () => {
    setSaving(true);
    setStatusMessage('');
    try {
      // Ensure all weight and reps are parsed to clean numeric values before saving to the database
      const cleanExercises = workout.exercises.map((ex: any) => ({
        ...ex,
        sets: ex.sets.map((s: any) => ({
          ...s,
          weight: parseFloat(s.weight as any) || 0,
          reps: parseInt(s.reps as any) || 0
        }))
      }));

      const cleanWorkout = {
        ...workout,
        exercises: cleanExercises
      };

      await api.workout.log(cleanWorkout);
      
      // Calculate Post-Workout Metrics
      let totalVolume = 0;
      let totalSets = 0;
      let completedSets = 0;
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

      setStatusMessage('WORKOUT SAVED SUCCESSFULLY // VIRTUAL MIND SYNCED');
      setShowAnalysisModal(true);
    } catch (err: any) {
      setStatusMessage(`ERROR: ${err.message || 'Failed to save workout'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center font-mono gap-6">
        <div className="scanline-overlay" />
        <div className="relative">
          <div className="w-16 h-16 border border-vm-green/20 border-t-vm-green/80 rounded-full animate-spin" />
        </div>
        <p className="text-text-dim text-xs tracking-[0.4em]">INIT SESS_LOGGER...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-gray-300 font-mono relative pb-32">
      <div className="scanline-overlay" />

      {/* Main Container */}
      <div className="px-3 pb-3 pt-safe sm:px-4 sm:pb-4 sm:pt-safe md:px-8 md:pb-8 md:pt-safe max-w-[800px] mx-auto space-y-6">
        
        {/* Header */}
        <header className="border-b border-surface2 pb-4 space-y-3">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.push('/workout')}
              className="p-2.5 bg-surface hover:bg-surface2 border border-surface2 text-text-dim hover:text-vm-green transition-colors shrink-0"
              title="Back to Workout Hub"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={addCustomExercise}
              className="px-3.5 py-2 bg-surface hover:bg-surface2 border border-surface2 text-xs transition-colors text-text-dim hover:text-vm-green flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> ADD WORKOUT
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] bg-vm-green/10 px-2 py-0.5 border border-vm-green/30 text-vm-green uppercase tracking-widest font-bold self-start">
              {workout.date} // {workout.day_name}
            </span>
            {renameWorkoutState ? (
              <input
                type="text"
                autoFocus
                value={workout.split_name}
                onChange={(e) => setWorkout((prev: any) => ({ ...prev, split_name: e.target.value }))}
                onBlur={() => setRenameWorkoutState(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') setRenameWorkoutState(false);
                }}
                className="bg-obsidian border border-vm-green/50 text-xl md:text-2xl font-bold text-white tracking-wider leading-snug rounded px-2 py-1 focus:outline-none w-full"
              />
            ) : (
              <h1 
                className="text-xl md:text-2xl font-bold text-white tracking-wider leading-snug cursor-pointer hover:text-vm-green transition-colors"
                onDoubleClick={() => setRenameWorkoutState(true)}
                title="Double click to rename"
              >
                {workout.split_name}
              </h1>
            )}
          </div>
        </header>

        {/* Exercises List */}
        <div className="space-y-6">
          {workout.exercises.length === 0 ? (
            <div className="bg-surface border border-surface2 p-12 text-center text-text-dim text-xs">
              No exercises in this session. Tap "Add Workout" to add custom exercises.
            </div>
          ) : (
            workout.exercises.map((ex: any, exIdx: number) => {
              const pastSession = exerciseHistory[ex.exercise_name];
              const pastSets = pastSession ? pastSession.sets : [];

              return (
                <div key={exIdx} className="bg-surface border border-surface2 p-3 sm:p-4 md:p-6 rounded-lg relative hover:border-vm-green/20 transition-colors">
                  <div className="flex justify-between items-start border-b border-surface2 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-vm-green" />
                      {renameExerciseState.index === exIdx ? (
                        <input
                          type="text"
                          autoFocus
                          value={renameExerciseState.value}
                          onChange={(e) => setRenameExerciseState((s) => ({ ...s, value: e.target.value }))}
                          onBlur={confirmRenameExercise}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmRenameExercise();
                            if (e.key === 'Escape') setRenameExerciseState({ index: null, value: '' });
                          }}
                          className="bg-obsidian border border-vm-green/50 text-white rounded px-2 py-1 focus:outline-none text-base font-bold tracking-wide w-full max-w-[200px]"
                        />
                      ) : (
                        <h3 
                          className="text-base font-bold text-white tracking-wide cursor-pointer hover:text-vm-green transition-colors"
                          onDoubleClick={() => setRenameExerciseState({ index: exIdx, value: ex.exercise_name })}
                          title="Double click to rename"
                        >
                          {ex.exercise_name}
                        </h3>
                      )}
                    </div>
                    <button
                      onClick={() => removeExercise(exIdx)}
                      className="text-text-dim hover:text-vm-red transition-colors p-1"
                      title="Remove Exercise"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Historical Target HUD */}
                  {pastSets.length > 0 && (
                    <div className="mb-4 bg-obsidian/60 border border-vm-green/70 p-2.5 rounded text-xs flex items-center gap-2 text-vm-green/70">
                      <History className="w-3.5 h-3.5 shrink-0" />
                      <div>
                        <span className="font-bold mr-1.5">Last Week ({pastSession.date}):</span>
                        {pastSets.map((s: any, sIdx: number) => (
                          <span key={sIdx} className="mr-3">
                            S{s.set_number}: <strong className="text-vm-green">{s.weight}kg</strong> x {s.reps}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sets logging rows */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-1.5 sm:gap-2 text-[10px] text-text-dim uppercase tracking-wider font-bold p-1.5">
                      <div className="col-span-1 text-center">Set</div>
                      <div className="col-span-5 text-center">Weight (kg)</div>
                      <div className="col-span-4 text-center">Reps</div>
                      <div className="col-span-2 text-center">Done</div>
                    </div>

                    {ex.sets.map((set: any, setIdx: number) => (
                      <div
                        key={setIdx}
                        className={`grid grid-cols-12 gap-1.5 sm:gap-2 items-center p-1.5 rounded transition-all ${
                          set.completed 
                            ? 'bg-vm-green/5 border border-vm-green/20' 
                            : 'bg-obsidian/30 border border-transparent'
                        }`}
                      >
                        {/* Set index */}
                        <div className="col-span-1 text-center font-bold text-xs text-text-dim">
                          {set.set_number}
                        </div>

                        {/* Weight input with micro adjustments */}
                        <div className="col-span-5 flex items-center bg-obsidian border border-surface2 focus-within:border-vm-green/30 rounded overflow-hidden">
                          <button
                            onClick={() => adjustSetValue(exIdx, setIdx, 'weight', -2.5)}
                            className="px-1 sm:px-2 py-1 bg-surface2 hover:bg-surface text-text-dim hover:text-vm-green transition-colors text-[10px] sm:text-xs font-bold shrink-0"
                          >
                            -2.5
                          </button>
                          <ScrubNumberInput
                            step={2.5}
                            sensitivity={8}
                            className="w-full min-w-0 bg-transparent text-center text-xs sm:text-sm font-bold text-white focus:outline-none"
                            value={set.weight === '' ? '' : Number(set.weight)}
                            onChangeValue={(val) => handleInputChange(exIdx, setIdx, 'weight', val.toString())}
                          />
                          <button
                            onClick={() => adjustSetValue(exIdx, setIdx, 'weight', 2.5)}
                            className="px-1 sm:px-2 py-1 bg-surface2 hover:bg-surface text-text-dim hover:text-vm-green transition-colors text-[10px] sm:text-xs font-bold shrink-0"
                          >
                            +2.5
                          </button>
                        </div>

                        {/* Reps input with micro adjustments */}
                        <div className="col-span-4 flex items-center bg-obsidian border border-surface2 focus-within:border-vm-green/30 rounded overflow-hidden">
                          <button
                            onClick={() => adjustSetValue(exIdx, setIdx, 'reps', -1)}
                            className="px-1 sm:px-2 py-1 bg-surface2 hover:bg-surface text-text-dim hover:text-vm-green transition-colors text-[10px] sm:text-xs font-bold shrink-0"
                          >
                            -1
                          </button>
                          <ScrubNumberInput
                            step={1}
                            sensitivity={12}
                            className="w-full min-w-0 bg-transparent text-center text-xs sm:text-sm font-bold text-white focus:outline-none"
                            value={set.reps === '' ? '' : Number(set.reps)}
                            onChangeValue={(val) => handleInputChange(exIdx, setIdx, 'reps', val.toString())}
                          />
                          <button
                            onClick={() => adjustSetValue(exIdx, setIdx, 'reps', 1)}
                            className="px-1 sm:px-2 py-1 bg-surface2 hover:bg-surface text-text-dim hover:text-vm-green transition-colors text-[10px] sm:text-xs font-bold shrink-0"
                          >
                            +1
                          </button>
                        </div>

                        {/* Completed Checkbox */}
                        <div className="col-span-2 flex justify-center">
                          <button
                            onClick={() => toggleSetComplete(exIdx, setIdx)}
                            className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center ${
                              set.completed 
                                ? 'bg-vm-green border-vm-green text-obsidian shadow-[0_0_10px_rgba(76,170,110,0.4)]' 
                                : 'border-surface2 bg-obsidian text-transparent hover:border-vm-green/70 hover:text-vm-green/40'
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>
                        </div>

                        {/* Set removal option */}
                        {ex.sets.length > 1 && (
                          <div className="col-span-12 flex justify-end">
                            <button
                              onClick={() => removeSet(exIdx, setIdx)}
                              className="text-[9px] text-text-dim/50 hover:text-vm-red/80 transition-colors flex items-center gap-0.5 mt-0.5 pr-2"
                            >
                              <Minus className="w-2.5 h-2.5" /> REMOVE SET
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add set button */}
                  <button
                    onClick={() => addSet(exIdx)}
                    className="mt-4 w-full py-2 bg-obsidian border border-surface2 border-dashed hover:border-vm-green/30 hover:bg-surface2 text-text-dim hover:text-vm-green transition-all text-xs tracking-wider font-bold flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> ADD SET
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Global Workout Notes & Duration */}
        <div className="bg-surface border border-surface2 p-5 rounded-lg space-y-4">
          <h3 className="text-vm-green font-bold tracking-widest text-xs border-b border-surface2 pb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-vm-green/70" /> WORKOUT TELEMETRY
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="text-[10px] text-text-dim uppercase tracking-wider block mb-1">Time Elapsed</label>
              <div className="w-full bg-obsidian border border-surface2 rounded p-2 text-sm font-bold text-vm-green flex items-center justify-between">
                <span>{workout.duration_minutes || 0} min</span>
                <span className="text-[8px] tracking-widest text-vm-green/50 px-1.5 py-0.5 border border-vm-green/20 rounded uppercase">Auto</span>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] text-text-dim uppercase tracking-wider block mb-1">Workout Notes</label>
              <input
                type="text"
                className="w-full bg-obsidian border border-surface2 rounded p-2 text-sm text-white focus:outline-none focus:border-vm-green/30"
                value={workout.notes || ''}
                onChange={(e) => setWorkout((prev: any) => ({ ...prev, notes: e.target.value }))}
                placeholder="Pumps were solid, progressive overload hit on Bench."
              />
            </div>
          </div>
        </div>

        {/* Status Message Panel */}
        {statusMessage && (
          <div className={`p-4 text-xs font-bold border text-center ${
            statusMessage.startsWith('ERROR')
              ? 'bg-vm-red/10 border-vm-red/30 text-vm-red'
              : 'bg-vm-green/10 border-vm-green/30 text-vm-green animate-pulse'
          }`}>
            {statusMessage}
          </div>
        )}

        {/* Save and exit buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSaveWorkout}
            disabled={saving}
            style={{ backgroundColor: 'var(--color-vm-green)', color: '#060606' }}
            className="w-full sm:flex-1 py-4 disabled:opacity-50 font-bold text-xs tracking-[0.2em] shadow-[0_0_15px_rgba(76,170,110,0.25)] hover:opacity-90 transition-all flex items-center justify-center gap-2 order-first sm:order-last rounded-sm"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>{saving ? 'SYNCING...' : 'FINISH WORKOUT'}</span>
          </button>

          <button
            onClick={() => router.push('/workout')}
            className="w-full sm:flex-1 py-4 bg-surface hover:bg-surface2 border border-surface2 font-bold text-xs tracking-widest text-text-dim hover:text-white transition-colors text-center"
          >
            DISCARD CHANGES
          </button>
        </div>
      </div>

      {/* Floating Rest Timer */}
      {showTimer && (
        <RestTimer
          key={timerTrigger}
          initialSeconds={timerSeconds}
          onClose={() => setShowTimer(false)}
        />
      )}

      {/* ── Add Exercise Modal ── */}
      {addExerciseModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface border border-vm-green/30 rounded-lg p-6 w-full max-w-sm shadow-[0_0_40px_rgba(76,170,110,0.15)] font-mono">
            <h2 className="text-vm-green text-xs tracking-[0.3em] font-bold uppercase mb-1">ADD EXERCISE</h2>
            <p className="text-text-dim text-[11px] mb-4">Enter the name of the exercise to add to this session.</p>
            <input
              id="add-exercise-input"
              type="text"
              autoFocus
              placeholder="e.g. Incline Dumbbell Press"
              className="w-full bg-obsidian border border-surface2 focus:border-vm-green/50 rounded px-3 py-2.5 text-sm text-white placeholder-text-dim/40 focus:outline-none transition-colors"
              value={addExerciseModal.value}
              onChange={(e) => setAddExerciseModal((s) => ({ ...s, value: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmAddExercise();
                if (e.key === 'Escape') setAddExerciseModal({ open: false, value: '' });
              }}
            />
            <div className="flex gap-3 mt-5">
              <button
                id="add-exercise-cancel"
                onClick={() => setAddExerciseModal({ open: false, value: '' })}
                className="flex-1 py-2.5 border border-surface2 text-text-dim hover:text-white hover:bg-surface2 text-xs tracking-widest transition-colors rounded"
              >
                CANCEL
              </button>
              <button
                id="add-exercise-confirm"
                onClick={confirmAddExercise}
                disabled={!addExerciseModal.value.trim()}
                className="flex-1 py-2.5 bg-vm-green/90 hover:bg-vm-green disabled:opacity-40 text-obsidian font-bold text-xs tracking-widest transition-colors rounded"
              >
                ADD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Remove Exercise Modal ── */}
      {confirmDeleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface border border-vm-red/30 rounded-lg p-6 w-full max-w-sm shadow-[0_0_40px_rgba(255,80,80,0.1)] font-mono">
            <h2 className="text-vm-red text-xs tracking-[0.3em] font-bold uppercase mb-1">REMOVE EXERCISE</h2>
            <p className="text-text-dim text-[11px] mb-5">This exercise and all its sets will be removed from this session. This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                id="remove-exercise-cancel"
                onClick={() => setConfirmDeleteModal({ open: false, exerciseIndex: null })}
                className="flex-1 py-2.5 border border-surface2 text-text-dim hover:text-white hover:bg-surface2 text-xs tracking-widest transition-colors rounded"
              >
                CANCEL
              </button>
              <button
                id="remove-exercise-confirm"
                onClick={confirmRemoveExercise}
                className="flex-1 py-2.5 bg-vm-red/20 hover:bg-vm-red/30 border border-vm-red/40 text-vm-red font-bold text-xs tracking-widest transition-colors rounded"
              >
                REMOVE
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Post Workout Analysis Modal ── */}
      {showAnalysisModal && analysisMetrics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 font-mono">
          <div className="bg-surface border border-vm-green/50 rounded-lg w-full max-w-lg shadow-[0_0_50px_rgba(76,170,110,0.15)] overflow-hidden">
            <div className="p-6 border-b border-surface2 flex justify-between items-center bg-vm-green/5">
              <h2 className="text-vm-green text-sm tracking-[0.3em] font-bold uppercase flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> SESSION ANALYSIS
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Top Level Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-obsidian border border-surface2 p-4 rounded text-center">
                  <div className="text-2xl font-bold text-white mb-1">{analysisMetrics.consistency} <span className="text-[10px] text-text-dim uppercase tracking-widest">Days</span></div>
                  <div className="text-[9px] text-vm-green tracking-widest uppercase">Consistency Streak</div>
                </div>
                <div className="bg-obsidian border border-surface2 p-4 rounded text-center">
                  <div className="text-2xl font-bold text-white mb-1">{analysisMetrics.duration} <span className="text-[10px] text-text-dim uppercase tracking-widest">Min</span></div>
                  <div className="text-[9px] text-vm-green tracking-widest uppercase">Time in Gym</div>
                </div>
              </div>

              {/* Cognitive & Physical Load */}
              <div className="space-y-3">
                <h3 className="text-[10px] text-text-dim tracking-widest uppercase border-b border-surface2 pb-2">Cognitive & Physical Load</h3>
                
                <div className="flex items-center justify-between bg-obsidian border border-surface2 p-3 rounded">
                  <span className="text-xs text-white">Mental Discipline Score</span>
                  <span className="text-sm font-bold text-vm-green">{analysisMetrics.cognitiveScore} / 100</span>
                </div>
                
                <div className="flex items-center justify-between bg-obsidian border border-surface2 p-3 rounded">
                  <span className="text-xs text-white">Total Volume Lifted</span>
                  <span className="text-sm font-bold text-vm-green">{analysisMetrics.volume} kg</span>
                </div>
                
                <div className="flex items-center justify-between bg-obsidian border border-surface2 p-3 rounded">
                  <span className="text-xs text-white">Set Completion Rate</span>
                  <span className="text-sm font-bold text-vm-green">{analysisMetrics.completionRate}%</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-obsidian border-t border-surface2">
              <button
                onClick={() => router.push('/workout')}
                className="w-full py-4 bg-vm-green text-obsidian font-bold text-xs tracking-[0.2em] shadow-[0_0_15px_rgba(76,170,110,0.25)] hover:bg-vm-green/90 transition-all rounded"
              >
                RETURN TO BASE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Wrapper to prevent Next.js compilation issues with useSearchParams
export default function SessionLogger() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center font-mono gap-6">
        <p className="text-text-dim text-xs tracking-[0.4em]">INIT SUSPENSE...</p>
      </div>
    }>
      <SessionLoggerContent />
    </Suspense>
  );
}
