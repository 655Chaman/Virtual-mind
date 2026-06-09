'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Dumbbell, Activity, Droplets, Target, Shield } from 'lucide-react';

const WEEKLY_SCHEDULE = [
  { day: 'MON', title: 'The Foundation', focus: 'Chest/Back', loc: 'Gym', goal: 'Heavy compounds for the "V-Taper."' },
  { day: 'TUE', title: 'Aesthetic Volume', focus: 'Shoulders/Core', loc: 'Home', goal: 'Width & midsection tightness (12kg DB).' },
  { day: 'WED', title: 'Lower Body Power', focus: 'Legs/Posture', loc: 'Gym', goal: 'Legs and Mid-back thickness.' },
  { day: 'THU', title: 'Active Recovery', focus: '10k Steps', loc: 'Anywhere', goal: 'Fat-burning & Deep Work focus.' },
  { day: 'FRI', title: 'Upper Hypertrophy', focus: 'Full Upper', loc: 'Gym', goal: 'Hitting weak points and "The Pump."' },
  { day: 'SAT', title: 'Detail & Finishing', focus: 'Arms/Shoulders', loc: 'Home', goal: 'Triceps and Side Delts volume.' },
  { day: 'SUN', title: 'System Maintenance', focus: 'Rest', loc: 'Rest', goal: 'Meal prep and Business audit.' },
];

