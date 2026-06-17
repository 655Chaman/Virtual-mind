'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { triggerHaptic } from '@/lib/utils';
import { ArrowLeft, Moon, Sparkles, Swords, Crown, Check, ChevronRight, Clock, Loader2 } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
interface QadrContext {
  target_date: string;
  day_name: string;
  is_friday: boolean;
  is_jummah: boolean;
  prayer_times: Record<string, string>;
  today_completion: {
    logged_today: boolean;
    prayers_completed: number;
    non_negotiables_met: number;
    non_negotiables_total: number;
    missed_items: string[];
  };
  streak: { overall_streak: number };
  workout_status: { is_rest_day: boolean; last_workout: string | null };
}

interface Question {
  id: string;
  question: string;
  subtext?: string;
  type: 'choice' | 'text';
  options?: string[];
  placeholder?: string;
  required: boolean;
  category: string;
}

interface ScheduleBlock {
  start: string;
  end: string;
  activity: string;
  pillar: string;
  icon: string;
  priority: string;
  duration_min: number;
}

interface Schedule {
  schedule_id: number;
  mode: string;
  label: string;
  description: string;
  blocks: ScheduleBlock[];
  tomorrow_score: number;
  total_productive_hours: number;
  wake_time: string;
  sleep_time: string;
}

// ── Phase enum ──────────────────────────────────────────────────────────────
type Phase = 'loading' | 'interview' | 'generating' | 'selection' | 'locked' | 'error';

// ── Pillar colors ───────────────────────────────────────────────────────────
const PILLAR_COLORS: Record<string, string> = {
  deen: '#c9a84c',
  business: '#a78bfa',
  fitness: '#4caa6e',
  wellness: '#4c7ec9',
  self: '#e2e8f0',
  logistics: '#f59e0b',
  rest: '#6b7280',
  food: '#f472b6',
};

const PILLAR_BG: Record<string, string> = {
  deen: 'rgba(201,168,76,0.12)',
  business: 'rgba(167,139,250,0.12)',
  fitness: 'rgba(76,170,110,0.12)',
  wellness: 'rgba(76,126,201,0.12)',
  self: 'rgba(226,232,240,0.08)',
  logistics: 'rgba(245,158,11,0.10)',
  rest: 'rgba(107,114,128,0.10)',
  food: 'rgba(244,114,182,0.10)',
};

// ── Category icons ──────────────────────────────────────────────────────────
const CATEGORY_EMOJI: Record<string, string> = {
  foundation: '',
  calibration: '',
  business: '',
  logistics: '',
  body: '',
  deen: '',
  self: '',
  wellness: '',
};

