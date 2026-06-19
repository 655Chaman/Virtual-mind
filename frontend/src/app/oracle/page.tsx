'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NightlyOracle() {
  const router = useRouter();
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    // In a real app, this fetches from /api/oracle/generate-questions
    // Mocking for the frontend demo based on the backend logic
    setTimeout(() => {
      setQuestions([
        "How did your energy levels feel today?",
        "Do you have any major schedule disruptions tomorrow (e.g. travel, Ramadan)?",
        "What is the ONE simple thing you must do tomorrow to maintain consistency?"
      ]);
      setLoading(false);
    }, 1500);
  }, []);

  const handleSync = async () => {
    setProcessing(true);
    
    // Simulate backend call to /api/oracle/process-sync
    setTimeout(() => {
      // Mocking the AI response based on the lenient consistency prompt
      const aiResponse = {
        tomorrow_theme: "Consistency Over Intensity",
        adjusted_tasks: [
          {
            task_name: "Light 15-Minute Mobility Routine",
            xp_reward: 150,
            reason: "Replacing heavy lifting due to your travel schedule. Keep the habit alive."
          },
          {
            task_name: "Read 10 pages on the bus",
            xp_reward: 100,
            reason: "Perfect for transit. Simple and consistent."
          }
        ],
        leniency_adjustments: "I have removed your 2-hour deep work block because you are traveling all night. Your schedule has been adapted to protect your consistency without breaking you. Rest well."
      };
      
      setResult(aiResponse);
      setProcessing(false);
    }, 2500);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-black text-white font-mono p-6 pt-14 flex flex-col relative overflow-hidden">
      
      {/* Background Matrix/Terminal Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

      <div className="flex items-center justify-between z-10 mb-8">
        <button onClick={() => router.push('/home')} className="text-xs text-green-500 hover:underline tracking-widest uppercase">
          [ ABORT SYNC ]
        </button>
        <span className="text-[10px] text-green-500/50 tracking-[0.3em]">THE ORACLE</span>
      </div>

      <div className="flex-1 flex flex-col justify-center z-10 max-w-md mx-auto w-full">
        
        {!result ? (
          <div className="space-y-8 animate-in fade-in duration-1000">
            <div>
              <h1 className="text-2xl text-green-500 font-bold mb-2">&gt; INITIATING NIGHTLY SYNC</h1>
              <p className="text-xs text-green-500/60 leading-relaxed">
                Analyzing neural patterns. Identifying schedule deviations. Prioritizing consistency algorithms...
              </p>
            </div>

            {loading ? (
              <div className="text-green-500 text-sm animate-pulse">&gt; Loading Oracle matrix...</div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  {questions.map((q, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-green-500/50">0{i+1}.</span>
                      <p className="text-sm text-green-400">{q}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <textarea 
                    value={answers}
                    onChange={(e) => setAnswers(e.target.value)}
                    placeholder="Provide your context for tomorrow..."
                    className="w-full h-32 bg-green-950/20 border border-green-500/30 rounded p-4 text-sm text-green-400 focus:outline-none focus:border-green-500 resize-none font-sans"
                  />
                </div>

                <button 
                  onClick={handleSync}
                  disabled={processing || !answers}
                  className="w-full py-4 bg-green-500 text-black text-xs font-bold tracking-[0.2em] hover:bg-green-400 disabled:opacity-50 transition-colors"
                >
                  {processing ? "REPROGRAMMING TOMORROW..." : "EXECUTE SYNC"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
             <div className="border border-green-500/30 bg-green-900/10 p-6 rounded">
                <h2 className="text-xs text-green-500/60 tracking-[0.2em] mb-1">SYSTEM ADJUSTMENT</h2>
                <p className="text-sm text-green-400 leading-relaxed">
                  &gt; {result.leniency_adjustments}
                </p>
             </div>

             <div>
                <h3 className="text-xl text-green-500 font-bold mb-4">{result.tomorrow_theme}</h3>
                <div className="space-y-3">
                  {result.adjusted_tasks.map((task: any, idx: number) => (
                    <div key={idx} className="border-l-2 border-green-500 pl-4 py-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-bold text-white">{task.task_name}</span>
                        <span className="text-[10px] text-green-500 border border-green-500/30 px-2 py-0.5 rounded">+{task.xp_reward} XP</span>
                      </div>
                      <p className="text-xs text-white/50 font-sans">{task.reason}</p>
                    </div>
                  ))}
                </div>
             </div>

             <button 
                onClick={() => router.push('/home')}
                className="w-full mt-8 py-4 border border-green-500 text-green-500 text-xs font-bold tracking-[0.2em] hover:bg-green-500/10 transition-colors"
              >
                LOCK SYSTEM & SLEEP
              </button>
          </div>
        )}

      </div>
    </div>
  );
}
