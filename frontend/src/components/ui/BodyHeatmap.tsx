'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Model, { IExerciseData } from 'react-body-highlighter';

type MuscleData = {
  [muscleName: string]: number; // 0 to 100
};

interface BodyHeatmapProps {
  data?: MuscleData;
  mode?: 'activation' | 'armor' | 'live';
  className?: string;
  /** When true, renders a compact inline version (no biology modal, smaller size) */
  compact?: boolean;
  /** Real-time burst override: muscle → intensity (0–100). Merged on top of data. */
  burstMuscles?: MuscleData;
}

// Map our 0-100 score to 1-100 frequency for continuous color scaling
function getFrequency(score: number): number {
  if (score <= 0) return 0;
  return Math.max(1, Math.min(100, Math.ceil(score)));
}

// Generate a smooth N-step gradient for the highlighter
function generateGradient(startHex: string, endHex: string, steps: number) {
  const start = [parseInt(startHex.slice(1, 3), 16), parseInt(startHex.slice(3, 5), 16), parseInt(startHex.slice(5, 7), 16)];
  const end = [parseInt(endHex.slice(1, 3), 16), parseInt(endHex.slice(3, 5), 16), parseInt(endHex.slice(5, 7), 16)];
  const colors = [];
  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    const r = Math.round(start[0] + ratio * (end[0] - start[0]));
    const g = Math.round(start[1] + ratio * (end[1] - start[1]));
    const b = Math.round(start[2] + ratio * (end[2] - start[2]));
    colors.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
  }
  return colors;
}

// Valid muscles supported by react-body-highlighter
const VALID_LIBRARY_MUSCLES = new Set([
  'trapezius', 'upper-back', 'lower-back', 'chest', 'biceps', 'triceps',
  'forearm', 'back-deltoids', 'front-deltoids', 'abs', 'obliques',
  'adductor', 'hamstring', 'quadriceps', 'abductors', 'calves', 'gluteal', 'head', 'neck'
]);

const MUSCLE_MAP: Record<string, string> = {
  'lats': 'upper-back',
  'lower_back': 'lower-back',
  'shoulders': 'front-deltoids',
  'quads': 'quadriceps',
  'calves': 'calves',
  'hips': 'gluteal',
  'glutes': 'gluteal',
  'abs': 'abs',
  'chest': 'chest',
  'biceps': 'biceps',
  'triceps': 'triceps',
  'forearms': 'forearm',
  'hamstrings': 'hamstring',
  'traps': 'trapezius',
  'neck': 'neck',
  'rear-deltoids': 'back-deltoids',
  'front-deltoids': 'front-deltoids',
  'upper-back': 'upper-back',
  'lower-back': 'lower-back',
  'quadriceps': 'quadriceps',
  'hamstring': 'hamstring',
  'gluteal': 'gluteal',
  'trapezius': 'trapezius',
  'forearm': 'forearm',
};

