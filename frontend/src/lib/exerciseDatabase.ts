export const EXERCISE_MUSCLE_MAP: Record<string, Record<string, number>> = {
  // --- Calisthenics & Bodyweight ---
  'pushups': { chest: 70, triceps: 55, 'front-deltoids': 40, abs: 20 },
  'push ups': { chest: 70, triceps: 55, 'front-deltoids': 40, abs: 20 },
  'pushup': { chest: 70, triceps: 55, 'front-deltoids': 40, abs: 20 },
  'push-ups': { chest: 70, triceps: 55, 'front-deltoids': 40, abs: 20 },
  'wide pushups': { chest: 85, triceps: 35, 'front-deltoids': 40 },
  'diamond pushups': { triceps: 85, chest: 50, 'front-deltoids': 35, abs: 20 },
  'incline pushups': { chest: 60, triceps: 50, 'front-deltoids': 30 }, // Focus on lower chest
  'decline pushups': { chest: 75, 'front-deltoids': 60, triceps: 55 }, // Focus on upper chest
  'pike pushups': { 'front-deltoids': 85, triceps: 60, 'upper-back': 30, trapezius: 20 },
  'handstand pushups': { 'front-deltoids': 95, triceps: 70, trapezius: 40 },
  'archer pushups': { chest: 80, triceps: 60, 'front-deltoids': 45, abs: 30 },
  'one arm pushups': { chest: 85, triceps: 70, 'front-deltoids': 50, obliques: 60, abs: 50 },
  'pseudo planche pushups': { 'front-deltoids': 90, chest: 60, triceps: 50, abs: 40 },
  
  'pullups': { 'upper-back': 85, biceps: 65, forearms: 30, abs: 15 },
  'pull ups': { 'upper-back': 85, biceps: 65, forearms: 30, abs: 15 },
  'pullup': { 'upper-back': 85, biceps: 65, forearms: 30, abs: 15 },
  'pull-ups': { 'upper-back': 85, biceps: 65, forearms: 30, abs: 15 },
  'wide pullups': { 'upper-back': 90, biceps: 50, forearms: 30 },
  'chinups': { biceps: 85, 'upper-back': 70, forearms: 25 },
  'chin-ups': { biceps: 85, 'upper-back': 70, forearms: 25 },
  'close grip chinups': { biceps: 90, 'upper-back': 60, forearms: 30 },
  'muscle ups': { 'upper-back': 80, triceps: 70, chest: 50, 'front-deltoids': 40, abs: 30 },
  'front lever': { 'upper-back': 90, abs: 80, 'lower-back': 40, biceps: 30 },
  'back lever': { 'lower-back': 80, 'upper-back': 70, chest: 50, biceps: 40 },
  'human flag': { obliques: 90, 'upper-back': 70, 'front-deltoids': 60, abs: 60 },

  'dips': { triceps: 75, chest: 60, 'front-deltoids': 40 },
  'chest dips': { chest: 80, triceps: 60, 'front-deltoids': 40 },
  'tricep dips': { triceps: 85, chest: 40, 'front-deltoids': 25 },
  'bench dips': { triceps: 70, chest: 20, 'front-deltoids': 30 },

  'squats': { quadriceps: 85, gluteal: 65, hamstring: 45, calves: 30, 'lower-back': 20 },
  'squat': { quadriceps: 85, gluteal: 65, hamstring: 45, calves: 30, 'lower-back': 20 },
  'pistol squats': { quadriceps: 90, gluteal: 70, hamstring: 50, calves: 40, abs: 40 },
  'bulgarian split squats': { quadriceps: 85, gluteal: 80, hamstring: 50, calves: 30 },
  'jump squats': { quadriceps: 80, calves: 70, gluteal: 60, hamstring: 40 },
  'lunges': { quadriceps: 75, gluteal: 60, hamstring: 45, calves: 20 },
  'lunge': { quadriceps: 75, gluteal: 60, hamstring: 45, calves: 20 },
  'walking lunges': { quadriceps: 75, gluteal: 65, hamstring: 50, calves: 30 },
  'calf raises': { calves: 95 },
  'calf raise': { calves: 95 },

  // --- Core & Mobility ---
  'core': { abs: 80, obliques: 55, 'lower-back': 25 },
  'abs': { abs: 90, obliques: 45 },
  'crunches': { abs: 85, obliques: 30 },
  'crunch': { abs: 85, obliques: 30 },
  'situps': { abs: 80, obliques: 30 }, // hip flexors too, but we don't have that map
  'plank': { abs: 85, 'lower-back': 50, 'front-deltoids': 30, obliques: 40 },
  'side plank': { obliques: 90, abs: 50, 'front-deltoids': 40, 'lower-back': 30 },
  'leg raises': { abs: 90, 'lower-back': 20 },
  'leg raise': { abs: 90, 'lower-back': 20 },
  'hanging leg raises': { abs: 95, forearms: 30, 'lower-back': 20 },
  'russian twists': { obliques: 85, abs: 60 },
  'dragon flag': { abs: 95, obliques: 50, 'lower-back': 30, 'upper-back': 40 },
  'ab wheel': { abs: 95, 'lower-back': 40, 'upper-back': 30, triceps: 20 },
  'hollow body hold': { abs: 90, 'lower-back': 40 },
  'v-ups': { abs: 85, obliques: 30 },
  'mountain climbers': { abs: 75, 'front-deltoids': 40, quadriceps: 50 },
  'supermans': { 'lower-back': 90, gluteal: 50, hamstring: 30 },

  // --- Weightlifting: Chest ---
  'bench press': { chest: 85, triceps: 60, 'front-deltoids': 40 },
  'incline bench press': { chest: 80, 'front-deltoids': 60, triceps: 50 },
  'decline bench press': { chest: 85, triceps: 60, 'front-deltoids': 30 },
  'dumbbell bench press': { chest: 90, triceps: 50, 'front-deltoids': 40 },
  'dumbbell flyes': { chest: 95, 'front-deltoids': 30 },
  'cable crossovers': { chest: 90, 'front-deltoids': 20 },
  
  // --- Weightlifting: Back ---
  'deadlifts': { 'lower-back': 90, hamstring: 80, gluteal: 70, 'upper-back': 50, forearms: 40, trapezius: 40 },
  'deadlift': { 'lower-back': 90, hamstring: 80, gluteal: 70, 'upper-back': 50, forearms: 40, trapezius: 40 },
  'romanian deadlifts': { hamstring: 90, gluteal: 80, 'lower-back': 60, forearms: 30 },
  'rdl': { hamstring: 90, gluteal: 80, 'lower-back': 60, forearms: 30 },
  'rows': { 'upper-back': 85, biceps: 55, 'back-deltoids': 45, forearms: 25, 'lower-back': 30 },
  'row': { 'upper-back': 85, biceps: 55, 'back-deltoids': 45, forearms: 25, 'lower-back': 30 },
  'barbell rows': { 'upper-back': 85, 'lower-back': 60, biceps: 50, 'back-deltoids': 40 },
  'dumbbell rows': { 'upper-back': 90, biceps: 55, 'back-deltoids': 40 },
  't-bar rows': { 'upper-back': 85, 'lower-back': 50, biceps: 45 },
  'lat pulldowns': { 'upper-back': 85, biceps: 55, 'back-deltoids': 30 },
  'seated cable rows': { 'upper-back': 85, biceps: 50, 'lower-back': 30 },
  'face pulls': { 'back-deltoids': 90, trapezius: 70, 'upper-back': 40 },
  'shrugs': { trapezius: 95, 'upper-back': 30, forearms: 20 },

  // --- Weightlifting: Shoulders ---
  'overhead press': { 'front-deltoids': 85, triceps: 60, trapezius: 40, 'upper-back': 20 },
  'shoulder press': { 'front-deltoids': 85, triceps: 60, trapezius: 40, 'upper-back': 20 },
  'military press': { 'front-deltoids': 85, triceps: 60, trapezius: 40, abs: 30 },
  'arnold press': { 'front-deltoids': 80, triceps: 50, 'back-deltoids': 30 },
  'lateral raises': { 'front-deltoids': 90 }, // Technically lateral delts, mapped to front-deltoids in BodyHeatmap
  'front raises': { 'front-deltoids': 95 },
  'reverse flyes': { 'back-deltoids': 90, 'upper-back': 50, trapezius: 40 },

  // --- Weightlifting: Arms ---
  'curls': { biceps: 95, forearms: 35 },
  'curl': { biceps: 95, forearms: 35 },
  'bicep curls': { biceps: 95, forearms: 35 },
  'hammer curls': { biceps: 85, forearms: 60 },
  'preacher curls': { biceps: 95, forearms: 20 },
  'tricep extensions': { triceps: 95 },
  'skull crushers': { triceps: 95, chest: 10 },
  'tricep pushdowns': { triceps: 90 },
  'wrist curls': { forearms: 95 },

  // --- Weightlifting: Legs ---
  'barbell squats': { quadriceps: 85, gluteal: 70, hamstring: 45, 'lower-back': 40, calves: 20 },
  'front squats': { quadriceps: 95, gluteal: 50, abs: 40, 'upper-back': 30 },
  'hack squats': { quadriceps: 95, gluteal: 40 },
  'leg press': { quadriceps: 85, gluteal: 60, hamstring: 30 },
  'leg extensions': { quadriceps: 95 },
  'leg curls': { hamstring: 95, calves: 20 },
  'hip thrusts': { gluteal: 95, hamstring: 50, 'lower-back': 20 },
  'hip thrust': { gluteal: 95, hamstring: 50, 'lower-back': 20 },
  'glute bridges': { gluteal: 90, hamstring: 40, 'lower-back': 20 },
  'calf raises (weighted)': { calves: 95 },

  // --- Cardio & Plyometrics ---
  'burpees': { chest: 40, triceps: 30, abs: 60, quadriceps: 65, calves: 40, gluteal: 30 },
  'burpee': { chest: 40, triceps: 30, abs: 60, quadriceps: 65, calves: 40, gluteal: 30 },
  'jumping jacks': { calves: 70, quadriceps: 50, gluteal: 40, 'front-deltoids': 30 },
  'run': { quadriceps: 60, hamstring: 65, calves: 75, gluteal: 50, abs: 20 },
  'running': { quadriceps: 60, hamstring: 65, calves: 75, gluteal: 50, abs: 20 },
  'sprints': { quadriceps: 80, hamstring: 85, calves: 80, gluteal: 75, abs: 40 },
  'jump rope': { calves: 85, quadriceps: 40, abs: 20, forearms: 20 },
  'box jumps': { quadriceps: 85, gluteal: 75, calves: 60, hamstring: 50 },
  'wall sit': { quadriceps: 95, gluteal: 50 },
  'kettlebell swings': { gluteal: 85, hamstring: 75, 'lower-back': 60, abs: 40, 'front-deltoids': 30 },

  // --- Yoga / Mobility (Common poses) ---
  'downward dog': { 'front-deltoids': 40, 'upper-back': 30, calves: 40, hamstring: 40 },
  'upward dog': { 'lower-back': 50, triceps: 40, chest: 30 },
  'chaturanga': { triceps: 70, chest: 60, 'front-deltoids': 50, abs: 40 },
  'warrior pose': { quadriceps: 70, gluteal: 50, 'front-deltoids': 30 }
};

// Fuzzy match: find the best exercise key by keyword matching
export function getMusclesForExercise(exerciseName: string): Record<string, number> | null {
  const normalised = exerciseName.toLowerCase().trim();

  // 1. Exact match
  if (EXERCISE_MUSCLE_MAP[normalised]) return EXERCISE_MUSCLE_MAP[normalised];

  // 2. Substring match — find the most specific key that appears in the name
  let bestKey = '';
  let bestLen = 0;
  for (const key of Object.keys(EXERCISE_MUSCLE_MAP)) {
    if (normalised.includes(key) && key.length > bestLen) {
      bestKey = key;
      bestLen = key.length;
    }
  }
  if (bestKey) return EXERCISE_MUSCLE_MAP[bestKey];

  // 3. Reverse — does any word from the name appear in a key?
  const words = normalised.split(/\s+/);
  for (const word of words) {
    if (word.length < 3) continue;
    for (const key of Object.keys(EXERCISE_MUSCLE_MAP)) {
      if (key.includes(word)) return EXERCISE_MUSCLE_MAP[key];
    }
  }

  return null;
}