export default function AestheticProtocolPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-obsidian text-gray-300 font-mono relative pb-20 overflow-x-hidden">
      <div className="scanline-overlay z-50 pointer-events-none" />

      {/* Grid Pattern Background */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none" />
      
      {/* Red/Gold Haze */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(201,168,76,0.05)_0%,transparent_50%)] pointer-events-none" />

      <div className="relative z-10 px-4 pb-4 pt-safe md:px-8 md:pb-8 md:pt-safe max-w-[1200px] mx-auto animate-fade-up">
        {/* Header */}
        <header className="flex justify-between items-center border-b border-surface2 pb-5 mb-8">
          <div>
            <button
              onClick={() => router.back()}
              className="px-3 py-1 bg-surface hover:bg-surface2 border border-surface2 flex items-center gap-2 text-xs transition-colors text-text-dim hover:text-gold mb-4"
            >
              <ArrowLeft className="w-3 h-3" /> BACK
            </button>
            <h1 className="text-3xl font-heading text-gold tracking-[0.2em] drop-shadow-[0_0_12px_rgba(201,168,76,0.3)]">
              AESTHETIC PROTOCOL
            </h1>
            <p className="text-[10px] text-text-dim tracking-widest mt-2 uppercase">
              Physical Mastery for the 6'1" Frame // Priority: Posture, Width, Metabolic Health
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left and Middle columns */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Weekly Schedule Section */}
            <div className="bg-surface border border-surface2 p-6 hover-lift">
              <h2 className="text-gold font-bold mb-6 flex items-center gap-2 text-xs tracking-widest border-b border-surface2 pb-2">
                <Dumbbell className="w-4 h-4" /> THE WEEKLY SCHEDULE
              </h2>
              <div className="grid gap-3">
                {WEEKLY_SCHEDULE.map((day, idx) => (
                  <div key={idx} className={`p-3 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors
                    ${day.loc === 'Rest' || day.loc === 'Anywhere' ? 'border-surface2 bg-obsidian text-text-dim' : 'border-gold/20 bg-surface2 glow-gold'}`}>
                    <div className="flex md:items-center flex-col sm:flex-row gap-4">
                      <span className={`text-xl font-heading tracking-wider ${day.loc === 'Rest' ? 'text-text-dim' : 'text-gold'}`}>
                        {day.day}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-gray-200">{day.title}</div>
                        <div className="text-[10px] text-gold/60 mt-0.5">{day.focus} • {day.loc}</div>
                      </div>
                    </div>
                    <div className="text-[10px] sm:text-right opacity-80 max-w-[200px] leading-tight">
                      {day.goal}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Execution Section */}
            <div className="bg-surface border border-surface2 p-6 hover-lift">
              <h2 className="text-vm-blue font-bold mb-6 flex items-center gap-2 text-xs tracking-widest border-b border-vm-blue/20 pb-2">
                <Target className="w-4 h-4" /> KEY DAILY WORKOUTS
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="border border-surface2 p-4 bg-obsidian">
                  <h3 className="text-gold text-xs font-bold mb-2 tracking-widest border-b border-surface2 pb-2">MON: FOUNDATION</h3>
                  <ul className="text-[11px] space-y-2 text-gray-400">
                    <li className="flex gap-2"><span>1.</span><span><strong className="text-gray-300">Incline DB Press:</strong> 3x8-10 (stretch focus)</span></li>
                    <li className="flex gap-2"><span>2.</span><span><strong className="text-gray-300">Wide Lat Pulldowns:</strong> 3x10-12</span></li>
                    <li className="flex gap-2"><span>3.</span><span><strong className="text-gray-300">Seated Cable Rows:</strong> 3x10-12</span></li>
                    <li className="flex gap-2"><span>4.</span><span><strong className="text-gray-300">DB Lateral Raises:</strong> 4x15</span></li>
                  </ul>
                  <div className="mt-4 text-[10px] text-vm-green/80 bg-vm-green/10 p-2 border border-vm-green/20">
                    Fast: 500ml H2O + 20min Deep Work prior.
                  </div>
                </div>

                <div className="border border-surface2 p-4 bg-obsidian">
                  <h3 className="text-gold text-xs font-bold mb-2 tracking-widest border-b border-surface2 pb-2">TUE: 12KG HOME VOLUME</h3>
                  <ul className="text-[11px] space-y-2 text-gray-400">
                    <li className="flex gap-2"><span>1.</span><span><strong className="text-gray-300">Decline Push-ups:</strong> 4x Failure</span></li>
                    <li className="flex gap-2"><span>2.</span><span><strong className="text-gray-300">Leaning Lateral Raises:</strong> 5x15</span></li>
                    <li className="flex gap-2"><span>3.</span><span><strong className="text-gray-300">Single-Arm DB Row:</strong> 3x12</span></li>
                    <li className="flex gap-2"><span>4.</span><span><strong className="text-gray-300">Plank:</strong> 3x 60s</span></li>
                  </ul>
                  <div className="mt-4 text-[10px] text-vm-blue/80 bg-vm-blue/10 p-2 border border-vm-blue/20">
                    Fasted 15min walk AM. 3-1-1 Tempo rule!
                  </div>
                </div>

                <div className="border border-surface2 p-4 bg-obsidian">
                  <h3 className="text-gold text-xs font-bold mb-2 tracking-widest border-b border-surface2 pb-2">WED: LOWER & POSTURE</h3>
                  <ul className="text-[11px] space-y-2 text-gray-400">
                    <li className="flex gap-2"><span>1.</span><span><strong className="text-gray-300">Leg Press:</strong> 3x12-15</span></li>
                    <li className="flex gap-2"><span>2.</span><span><strong className="text-gray-300">Seated DB Press:</strong> 3x10</span></li>
                    <li className="flex gap-2"><span>3.</span><span><strong className="text-gray-300">Face Pulls:</strong> 3x15 (Crucial)</span></li>
                    <li className="flex gap-2"><span>4.</span><span><strong className="text-gray-300">Leg Curls/Ext:</strong> 3x12</span></li>
                  </ul>
                </div>

                <div className="border border-surface2 p-4 bg-obsidian">
                  <h3 className="text-gold text-xs font-bold mb-2 tracking-widest border-b border-surface2 pb-2">FRI: UPPER HYPERTROPHY</h3>
                  <ul className="text-[11px] space-y-2 text-gray-400">
                    <li className="flex gap-2"><span>1.</span><span><strong className="text-gray-300">Flat DB Press:</strong> 3x10</span></li>
                    <li className="flex gap-2"><span>2.</span><span><strong className="text-gray-300">Pull-ups:</strong> 3x Failure</span></li>
                    <li className="flex gap-2"><span>3.</span><span><strong className="text-gray-300">Chest Sup. Rows:</strong> 3x12</span></li>
                    <li className="flex gap-2"><span>4.</span><span><strong className="text-gray-300">Dips:</strong> 3x Failure (Lean forward)</span></li>
                  </ul>
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar - Bio-Rules */}
          <div className="space-y-6">
            <div className="bg-surface border border-vm-red/30 p-6 glow-red hover-lift">
              <h3 className="text-vm-red font-bold mb-4 flex items-center gap-2 text-xs tracking-widest border-b border-vm-red/20 pb-2">
                <Shield className="w-4 h-4" /> DAILY BIO-RULES
              </h3>

              <div className="space-y-4">
                <div className="border border-vm-red/20 bg-vm-red/5 p-3">
                  <h4 className="text-[11px] font-bold text-vm-red mb-1">1. PROTEIN ANCHOR</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Consume protein source <strong>FIRST</strong> during carb-heavy Indian meals. Target: 160g-175g daily.
                    <br/><span className="text-gold/80 block mt-1">Hack: 6 Egg whites + 100g Soya chunks = ~50g</span>
                  </p>
                </div>

                <div className="border border-vm-red/20 bg-vm-red/5 p-3">
                  <h4 className="text-[11px] font-bold text-vm-red mb-1">2. 3-1-1 TEMPO (HOME)</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Mandatory for 12kg dumbbells to force hypertrophy.
                    <br/>- 3s lower
                    <br/>- 1s peak pause
                    <br/>- 1s explosive concentric
                  </p>
                </div>

                <div className="border border-vm-red/20 bg-vm-red/5 p-3">
                  <h4 className="text-[11px] font-bold text-vm-red mb-1">3. MAGNESIUM PROTOCOL</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    L-Threonate exactly 60m before bed. Zero blue light/scrolling during this window. Use for low-arousal prep.
                  </p>
                </div>

                <div className="border border-vm-red/20 bg-vm-red/5 p-3">
                  <h4 className="text-[11px] font-bold text-vm-red mb-1">4. 10K STEPS (NEAT)</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Non-negotiable. Essential for the 6'1" frame skinny-fat fix regardless of heavy lifting. Let it burn.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action panel (static aesthetic button for now) */}
            <div className="bg-surface border border-surface2 p-5 text-center">
              <p className="text-[10px] text-text-dim tracking-widest mb-3">ELITE AESTHETIC INTEGRITY</p>
              <div className="w-full py-2 bg-gold/10 border border-gold/40 text-gold text-xs tracking-widest cursor-default">
                PROTOCOL ENFORCED
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