export default function QadrPage() {
  const router = useRouter();

  // Phase state
  const [phase, setPhase] = useState<Phase>('loading');
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Context
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [context, setContext] = useState<QadrContext | null>(null);

  // Interview
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  const [progress, setProgress] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionAnimating, setQuestionAnimating] = useState(false);
  const [typedText, setTypedText] = useState('');

  // Schedules
  const [warrior, setWarrior] = useState<Schedule | null>(null);
  const [king, setKing] = useState<Schedule | null>(null);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [viewingSchedule, setViewingSchedule] = useState<'warrior' | 'king'>('warrior');

  // Lock confirmation
  const [lockMessage, setLockMessage] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  interface Star {
    id: number;
    top: string;
    left: string;
    size: string;
    delay: string;
    duration: string;
  }
  const [stars, setStars] = useState<Star[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // Generate star coordinates once to avoid layout shifts on state updates
    const starList = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      top: (Math.random() * 40).toFixed(2) + '%',
      left: (Math.random() * 100).toFixed(2) + '%',
      size: (Math.random() * 2 + 1).toFixed(2) + 'px',
      delay: (Math.random() * 3).toFixed(2) + 's',
      duration: (3 + Math.random() * 4).toFixed(2) + 's',
    }));
    setStars(starList);
  }, []);

  // ── LOADING PHASE: Context Gathering ──────────────────────────────────────
  const LOADING_STEPS = [
    ' Fetching tomorrow\'s prayer times...',
    ' Analyzing today\'s performance...',
    ' Loading streak data...',
    ' Checking workout status...',
    ' Preparing questions...',
  ];

  useEffect(() => {
    if (phase !== 'loading') return;

    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, LOADING_STEPS.length - 1);
      setLoadingStep(stepIndex);
    }, 600);

    const startTime = Date.now();

    // Actually fetch context
    api.qadr.context().then(data => {
      setSessionId(data.session_id);
      setContext(data.context);
      setAnswers(data.answers_so_far || {});

      // Get questions
      return api.qadr.questions(data.session_id);
    }).then(qData => {
      setQuestions(qData.questions || []);
      setCurrentQuestion(qData.next_question || null);
      setProgress(qData.progress || 0);

      // Always show loading for at least 2 seconds so it doesn't feel abrupt
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 2000 - elapsed);

      setTimeout(() => {
        clearInterval(stepInterval);
        if (qData.complete) {
          // All questions already answered — go to generate
          setPhase('generating');
        } else {
          setPhase('interview');
        }
      }, remaining);
    }).catch(err => {
      console.error('Qadr context failed:', err);
      clearInterval(stepInterval);
      setErrorMsg(err.message || 'Failed to initialize Qadr Protocol.');
      setPhase('error');
    });

    return () => clearInterval(stepInterval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Typing animation for questions ────────────────────────────────────────
  useEffect(() => {
    if (!currentQuestion || phase !== 'interview') return;

    setQuestionAnimating(true);
    setTypedText('');
    const fullText = currentQuestion.question;
    let i = 0;

    const typeInterval = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typeInterval);
        setQuestionAnimating(false);
        // Only auto-focus after the first answer — prevents aggressive keyboard open on load
        if (Object.keys(answersRef.current).length > 0) {
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      }
    }, 22);

    return () => clearInterval(typeInterval);
  }, [currentQuestion, phase]);

  // ── Submit answer ─────────────────────────────────────────────────────────
  const submitAnswer = useCallback(async (answer: string) => {
    if (!sessionId || !currentQuestion || isSubmitting) return;

    triggerHaptic('light');
    setIsSubmitting(true);

    try {
      const result = await api.qadr.answer(sessionId, currentQuestion.id, answer);
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
      setProgress(result.progress);
      setTextInput('');

      if (result.complete) {
        // All done — generate schedules
        setCurrentQuestion(null);
        setTimeout(() => setPhase('generating'), 500);
      } else {
        if (result.next_question) {
          setQuestions(prev => {
            if (prev.some(q => q.id === result.next_question.id)) return prev;
            return [...prev, result.next_question];
          });
        }
        setCurrentQuestion(result.next_question);
      }
    } catch (err) {
      console.error('Answer submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, currentQuestion, isSubmitting]);

  // ── Generate schedules ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'generating' || !sessionId) return;

    const timer = setTimeout(async () => {
      try {
        const result = await api.qadr.generate(sessionId);
        setWarrior(result.warrior);
        setKing(result.king);
        setPhase('selection');
      } catch (err) {
        console.error('Schedule generation failed:', err);
      }
    }, 2000); // Show animation for at least 2 seconds

    return () => clearTimeout(timer);
  }, [phase, sessionId]);

  // ── Lock in schedule ──────────────────────────────────────────────────────
  const lockSchedule = async (mode: 'warrior' | 'king') => {
    if (!sessionId) return;
    const schedule = mode === 'warrior' ? warrior : king;
    if (!schedule) return;

    triggerHaptic('heavy');
    setSelectedMode(mode);

    try {
      const result = await api.qadr.select(sessionId, schedule.schedule_id);
      setLockMessage(result.message);
      setPhase('locked');
    } catch (err) {
      console.error('Lock failed:', err);
    }
  };

  // ── Scroll to bottom on new content ───────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [currentQuestion, phase]);

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════

  return (
    <main
      className="flex flex-col bg-[#050510] text-white overflow-hidden font-sans w-full h-full"
      style={{ position: 'fixed', inset: 0 }}
    >
      {/* Night sky gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 120% 80% at 50% -10%, rgba(79,70,160,0.15) 0%, rgba(30,20,80,0.08) 40%, transparent 70%)',
        }}
      />

      {/* Subtle stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {mounted && stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full"
            style={{
              width: star.size,
              height: star.size,
              background: 'rgba(255,255,255,0.4)',
              top: star.top,
              left: star.left,
              animation: `qadr-star-twinkle ${star.duration} ease-in-out infinite`,
              animationDelay: star.delay,
            }}
          />
        ))}
      </div>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="relative z-10 shrink-0 flex items-center justify-between px-5 pt-safe pb-4">
        <button
          onClick={() => { triggerHaptic('light'); router.back(); }}
          className="p-2 -ml-2 text-white/50 hover:text-white/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-indigo-400/80" />
          <span className="font-mono text-[10px] text-indigo-400/80 tracking-[0.25em] uppercase">
            Qadr Protocol
          </span>
        </div>

        <div className="w-9" />
      </header>

      {/* ── PHASE: ERROR ──────────────────────────────────────────────────── */}
      {phase === 'error' && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
            <span className="text-red-400 text-2xl"></span>
          </div>
          <h2 className="font-sans text-lg text-white/90 tracking-wide mb-3 text-center">
            Connection Failed
          </h2>
          <p className="font-mono text-xs text-red-400/80 text-center max-w-[250px] mb-8">
            {errorMsg || 'Could not reach the Qadr server.'}
          </p>
          <div className="flex flex-col gap-3 w-full max-w-[220px]">
            <button
              onClick={() => { triggerHaptic('light'); setPhase('loading'); setLoadingStep(0); setErrorMsg(null); }}
              className="px-6 py-3 rounded-md bg-indigo-600/30 border border-indigo-500/40 text-white/80 font-mono text-xs hover:bg-indigo-600/50 transition-colors tracking-wider"
            >
              RETRY
            </button>
            <button
              onClick={() => { triggerHaptic('light'); router.back(); }}
              className="px-6 py-3 rounded-md bg-white/5 border border-white/10 text-white/70 font-mono text-xs hover:bg-white/10 transition-colors"
            >
              RETURN TO COMMAND
            </button>
          </div>
        </div>
      )}

      {/* ── PHASE: LOADING ──────────────────────────────────────────────────── */}
      {phase === 'loading' && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          {/* Orb animation */}
          <div className="relative w-28 h-28 mb-10">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(129,104,255,0.3) 0%, rgba(79,70,160,0.1) 50%, transparent 70%)',
                animation: 'qadr-pulse 2s ease-in-out infinite',
              }}
            />
            <div
              className="absolute inset-4 rounded-full border border-indigo-500/30"
              style={{ animation: 'qadr-spin-slow 8s linear infinite' }}
            />
            <div
              className="absolute inset-8 rounded-full border border-indigo-400/20"
              style={{ animation: 'qadr-spin-slow 5s linear infinite reverse' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-indigo-400/80" />
            </div>
          </div>

          <h2 className="font-sans text-lg text-white/90 tracking-wide mb-8 text-center">
            Gathering Tomorrow&apos;s Intel
          </h2>

          <div className="w-full max-w-xs space-y-3">
            {LOADING_STEPS.map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-3 transition-all duration-500"
                style={{
                  opacity: i <= loadingStep ? 1 : 0.2,
                  transform: i <= loadingStep ? 'translateX(0)' : 'translateX(10px)',
                }}
              >
                {i < loadingStep ? (
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                ) : i === loadingStep ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 flex-shrink-0 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-white/10 flex-shrink-0" />
                )}
                <span className="font-mono text-xs text-white/60">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PHASE: INTERVIEW ────────────────────────────────────────────────── */}
      {phase === 'interview' && currentQuestion && (
        <div className="relative z-10 flex-1 flex flex-col min-h-0">
          
          {/* Sticky Progress bar at the top */}
          <div className="px-5 mb-2 shrink-0">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-[10px] text-indigo-400/60 tracking-widest uppercase">Progress</span>
              <span className="font-mono text-[10px] text-indigo-400/60">{progress}%</span>
            </div>
            <div className="h-[2px] bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
                }}
              />
            </div>
          </div>

          {/* Scrollable middle section for questions and chips */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-4">
            {/* Context chips (show relevant intel) */}
            {context && Object.keys(answers).length === 0 && (
              <div className="mb-6 flex flex-wrap gap-2 mt-4">
                <div className="px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5">
                  <span className="font-mono text-[10px] text-indigo-300/70">
                     {context?.day_name || ''} {context?.target_date || ''}
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5">
                  <span className="font-mono text-[10px] text-amber-300/70">
                     Fajr {context?.prayer_times?.Fajr || '05:00'}
                  </span>
                </div>
                {context?.streak?.overall_streak !== undefined && context.streak.overall_streak > 0 && (
                  <div className="px-3 py-1.5 rounded-full border border-green-500/20 bg-green-500/5">
                    <span className="font-mono text-[10px] text-green-300/70">
                       {context.streak.overall_streak} day streak
                    </span>
                  </div>
                )}
                {context?.is_jummah && (
                  <div className="px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10">
                    <span className="font-mono text-[10px] text-amber-300/90 font-bold">
                       JUMMAH TOMORROW
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Question card */}
            <div
              className="mt-4 mb-6 p-5 rounded-lg border border-indigo-500/15 bg-indigo-500/5"
              style={{
                animation: 'qadr-fade-up 0.4s ease-out both',
              }}
            >
              {/* Category badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">{CATEGORY_EMOJI[currentQuestion?.category || 'foundation'] || ''}</span>
                <span className="font-mono text-[9px] text-indigo-400/50 tracking-[0.2em] uppercase">
                  {currentQuestion?.category || 'foundation'}
                </span>
              </div>

              {/* Question text with typing effect & Markdown parsing */}
              <div className="flex flex-col items-center justify-center min-h-[140px] px-2 text-center">
                <p className="text-white text-[26px] leading-snug font-medium tracking-wide mb-2" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                  {typedText.split(/(\*\*.*?(?:\*\*|$))/g).map((part, i) => {
                    if (part.startsWith('**')) {
                      const inner = part.slice(2).replace(/\*\*$/, '');
                      return <strong key={i} className="text-indigo-400 font-bold drop-shadow-md">{inner}</strong>;
                    }
                    return <span key={i} className="text-white/90">{part}</span>;
                  })}
                  {questionAnimating && <span className="text-indigo-500 animate-pulse ml-1">|</span>}
                </p>
              </div>

              {/* Subtext */}
              {currentQuestion?.subtext && !questionAnimating && (
                <p className="font-mono text-[11px] text-white/30 mt-2 leading-relaxed" style={{ animation: 'qadr-fade-up 0.3s ease-out 0.1s both' }}>
                  {currentQuestion.subtext}
                </p>
              )}
            </div>

            {/* Answered questions trail */}
            {Object.keys(answers).length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/5 pb-4">
                <span className="font-mono text-[9px] text-white/20 tracking-[0.2em] uppercase mb-3 block">
                  Answered ({Object.keys(answers).length})
                </span>
                <div className="space-y-2">
                  {questions.filter(q => q && q.id && answers[q.id]).map(q => (
                    <div key={q.id} className="flex items-start gap-2 opacity-40">
                      <Check className="w-3 h-3 text-indigo-400/60 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-mono text-[10px] text-white/40 block">
                          {q.question?.replace(/\*\*/g, '') || ''}
                        </span>
                        <span className="font-mono text-[10px] text-indigo-400/50">{answers[q.id]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Anchored Bottom Answer area */}
          {!questionAnimating && (
            <div 
              className="px-5 pt-3 pb-safe shrink-0 border-t border-white/10 bg-[#050510]" 
              style={{ animation: 'qadr-fade-up 0.4s ease-out 0.2s both' }}
            >
              {/* Choice options */}
              {currentQuestion?.type === 'choice' && currentQuestion?.options && (
                <div className="space-y-2 mb-3">
                  {currentQuestion.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => submitAnswer(opt)}
                      disabled={isSubmitting}
                      className="w-full text-left px-4 py-3 rounded-md border border-white/8 bg-white/[0.03] hover:bg-indigo-500/10 hover:border-indigo-500/25 transition-all duration-200 group disabled:opacity-40"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-white/70 group-hover:text-white/90 transition-colors">
                          {opt}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-indigo-400/60 transition-all group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Text input */}
              {(currentQuestion?.type === 'text' || (currentQuestion?.type === 'choice' && currentQuestion?.options?.includes('Custom'))) && (
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && textInput.trim()) submitAnswer(textInput.trim());
                    }}
                    placeholder={currentQuestion?.placeholder || 'Type your answer...'}
                    className="flex-1 px-4 py-3 rounded-md border border-white/10 bg-white/[0.03] text-white/80 font-mono text-xs placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 transition-colors"
                  />
                  <button
                    onClick={() => textInput.trim() && submitAnswer(textInput.trim())}
                    disabled={isSubmitting || !textInput.trim()}
                    className="px-4 py-3 rounded-md bg-indigo-600/40 hover:bg-indigo-600/60 text-white/80 font-mono text-xs tracking-wider transition-colors disabled:opacity-30"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SEND'}
                  </button>
                </div>
              )}

              {/* Skip button for non-required */}
              {!currentQuestion?.required && (
                <button
                  onClick={() => submitAnswer('(skipped)')}
                  className="mt-2 w-full text-center font-mono text-[10px] text-white/20 hover:text-white/40 transition-colors py-2"
                >
                  Skip this question →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Fallback loader when interview has no active question */}
      {phase === 'interview' && !currentQuestion && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
          <p className="font-mono text-xs text-white/50">Calibrating next question...</p>
        </div>
      )}

      {/* ── PHASE: GENERATING ───────────────────────────────────────────────── */}
      {phase === 'generating' && (
        <div className="relative z-10 flex flex-col items-center justify-center px-6 pt-32">
          {/* Dual orb animation */}
          <div className="relative w-40 h-40 mb-10">
            {/* Warrior orb (left) */}
            <div
              className="absolute top-4 left-2 w-16 h-16 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
                animation: 'qadr-orbit-left 3s ease-in-out infinite',
              }}
            />
            {/* King orb (right) */}
            <div
              className="absolute top-4 right-2 w-16 h-16 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)',
                animation: 'qadr-orbit-right 3s ease-in-out infinite',
              }}
            />
            {/* Center merge */}
            <div
              className="absolute inset-8 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
                animation: 'qadr-pulse 1.5s ease-in-out infinite',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
            </div>
          </div>

          <h2 className="font-sans text-lg text-white/90 tracking-wide mb-3 text-center" style={{ fontFamily: 'var(--font-garamond), serif', fontSize: '22px' }}>
            Forging Your Schedule
          </h2>
          <p className="font-mono text-[11px] text-white/30 text-center max-w-[250px]">
            Building 2 battle plans for tomorrow...
          </p>
        </div>
      )}

      {/* ── PHASE: SELECTION ────────────────────────────────────────────────── */}
      {phase === 'selection' && warrior && king && (
        <div className="relative z-10 flex-1 w-full h-full min-h-0 px-4 pb-24 overflow-y-auto">
          {/* Title */}
          <div className="text-center mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-white/90 text-lg tracking-wide" style={{ fontFamily: 'var(--font-garamond), serif', fontSize: '22px' }}>
              Choose Your Mode
            </h2>
            <p className="font-mono text-[10px] text-white/30 mt-1 tracking-widest uppercase">
              {context?.day_name} · {context?.target_date}
            </p>
          </div>

          {/* Mode toggle tabs */}
          <div className="flex gap-2 mb-5 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <button
              onClick={() => { setViewingSchedule('warrior'); triggerHaptic('light'); }}
              className="flex-1 py-3 rounded-md border transition-all duration-300 font-mono text-xs tracking-wider"
              style={{
                borderColor: viewingSchedule === 'warrior' ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.06)',
                background: viewingSchedule === 'warrior' ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.02)',
                color: viewingSchedule === 'warrior' ? '#a78bfa' : 'rgba(255,255,255,0.3)',
              }}
            >
              <Swords className="w-4 h-4 mx-auto mb-1" />
              WARRIOR
            </button>
            <button
              onClick={() => { setViewingSchedule('king'); triggerHaptic('light'); }}
              className="flex-1 py-3 rounded-md border transition-all duration-300 font-mono text-xs tracking-wider"
              style={{
                borderColor: viewingSchedule === 'king' ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.06)',
                background: viewingSchedule === 'king' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.02)',
                color: viewingSchedule === 'king' ? '#f59e0b' : 'rgba(255,255,255,0.3)',
              }}
            >
              <Crown className="w-4 h-4 mx-auto mb-1" />
              KING
            </button>
          </div>

          {/* Active schedule card */}
          {(() => {
            const schedule = viewingSchedule === 'warrior' ? warrior : king;
            const accent = viewingSchedule === 'warrior' ? '#a78bfa' : '#f59e0b';
            const accentBg = viewingSchedule === 'warrior' ? 'rgba(139,92,246,0.08)' : 'rgba(245,158,11,0.08)';

            return (
              <div key={viewingSchedule} className="pb-8 animate-in fade-in zoom-in-95 duration-300">
                {(!schedule || typeof schedule !== 'object' || !schedule.blocks) && (
                  <div className="p-4 bg-red-500/20 text-red-200 text-xs rounded border border-red-500/50 mb-4 font-mono break-all overflow-auto">
                    DEBUG: Invalid schedule data. Type: {typeof schedule}.
                    Content: {JSON.stringify(schedule)}
                  </div>
                )}
                {/* Score + Meta */}
                <div
                  className="p-4 rounded-lg border mb-4"
                  style={{
                    borderColor: `${accent}25`,
                    background: accentBg,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: `${accent}90` }}>
                        {schedule.label}
                      </span>
                      <p className="font-mono text-[10px] text-white/30 mt-0.5">
                        {schedule.description}
                      </p>
                    </div>
                    <div className="text-center">
                      <div
                        className="text-2xl font-bold font-mono"
                        style={{ color: accent, textShadow: `0 0 20px ${accent}40` }}
                      >
                        {schedule.tomorrow_score}
                      </div>
                      <span className="font-mono text-[8px] text-white/30 tracking-[0.15em] uppercase">Score</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-white/30" />
                      <span className="font-mono text-[10px] text-white/40">
                        Wake {schedule.wake_time} → Sleep {schedule.sleep_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Swords className="w-3 h-3 text-white/30" />
                      <span className="font-mono text-[10px] text-white/40">
                        {schedule.total_productive_hours}h productive
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline blocks */}
                <div className="space-y-1 mb-6">
                  {schedule?.blocks?.map((block, i) => (
                    <div
                      key={i}
                      className="flex items-stretch gap-3 group"
                      style={{ animation: `qadr-fade-up 0.3s ease-out ${i * 0.03}s both` }}
                    >
                      {/* Time column */}
                      <div className="w-[52px] flex-shrink-0 text-right pt-2.5">
                        <span className="font-mono text-[10px] text-white/25">{block.start}</span>
                      </div>

                      {/* Timeline line */}
                      <div className="relative w-[2px] flex-shrink-0">
                        <div
                          className="absolute inset-0"
                          style={{
                            background: block.priority === 'critical'
                              ? PILLAR_COLORS[block.pillar] || '#6366f1'
                              : `${PILLAR_COLORS[block.pillar] || '#6366f1'}40`,
                          }}
                        />
                        <div
                          className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border"
                          style={{
                            borderColor: PILLAR_COLORS[block.pillar] || '#6366f1',
                            background: block.priority === 'critical'
                              ? PILLAR_COLORS[block.pillar]
                              : '#050510',
                          }}
                        />
                      </div>

                      {/* Block content */}
                      <div
                        className="flex-1 px-3 py-2 rounded-md border transition-colors mb-0.5"
                        style={{
                          borderColor: block.priority === 'critical'
                            ? `${PILLAR_COLORS[block.pillar] || '#6366f1'}30`
                            : 'rgba(255,255,255,0.04)',
                          background: block.priority === 'critical'
                            ? PILLAR_BG[block.pillar] || 'rgba(99,102,241,0.05)'
                            : 'rgba(255,255,255,0.015)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{block.icon}</span>
                          <span
                            className="font-mono text-[11px] leading-tight flex-1"
                            style={{
                              color: block.priority === 'critical'
                                ? PILLAR_COLORS[block.pillar] || '#c9a84c'
                                : 'rgba(255,255,255,0.55)',
                            }}
                          >
                            {block.activity}
                          </span>
                          <span className="font-mono text-[9px] text-white/15">{block.duration_min}m</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Lock in button */}
                <button
                  onClick={() => lockSchedule(viewingSchedule)}
                  className="w-full py-4 rounded-lg border font-mono text-sm tracking-[0.15em] uppercase transition-all duration-300 hover:scale-[1.01] active:scale-[0.98]"
                  style={{
                    borderColor: `${accent}40`,
                    background: `linear-gradient(180deg, ${accent}15 0%, ${accent}08 100%)`,
                    color: accent,
                    boxShadow: `0 0 30px ${accent}10`,
                  }}
                >
                  Lock In {viewingSchedule === 'warrior' ? ' Warrior' : ' King'} Mode
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Fallback loader when selection has missing warrior/king schedules */}
      {phase === 'selection' && (!warrior || !king) && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
          <p className="font-mono text-xs text-white/50">Forging schedules...</p>
        </div>
      )}

      {/* ── PHASE: LOCKED IN ────────────────────────────────────────────────── */}
      {phase === 'locked' && (
        <div className="relative z-10 flex flex-col items-center justify-center px-8 pt-28">
          {/* Success orb */}
          <div className="relative w-24 h-24 mb-8">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: selectedMode === 'warrior'
                  ? 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)',
                animation: 'qadr-pulse 2s ease-in-out infinite',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              {selectedMode === 'warrior' ? (
                <Swords className="w-10 h-10 text-violet-400/80" />
              ) : (
                <Crown className="w-10 h-10 text-amber-400/80" />
              )}
            </div>
          </div>

          <div
            className="text-center"
            style={{
              animation: 'qadr-fade-up 0.6s ease-out',
            }}
          >
            <h2
              className="text-2xl text-white/90 mb-3"
              style={{ fontFamily: 'var(--font-garamond), serif' }}
            >
              Tomorrow Is Set
            </h2>
            <p className="font-mono text-xs text-white/30 max-w-[280px] leading-relaxed mb-8">
              {lockMessage || `${selectedMode === 'warrior' ? ' WARRIOR' : ' KING'} mode locked. Sleep well, soldier.`}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/home')}
                className="w-full py-3 rounded-md border border-white/10 bg-white/[0.03] font-mono text-xs text-white/50 hover:text-white/70 transition-colors tracking-widest uppercase"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