export function BodyHeatmap({
  data = {},
  mode = 'activation',
  className = '',
  compact = false,
  burstMuscles = {},
}: BodyHeatmapProps) {

  // Merge server data with burst overlay (burst takes precedence)
  const mergedData = useMemo(() => {
    const merged: MuscleData = { ...data };
    for (const [muscle, intensity] of Object.entries(burstMuscles)) {
      merged[muscle] = Math.max(merged[muscle] ?? 0, intensity);
    }
    return merged;
  }, [data, burstMuscles]);

  const exerciseData = useMemo(() => {
    const arr: IExerciseData[] = [];
    for (const [m, score] of Object.entries(mergedData)) {
      const freq = getFrequency(score);
      if (freq > 0) {
        const libMuscle = MUSCLE_MAP[m] || m;
        if (VALID_LIBRARY_MUSCLES.has(libMuscle)) {
          arr.push({
            name: `Log-${m}`,
            muscles: [libMuscle as any],
            frequency: freq
          });
        }
      }
    }
    return arr;
  }, [mergedData]);

  // ─── Biology data (for full modal mode) ───────────────────────────────────
  type SubMuscle = { name: string; scientific: string; function: string; science: string; exercises: string[] };
  type MuscleBiology = { name: string; scientific: string; function: string; angles: string[]; exercises: string[]; subMuscles: SubMuscle[] };

  const BIOLOGY_DATA: Record<string, MuscleBiology> = {
    'chest': {
      name: 'Chest', scientific: 'Pectoralis Major & Minor',
      function: 'Adduction, internal rotation, and flexion of the humerus.',
      angles: ['0° (Flat)', '30°–45° (Incline)', '-15° (Decline)'],
      exercises: ['Barbell Bench Press', 'Incline Dumbbell Press', 'Cable Crossovers'],
      subMuscles: [
        { name: 'Upper Chest', scientific: 'Clavicular Head', function: 'Shoulder flexion (lifting arm upwards).', science: 'EMG studies show 30° to 45° incline angles provide maximal clavicular activation without excessive anterior deltoid takeover.', exercises: ['Incline Dumbbell Press', 'Low-to-High Cable Crossovers'] },
        { name: 'Mid/Lower Chest', scientific: 'Sternocostal & Abdominal Heads', function: 'Horizontal adduction (bringing arms across body).', science: 'Flat bench and slight decline vectors isolate the massive sternocostal fibers for maximum overall hypertrophy.', exercises: ['Flat Barbell Bench Press', 'High-to-Low Cable Flyes', 'Chest Dips'] },
        { name: 'Deep Chest', scientific: 'Pectoralis Minor', function: 'Stabilizes scapula by drawing it inferiorly and anteriorly.', science: 'Trained passively during major presses, but isolated via scapular depression (e.g., Dip shrugs).', exercises: ['Dip Shrugs', 'Straight-arm Pulldowns'] }
      ]
    },
    'neck': {
      name: 'Neck', scientific: 'Cervical Musculature', function: 'Neck flexion, extension, and rotation.',
      angles: ['Flexion: Anterior', 'Extension: Posterior'], exercises: ['Neck Curls', 'Neck Extensions'],
      subMuscles: [
        { name: 'Front Neck', scientific: 'Sternocleidomastoid (SCM)', function: 'Flexes the neck and rotates the head.', science: 'Direct neck flexion with a head harness or plate provides pure isolation, drastically thickening the frontal neck column.', exercises: ['Weighted Neck Curls', 'Isometric Front Holds'] },
        { name: 'Back Neck', scientific: 'Splenius Capitis & Cervicis', function: 'Extends and hyperextends the neck.', science: 'Often underdeveloped. Dedicated neck extensions balance the SCM and prevent forward-head posture.', exercises: ['Weighted Neck Extensions', 'Isometric Rear Holds'] }
      ]
    },
    'triceps': {
      name: 'Triceps', scientific: 'Triceps Brachii', function: 'Extension of the elbow joint.',
      angles: ['0° (Neutral)', '180° (Overhead)'], exercises: ['Tricep Pushdowns', 'Overhead Extensions'],
      subMuscles: [
        { name: 'Long Head', scientific: 'Caput Longum', function: 'Elbow extension and shoulder adduction.', science: 'Since it crosses the shoulder joint, overhead extensions put the long head in a maximally stretched position, driving stretch-mediated hypertrophy.', exercises: ['Overhead Cable Extensions', 'Skull Crushers (behind head)'] },
        { name: 'Lateral Head', scientific: 'Caput Laterale', function: 'Pure elbow extension.', science: 'The most visible "horseshoe" head. Maximally activated when arms are at the sides pushing downward.', exercises: ['V-Bar Pushdowns', 'Close-Grip Bench Press'] },
        { name: 'Medial Head', scientific: 'Caput Mediale', function: 'Stabilization and extension at full lockout.', science: 'Activated heavily during the final degrees of extension and under heavy loads.', exercises: ['Rope Pushdowns', 'Diamond Pushups'] }
      ]
    },
    'biceps': {
      name: 'Biceps', scientific: 'Biceps Brachii & Brachialis', function: 'Flexion of elbow, supination of forearm.',
      angles: ['Shoulder extension (Behind body)', 'Shoulder flexion (Preacher)'], exercises: ['Barbell Curls', 'Incline Dumbbell Curls'],
      subMuscles: [
        { name: 'Long Head', scientific: 'Outer Bicep', function: 'Elbow flexion and supination.', science: 'Curls with the elbows behind the torso stretch the long head, targeting the "peak" of the bicep.', exercises: ['Incline Dumbbell Curls', 'Drag Curls'] },
        { name: 'Short Head', scientific: 'Inner Bicep', function: 'Elbow flexion.', science: 'Curls with the elbows in front of the torso (preacher position) isolate the short head for width.', exercises: ['Preacher Curls', 'Spider Curls'] },
        { name: 'Brachialis', scientific: 'Deep Flexor', function: 'Pure elbow flexion (strongest flexor).', science: 'Neutral (hammer) grips bypass the bicep\'s supination role, isolating the brachialis which pushes the bicep up, making the arm look thicker.', exercises: ['Hammer Curls', 'Reverse Curls'] }
      ]
    },
    'front-deltoids': {
      name: 'Front Deltoids', scientific: 'Anterior Deltoid', function: 'Shoulder flexion and internal rotation.',
      angles: ['90° Vertical Press'], exercises: ['Overhead Press', 'Arnold Press'],
      subMuscles: [{ name: 'Anterior Head', scientific: 'Pars Clavicularis', function: 'Lifts the arm forward.', science: 'Highly activated during all pressing movements. Dedicated front raises are rarely needed if heavy pressing is present.', exercises: ['Seated Dumbbell Press', 'Military Press'] }]
    },
    'back-deltoids': {
      name: 'Rear & Side Deltoids', scientific: 'Posterior & Lateral Deltoid', function: 'Abduction and horizontal extension.',
      angles: ['Horizontal Abduction', 'Lateral Raise'], exercises: ['Face Pulls', 'Lateral Raises'],
      subMuscles: [
        { name: 'Side Delts (Width)', scientific: 'Lateral Deltoid', function: 'Abducts the arm outward.', science: 'The primary muscle for the "V-Taper". Cable lateral raises provide uniform tension compared to dumbbells.', exercises: ['Cable Lateral Raises', 'Dumbbell Lateral Raises'] },
        { name: 'Rear Delts (3D Look)', scientific: 'Posterior Deltoid', function: 'Pulls the arm backward.', science: 'Essential for shoulder health and posture. Often neglected, causing rolled shoulders.', exercises: ['Reverse Pec Deck', 'Face Pulls'] }
      ]
    },
    'upper-back': {
      name: 'Lats & Upper Back', scientific: 'Latissimus Dorsi & Rhomboids', function: 'Shoulder adduction, extension, and scapular retraction.',
      angles: ['Vertical Pull', 'Horizontal Pull'], exercises: ['Pullups', 'Barbell Rows'],
      subMuscles: [
        { name: 'Latissimus Dorsi (Width)', scientific: 'Lats', function: 'Pulls the arm down and back.', science: 'Vertical pulls (Pull-ups, pulldowns) flare the lats outward, creating back width.', exercises: ['Weighted Pull-ups', 'Single-Arm Cable Pulldowns'] },
        { name: 'Rhomboids & Teres (Thickness)', scientific: 'Upper Back Complex', function: 'Retracts the scapula.', science: 'Horizontal pulls (Rows) build deep back thickness and structural integrity.', exercises: ['Chest-Supported Rows', 'Barbell Rows'] }
      ]
    },
    'quadriceps': {
      name: 'Quadriceps', scientific: 'Quadriceps Femoris', function: 'Knee extension.',
      angles: ['Deep Knee Flexion (Squat)'], exercises: ['Barbell Squats', 'Leg Press'],
      subMuscles: [
        { name: 'Rectus Femoris', scientific: 'Middle Quad', function: 'Knee extension & Hip flexion.', science: 'The only quad muscle that crosses the hip. Leg extensions isolate it perfectly.', exercises: ['Leg Extensions', 'Sissy Squats'] },
        { name: 'Vastus Lateralis', scientific: 'Outer Quad Sweep', function: 'Knee extension.', science: 'Narrow stance squats and hack squats place high mechanical tension on the outer sweep.', exercises: ['Hack Squats', 'Narrow-Stance Leg Press'] },
        { name: 'Vastus Medialis (Teardrop)', scientific: 'VMO', function: 'Knee extension & stabilization.', science: 'Deep knee flexion and terminal extension fully activate the VMO.', exercises: ['Deep Barbell Squats', 'Bulgarian Split Squats'] }
      ]
    },
    'hamstring': {
      name: 'Hamstrings', scientific: 'Biceps Femoris & Semis', function: 'Knee flexion and hip extension.',
      angles: ['Hip Hinge', 'Knee Flexion'], exercises: ['Romanian Deadlifts', 'Leg Curls'],
      subMuscles: [
        { name: 'Biceps Femoris', scientific: 'Outer Hamstring', function: 'Knee flexion.', science: 'Seated leg curls stretch the hamstrings at the hip, providing greater hypertrophy than lying curls.', exercises: ['Seated Leg Curls'] },
        { name: 'Semimembranosus/tendinosus', scientific: 'Inner Hamstring', function: 'Hip extension.', science: 'Hip hinge movements load the hamstrings in a deep stretch.', exercises: ['Romanian Deadlifts (RDLs)', 'Good Mornings'] }
      ]
    },
    'calves': {
      name: 'Calves', scientific: 'Triceps Surae', function: 'Plantar flexion.',
      angles: ['Straight Leg', 'Bent Knee'], exercises: ['Standing Calf Raises', 'Seated Calf Raises'],
      subMuscles: [
        { name: 'Gastrocnemius', scientific: 'Upper Calf', function: 'Plantar flexes foot, crosses knee.', science: 'Only activated when the leg is straight. Standing calf raises target this muscle.', exercises: ['Standing Calf Raises', 'Donkey Calf Raises'] },
        { name: 'Soleus', scientific: 'Deep Calf', function: 'Plantar flexes foot.', science: 'Activated when the knee is bent. Crucial for ankle stability and lower leg thickness.', exercises: ['Seated Calf Raises'] }
      ]
    },
    'abs': {
      name: 'Abdominals', scientific: 'Rectus Abdominis', function: 'Spinal flexion.',
      angles: ['Top-down flexion', 'Bottom-up flexion'], exercises: ['Cable Crunches', 'Hanging Leg Raises'],
      subMuscles: [
        { name: 'Upper Abs', scientific: 'Superior Rectus Abdominis', function: 'Flexes the thorax toward the pelvis.', science: 'Top-down movements like crunches effectively target the upper segments.', exercises: ['Weighted Cable Crunches'] },
        { name: 'Lower Abs', scientific: 'Inferior Rectus Abdominis', function: 'Flexes the pelvis toward the thorax.', science: 'Bottom-up movements are required to maximally recruit the lower segments.', exercises: ['Hanging Leg Raises', 'Captain\'s Chair'] }
      ]
    },
    'lower-back': { name: 'Lower Back', scientific: 'Erector Spinae', function: 'Spinal extension.', angles: [], exercises: ['Deadlifts'], subMuscles: [] },
    'trapezius': { name: 'Trapezius', scientific: 'Trapezius', function: 'Scapular elevation.', angles: [], exercises: ['Shrugs'], subMuscles: [] },
    'obliques': { name: 'Obliques', scientific: 'External Obliques', function: 'Spinal rotation.', angles: [], exercises: ['Russian Twists'], subMuscles: [] },
    'gluteal': { name: 'Glutes', scientific: 'Gluteus Maximus', function: 'Hip extension.', angles: [], exercises: ['Hip Thrusts'], subMuscles: [] },
    'forearm': { name: 'Forearms', scientific: 'Flexors & Extensors', function: 'Wrist flexion/extension.', angles: [], exercises: ['Wrist Curls'], subMuscles: [] },
    'head': { name: 'Head', scientific: 'Cranium', function: 'N/A', angles: [], exercises: [], subMuscles: [] },
    'adductor': { name: 'Adductors', scientific: 'Adductor Group', function: 'Hip adduction.', angles: [], exercises: ['Adductor Machine'], subMuscles: [] },
    'abductors': { name: 'Abductors', scientific: 'Gluteus Medius', function: 'Hip abduction.', angles: [], exercises: ['Abductor Machine'], subMuscles: [] }
  };

  const [activeBiology, setActiveBiology] = useState<MuscleBiology | null>(null);
  const [view, setView] = useState<'anterior' | 'posterior'>('anterior');

  // Burst animation: track muscles that recently got a burst for CSS glow
  const hasBurst = Object.keys(burstMuscles).length > 0;

  const handleMuscleClick = (data: any) => {
    if (compact) return; // No modal in compact mode
    const clickedMuscle = data.muscle;
    if (BIOLOGY_DATA[clickedMuscle]) {
      setActiveBiology(BIOLOGY_DATA[clickedMuscle]);
    } else {
      setActiveBiology({
        name: clickedMuscle, scientific: 'Unknown Muscle Group',
        function: 'N/A', angles: [], exercises: [], subMuscles: []
      });
    }
  };

  const colors = useMemo(() => {
    if (mode === 'live') return generateGradient('#7f1d1d', '#ff6b6b', 100);
    return mode === 'activation'
      ? generateGradient('#0c4a6e', '#7dd3fc', 100)
      : generateGradient('#064e3b', '#6ee7b7', 100);
  }, [mode]);

  const accentColor = mode === 'live'
    ? { text: 'text-red-400', glow: 'rgba(255,107,107,0.8)', border: 'border-red-500/50', bg: 'bg-red-500' }
    : mode === 'activation'
      ? { text: 'text-sky-400', glow: 'rgba(56,189,248,0.8)', border: 'border-sky-500/50', bg: 'bg-sky-400' }
      : { text: 'text-emerald-400', glow: 'rgba(52,211,153,0.8)', border: 'border-emerald-500/50', bg: 'bg-emerald-400' };

  // CSS keyframes for glow pulse injected once
  const glowCSS = `
    @keyframes musclePulse {
      0%   { filter: drop-shadow(0 0 0px transparent); }
      40%  { filter: drop-shadow(0 0 12px ${accentColor.glow}); }
      100% { filter: drop-shadow(0 0 4px ${accentColor.glow}); }
    }
    @keyframes muscleFlash {
      0%   { opacity: 0.4; }
      20%  { opacity: 1; }
      100% { opacity: 0.85; }
    }
    .rbh polygon {
      transition: fill 0.4s ease, filter 0.4s ease;
      stroke: rgba(255, 255, 255, 0.04);
      stroke-width: 0.5px;
    }
    .rbh polygon:hover {
      fill: #ffffff !important;
      cursor: pointer;
      filter: drop-shadow(0 0 10px rgba(255,255,255,0.7)) !important;
    }
    .rbh-burst {
      animation: musclePulse 1.5s ease-out forwards;
    }
  `;

  return (
    <div className={`flex flex-col items-center w-full h-full ${className}`}>
      <style>{glowCSS}</style>

      {/* Front/Back Toggle */}
      <div className="flex bg-surface border border-surface2 rounded-full p-1 mb-4 mt-1 relative w-44">
        <div
          className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-full border transition-all duration-300 ${
            mode === 'live'
              ? 'bg-red-500/20 border-red-500/50 shadow-[0_0_10px_rgba(255,107,107,0.3)]'
              : mode === 'activation'
                ? 'bg-sky-500/20 border-sky-500/50 shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                : 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
          }`}
          style={{ left: view === 'anterior' ? '4px' : 'calc(50%)' }}
        />
        <button
          onClick={() => setView('anterior')}
          className={`flex-1 text-[10px] font-bold tracking-widest uppercase py-2 z-10 transition-colors ${view === 'anterior' ? 'text-white' : 'text-text-dim hover:text-white'}`}
        >
          Front
        </button>
        <button
          onClick={() => setView('posterior')}
          className={`flex-1 text-[10px] font-bold tracking-widest uppercase py-2 z-10 transition-colors ${view === 'posterior' ? 'text-white' : 'text-text-dim hover:text-white'}`}
        >
          Back
        </button>
      </div>

      {/* Body Model */}
      <div
        className={`w-full flex justify-center items-center relative ${compact ? 'min-h-[220px] max-h-[260px]' : 'flex-1 min-h-0'}`}
        style={hasBurst ? { animation: 'musclePulse 1.5s ease-out' } : undefined}
      >
        <Model
          data={exerciseData}
          style={{
            width: 'auto',
            height: compact ? '240px' : '100%',
            maxHeight: compact ? '260px' : '100%',
          }}
          type={view}
          bodyColor="#111111"
          highlightedColors={colors}
          onClick={handleMuscleClick}
        />
      </div>

      {/* Legend (only in full mode) */}
      {!compact && (
        <div className="w-full flex justify-between items-center mt-4">
          <span className="text-[9px] tracking-widest text-text-dim uppercase font-bold">
            {mode === 'activation' ? 'Resting' : mode === 'live' ? 'Inactive' : 'Decaying'}
          </span>
          <div className="flex w-28 h-1.5 rounded-full overflow-hidden">
            <div className="flex-1 bg-[#222]" />
            <div className="flex-[4] h-full" style={{ background: `linear-gradient(to right, ${colors[0]}, ${colors[99]})` }} />
          </div>
          <span className={`text-[9px] tracking-widest uppercase font-bold ${accentColor.text}`}>
            {mode === 'activation' ? 'Max Pump' : mode === 'live' ? 'On Fire' : 'Max Armor'}
          </span>
        </div>
      )}

      {/* Biology Overlay Modal (only in full modal mode) */}
      {!compact && activeBiology && (
        <div className="absolute inset-0 bg-obsidian z-30 flex flex-col p-6 animate-in slide-in-from-bottom-8 duration-500 overflow-y-auto hide-scrollbar">
          {/* Header */}
          <div className="relative bg-obsidian/90 z-40 pb-4 pt-2 flex justify-between items-start border-b border-surface2 shrink-0">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${accentColor.bg} shadow-[0_0_10px_${accentColor.glow}]`} />
              <div>
                <h3 className="text-3xl font-black uppercase tracking-[0.2em] text-white leading-none">
                  {activeBiology.name}
                </h3>
                <p className="text-[10px] text-text-dim font-mono tracking-widest mt-1 uppercase">
                  {activeBiology.scientific}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveBiology(null)}
              className="w-10 h-10 rounded-full bg-surface border border-surface2 flex items-center justify-center text-text-dim hover:text-white transition-colors"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="mt-8 space-y-12 pb-12">
            <div className="space-y-4">
              <h4 className="text-[10px] text-white/50 tracking-[0.3em] uppercase flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-vm-scarlet" /> Parent Function
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed font-mono">{activeBiology.function}</p>
            </div>

            {activeBiology.subMuscles && activeBiology.subMuscles.length > 0 && (
              <div className="space-y-6">
                <h4 className="text-[12px] font-bold text-white tracking-[0.3em] uppercase flex items-center gap-2 border-b border-white/10 pb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-vm-scarlet shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                  Sub-Muscle Components
                </h4>

                <div className="relative pl-6 before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-gradient-to-b before:from-vm-scarlet/50 before:to-transparent space-y-6">
                  {activeBiology.subMuscles.map((sub, idx) => (
                    <div key={idx} className="relative w-full">
                      <div className="absolute top-6 -left-6 w-6 h-px bg-vm-scarlet/30" />
                      <div className="absolute top-[21px] -left-[27px] w-2 h-2 rounded-full bg-vm-scarlet shadow-[0_0_8px_rgba(244,63,94,0.8)] border border-obsidian" />
                      <div className="bg-surface border border-surface2 p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden group hover:border-vm-scarlet/50 transition-colors w-full">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-vm-scarlet/5 rounded-full blur-2xl group-hover:bg-vm-scarlet/10 transition-colors pointer-events-none" />
                        <div>
                          <h5 className={`text-lg font-bold tracking-widest uppercase ${accentColor.text} flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2`}>
                            {sub.name}
                            <span className="text-[10px] text-text-dim font-mono tracking-widest">({sub.scientific})</span>
                          </h5>
                        </div>
                        <div className="space-y-3 flex-1">
                          <div>
                            <span className="text-[8px] text-white/40 uppercase tracking-widest block mb-1">Mechanics</span>
                            <p className="text-xs text-gray-300 leading-relaxed font-mono">{sub.function}</p>
                          </div>
                          <div className="bg-obsidian/50 p-3 rounded-lg border border-white/5 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500/20" />
                            <span className="text-[8px] text-sky-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                              <span>⚕</span> Science
                            </span>
                            <p className="text-[10px] text-gray-400 leading-relaxed font-mono">{sub.science}</p>
                          </div>
                        </div>
                        <div>
                          <span className="text-[8px] text-white/40 uppercase tracking-widest block mb-2">Optimal Protocols</span>
                          <div className="flex flex-wrap gap-2">
                            {sub.exercises.map((ex, i) => (
                              <div
                                key={i}
                                className={`px-3 py-1.5 rounded flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase shadow-sm border ${
                                  i === 0
                                    ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                                    : 'bg-obsidian border-surface2 text-white'
                                }`}
                              >
                                {i === 0 && <span className="text-yellow-400 text-[10px]">★</span>}
                                {ex}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
