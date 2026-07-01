EXERCISE_MUSCLE_MAP = {
    # --- Calisthenics & Bodyweight ---
    'pushups': {'chest': 0.70, 'triceps': 0.55, 'front-deltoids': 0.40, 'abs': 0.20},
    'push ups': {'chest': 0.70, 'triceps': 0.55, 'front-deltoids': 0.40, 'abs': 0.20},
    'pushup': {'chest': 0.70, 'triceps': 0.55, 'front-deltoids': 0.40, 'abs': 0.20},
    'push-ups': {'chest': 0.70, 'triceps': 0.55, 'front-deltoids': 0.40, 'abs': 0.20},
    'wide pushups': {'chest': 0.85, 'triceps': 0.35, 'front-deltoids': 0.40},
    'diamond pushups': {'triceps': 0.85, 'chest': 0.50, 'front-deltoids': 0.35, 'abs': 0.20},
    'incline pushups': {'chest': 0.60, 'triceps': 0.50, 'front-deltoids': 0.30},
    'decline pushups': {'chest': 0.75, 'front-deltoids': 0.60, 'triceps': 0.55},
    'pike pushups': {'front-deltoids': 0.85, 'triceps': 0.60, 'upper-back': 0.30, 'trapezius': 0.20},
    'handstand pushups': {'front-deltoids': 0.95, 'triceps': 0.70, 'trapezius': 0.40},
    'archer pushups': {'chest': 0.80, 'triceps': 0.60, 'front-deltoids': 0.45, 'abs': 0.30},
    'one arm pushups': {'chest': 0.85, 'triceps': 0.70, 'front-deltoids': 0.50, 'abs': 0.50},
    'pseudo planche pushups': {'front-deltoids': 0.90, 'chest': 0.60, 'triceps': 0.50, 'abs': 0.40},
    
    'pullups': {'upper-back': 0.85, 'biceps': 0.65, 'forearm': 0.30, 'abs': 0.15},
    'pull ups': {'upper-back': 0.85, 'biceps': 0.65, 'forearm': 0.30, 'abs': 0.15},
    'pullup': {'upper-back': 0.85, 'biceps': 0.65, 'forearm': 0.30, 'abs': 0.15},
    'pull-ups': {'upper-back': 0.85, 'biceps': 0.65, 'forearm': 0.30, 'abs': 0.15},
    'wide pullups': {'upper-back': 0.90, 'biceps': 0.50, 'forearm': 0.30},
    'chinups': {'biceps': 0.85, 'upper-back': 0.70, 'forearm': 0.25},
    'chin-ups': {'biceps': 0.85, 'upper-back': 0.70, 'forearm': 0.25},
    'close grip chinups': {'biceps': 0.90, 'upper-back': 0.60, 'forearm': 0.30},
    'muscle ups': {'upper-back': 0.80, 'triceps': 0.70, 'chest': 0.50, 'front-deltoids': 0.40, 'abs': 0.30},
    'front lever': {'upper-back': 0.90, 'abs': 0.80, 'lower-back': 0.40, 'biceps': 0.30},
    'back lever': {'lower-back': 0.80, 'upper-back': 0.70, 'chest': 0.50, 'biceps': 0.40},
    'human flag': {'upper-back': 0.70, 'front-deltoids': 0.60, 'abs': 0.60},

    'dips': {'triceps': 0.75, 'chest': 0.60, 'front-deltoids': 0.40},
    'chest dips': {'chest': 0.80, 'triceps': 0.60, 'front-deltoids': 0.40},
    'tricep dips': {'triceps': 0.85, 'chest': 0.40, 'front-deltoids': 0.25},
    'bench dips': {'triceps': 0.70, 'chest': 0.20, 'front-deltoids': 0.30},

    'squats': {'quadriceps': 0.85, 'gluteal': 0.65, 'hamstring': 0.45, 'calves': 0.30, 'lower-back': 0.20},
    'squat': {'quadriceps': 0.85, 'gluteal': 0.65, 'hamstring': 0.45, 'calves': 0.30, 'lower-back': 0.20},
    'pistol squats': {'quadriceps': 0.90, 'gluteal': 0.70, 'hamstring': 0.50, 'calves': 0.40, 'abs': 0.40},
    'bulgarian split squats': {'quadriceps': 0.85, 'gluteal': 0.80, 'hamstring': 0.50, 'calves': 0.30},
    'jump squats': {'quadriceps': 0.80, 'calves': 0.70, 'gluteal': 0.60, 'hamstring': 0.40},
    'lunges': {'quadriceps': 0.75, 'gluteal': 0.60, 'hamstring': 0.45, 'calves': 0.20},
    'lunge': {'quadriceps': 0.75, 'gluteal': 0.60, 'hamstring': 0.45, 'calves': 0.20},
    'walking lunges': {'quadriceps': 0.75, 'gluteal': 0.65, 'hamstring': 0.50, 'calves': 0.30},
    'calf raises': {'calves': 0.95},
    'calf raise': {'calves': 0.95},

    # --- Core & Mobility ---
    'core': {'abs': 0.80, 'lower-back': 0.25},
    'abs': {'abs': 0.90},
    'crunches': {'abs': 0.85},
    'crunch': {'abs': 0.85},
    'situps': {'abs': 0.80},
    'plank': {'abs': 0.85, 'lower-back': 0.50, 'front-deltoids': 0.30},
    'side plank': {'abs': 0.50, 'front-deltoids': 0.40, 'lower-back': 0.30},
    'leg raises': {'abs': 0.90, 'lower-back': 0.20},
    'leg raise': {'abs': 0.90, 'lower-back': 0.20},
    'hanging leg raises': {'abs': 0.95, 'forearm': 0.30, 'lower-back': 0.20},
    'russian twists': {'abs': 0.60},
    'dragon flag': {'abs': 0.95, 'lower-back': 0.30, 'upper-back': 0.40},
    'ab wheel': {'abs': 0.95, 'lower-back': 0.40, 'upper-back': 0.30, 'triceps': 0.20},
    'hollow body hold': {'abs': 0.90, 'lower-back': 0.40},
    'v-ups': {'abs': 0.85},
    'mountain climbers': {'abs': 0.75, 'front-deltoids': 0.40, 'quadriceps': 0.50},
    'supermans': {'lower-back': 0.90, 'gluteal': 0.50, 'hamstring': 0.30},

    # --- Weightlifting: Chest ---
    'bench press': {'chest': 0.85, 'triceps': 0.60, 'front-deltoids': 0.40},
    'incline bench press': {'chest': 0.80, 'front-deltoids': 0.60, 'triceps': 0.50},
    'decline bench press': {'chest': 0.85, 'triceps': 0.60, 'front-deltoids': 0.30},
    'dumbbell bench press': {'chest': 0.90, 'triceps': 0.50, 'front-deltoids': 0.40},
    'dumbbell flyes': {'chest': 0.95, 'front-deltoids': 0.30},
    'cable crossovers': {'chest': 0.90, 'front-deltoids': 0.20},
    
    # --- Weightlifting: Back ---
    'deadlifts': {'lower-back': 0.90, 'hamstring': 0.80, 'gluteal': 0.70, 'upper-back': 0.50, 'forearm': 0.40, 'trapezius': 0.40},
    'deadlift': {'lower-back': 0.90, 'hamstring': 0.80, 'gluteal': 0.70, 'upper-back': 0.50, 'forearm': 0.40, 'trapezius': 0.40},
    'romanian deadlifts': {'hamstring': 0.90, 'gluteal': 0.80, 'lower-back': 0.60, 'forearm': 0.30},
    'rdl': {'hamstring': 0.90, 'gluteal': 0.80, 'lower-back': 0.60, 'forearm': 0.30},
    'rows': {'upper-back': 0.85, 'biceps': 0.55, 'forearm': 0.25, 'lower-back': 0.30},
    'row': {'upper-back': 0.85, 'biceps': 0.55, 'forearm': 0.25, 'lower-back': 0.30},
    'barbell rows': {'upper-back': 0.85, 'lower-back': 0.60, 'biceps': 0.50},
    'dumbbell rows': {'upper-back': 0.90, 'biceps': 0.55},
    't-bar rows': {'upper-back': 0.85, 'lower-back': 0.50, 'biceps': 0.45},
    'lat pulldowns': {'upper-back': 0.85, 'biceps': 0.55},
    'seated cable rows': {'upper-back': 0.85, 'biceps': 0.50, 'lower-back': 0.30},
    'face pulls': {'trapezius': 0.70, 'upper-back': 0.40},
    'shrugs': {'trapezius': 0.95, 'upper-back': 0.30, 'forearm': 0.20},

    # --- Weightlifting: Shoulders ---
    'overhead press': {'front-deltoids': 0.85, 'triceps': 0.60, 'trapezius': 0.40, 'upper-back': 0.20},
    'shoulder press': {'front-deltoids': 0.85, 'triceps': 0.60, 'trapezius': 0.40, 'upper-back': 0.20},
    'military press': {'front-deltoids': 0.85, 'triceps': 0.60, 'trapezius': 0.40, 'abs': 0.30},
    'arnold press': {'front-deltoids': 0.80, 'triceps': 0.50},
    'lateral raises': {'front-deltoids': 0.90}, 
    'front raises': {'front-deltoids': 0.95},
    'reverse flyes': {'upper-back': 0.50, 'trapezius': 0.40},

    # --- Weightlifting: Arms ---
    'curls': {'biceps': 0.95, 'forearm': 0.35},
    'curl': {'biceps': 0.95, 'forearm': 0.35},
    'bicep curls': {'biceps': 0.95, 'forearm': 0.35},
    'hammer curls': {'biceps': 0.85, 'forearm': 0.60},
    'preacher curls': {'biceps': 0.95, 'forearm': 0.20},
    'tricep extensions': {'triceps': 0.95},
    'skull crushers': {'triceps': 0.95, 'chest': 0.10},
    'tricep pushdowns': {'triceps': 0.90},
    'wrist curls': {'forearm': 0.95},

    # --- Weightlifting: Legs ---
    'barbell squats': {'quadriceps': 0.85, 'gluteal': 0.70, 'hamstring': 0.45, 'lower-back': 0.40, 'calves': 0.20},
    'front squats': {'quadriceps': 0.95, 'gluteal': 0.50, 'abs': 0.40, 'upper-back': 0.30},
    'hack squats': {'quadriceps': 0.95, 'gluteal': 0.40},
    'leg press': {'quadriceps': 0.85, 'gluteal': 0.60, 'hamstring': 0.30},
    'leg extensions': {'quadriceps': 0.95},
    'leg curls': {'hamstring': 0.95, 'calves': 0.20},
    'hip thrusts': {'gluteal': 0.95, 'hamstring': 0.50, 'lower-back': 0.20},
    'hip thrust': {'gluteal': 0.95, 'hamstring': 0.50, 'lower-back': 0.20},
    'glute bridges': {'gluteal': 0.90, 'hamstring': 0.40, 'lower-back': 0.20},
    'calf raises (weighted)': {'calves': 0.95},

    # --- Cardio & Plyometrics ---
    'burpees': {'chest': 0.40, 'triceps': 0.30, 'abs': 0.60, 'quadriceps': 0.65, 'calves': 0.40, 'gluteal': 0.30},
    'burpee': {'chest': 0.40, 'triceps': 0.30, 'abs': 0.60, 'quadriceps': 0.65, 'calves': 0.40, 'gluteal': 0.30},
    'jumping jacks': {'calves': 0.70, 'quadriceps': 0.50, 'gluteal': 0.40, 'front-deltoids': 0.30},
    'run': {'quadriceps': 0.60, 'hamstring': 0.65, 'calves': 0.75, 'gluteal': 0.50, 'abs': 0.20},
    'running': {'quadriceps': 0.60, 'hamstring': 0.65, 'calves': 0.75, 'gluteal': 0.50, 'abs': 0.20},
    'sprints': {'quadriceps': 0.80, 'hamstring': 0.85, 'calves': 0.80, 'gluteal': 0.75, 'abs': 0.40},
    'jump rope': {'calves': 0.85, 'quadriceps': 0.40, 'abs': 0.20, 'forearm': 0.20},
    'box jumps': {'quadriceps': 0.85, 'gluteal': 0.75, 'calves': 0.60, 'hamstring': 0.50},
    'wall sit': {'quadriceps': 0.95, 'gluteal': 0.50},
    'kettlebell swings': {'gluteal': 0.85, 'hamstring': 0.75, 'lower-back': 0.60, 'abs': 0.40, 'front-deltoids': 0.30},

    # --- Yoga / Mobility (Common poses) ---
    'downward dog': {'front-deltoids': 0.40, 'upper-back': 0.30, 'calves': 0.40, 'hamstring': 0.40},
    'upward dog': {'lower-back': 0.50, 'triceps': 0.40, 'chest': 0.30},
    'chaturanga': {'triceps': 0.70, 'chest': 0.60, 'front-deltoids': 0.50, 'abs': 0.40},
    'warrior pose': {'quadriceps': 0.70, 'gluteal': 0.50, 'front-deltoids': 0.30}
}

import re

def get_muscles_for_exercise_sync(exercise_name: str) -> dict:
    normalised = exercise_name.lower().strip()

    if normalised in EXERCISE_MUSCLE_MAP:
        return EXERCISE_MUSCLE_MAP[normalised]

    best_key = ""
    best_len = 0
    for key in EXERCISE_MUSCLE_MAP.keys():
        if key in normalised and len(key) > best_len:
            best_key = key
            best_len = len(key)
            
    if best_key:
        return EXERCISE_MUSCLE_MAP[best_key]

    words = re.split(r'\s+', normalised)
    for word in words:
        if len(word) < 3:
            continue
        for key in EXERCISE_MUSCLE_MAP.keys():
            if word in key:
                return EXERCISE_MUSCLE_MAP[key]

    return None
