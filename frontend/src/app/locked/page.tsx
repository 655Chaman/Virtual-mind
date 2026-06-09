'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getDailyQuote } from '@/lib/quotes';

const DAILY_HADITH = [
  "Whoever does not abandon falsehood in word and deed, Allah has no need of his abandoning food and drink. — Bukhari",
  "Take advantage of five before five: your youth before old age, your health before illness, your wealth before poverty, your free time before preoccupation, your life before death. — Ibn Abbas",
  "Be in this world as if you were a stranger or a traveler passing through. — Bukhari",
  "The strong person is not the one who can wrestle someone else down. The strong person is the one who can control himself when he is angry. — Bukhari",
  "Verily, with hardship comes ease. — Quran 94:6",
];

export default function LockedPage() {
  const router = useRouter();
  const [today, setToday] = useState('');
  const [phaseDay, setPhaseDay] = useState(0);
  const [daysToCheckpoint, setDaysToCheckpoint] = useState(0);
  const [hadith, setHadith] = useState('');
  const [scanline, setScanline] = useState(true);
  const [dailyQuote, setDailyQuote] = useState('NO MAN RUNS BEHIND MOTIVATION. HE IS FUELED BY RESPONSIBILITY.');

  useEffect(() => {
    const now = new Date();
    setToday(now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    const phaseStart = new Date('2026-02-22');
    const checkpoint = new Date('2026-05-22');
    const day = Math.max(0, Math.floor((now.getTime() - phaseStart.getTime()) / 86400000));
    const remaining = Math.max(0, Math.floor((checkpoint.getTime() - now.getTime()) / 86400000));
    setPhaseDay(day);
    setDailyQuote(getDailyQuote(day));
    setDaysToCheckpoint(remaining);
    setHadith(DAILY_HADITH[day % DAILY_HADITH.length]);
    // Scanline flicker effect
    setTimeout(() => setScanline(false), 800);
    setTimeout(() => setScanline(true), 900);
  }, []);

  return (
    <main className="relative min-h-screen bg-obsidian flex flex-col items-center justify-center overflow-hidden font-mono">

      {/* CRT Scanlines */}
      <div className="pointer-events-none absolute inset-0 z-50 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.15)_0px,rgba(0,0,0,0.15)_1px,transparent_1px,transparent_2px)] opacity-40" />

      {/* Grid background */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none" />

      {/* Red glow from center */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,rgba(201,76,76,0.08)_0%,transparent_65%)]" />

      {/* Top HUD bar */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-8 py-4 border-b border-vm-red/20 z-10">
        <div className="flex flex-col gap-0.5">
          <p className="text-[10px] tracking-[0.4em] text-vm-red/60">VIRTUAL MIND 2.0</p>
          <p className="text-[10px] tracking-[0.3em] text-text-dim/40">SYS.LOCK // ACCESS DENIED</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-vm-red animate-ping" />
          <span className="text-[10px] text-vm-red tracking-widest">SYSTEM SECURED</span>
        </div>
      </div>

      {/* Phase counter top-right */}
      <div className="absolute top-16 right-8 text-right z-10">
        <p className="text-[10px] text-text-dim tracking-widest">PHASE 0 — DAY</p>
        <p className="text-4xl font-heading text-vm-red drop-shadow-[0_0_20px_rgba(201,76,76,0.4)]">{phaseDay}</p>
        <p className="text-[10px] text-text-dim tracking-widest mt-1">{daysToCheckpoint} DAYS TO CHECKPOINT</p>
      </div>

      {/* Core content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl px-8">

        {/* Lock icon */}
        <div className="mb-8 relative">
          <div className="w-20 h-20 border-2 border-vm-red/50 flex items-center justify-center mb-2 mx-auto relative overflow-hidden group">
            <div className="absolute inset-0 bg-vm-red/5 group-hover:bg-vm-red/10 transition-colors" />
            <svg className="w-10 h-10 text-vm-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div className="absolute -inset-4 rounded-full border border-vm-red/10 animate-ping" style={{ animationDuration: '3s' }} />
        </div>

        {/* Status code */}
        <p className="text-vm-red/60 text-[10px] tracking-[0.5em] mb-4">ERR::0x44 — DAILY_LOG_NOT_FILED</p>

        {/* Main headline */}
        <h1 className="text-4xl md:text-6xl font-heading text-vm-red tracking-[0.15em] mb-2 drop-shadow-[0_0_30px_rgba(201,76,76,0.3)]">
          ACCESS DENIED
        </h1>
        <p className="text-text-dim text-sm tracking-[0.3em] mb-8">THE COMMAND CENTER REQUIRES PROOF OF OPERATION</p>

        {/* Divider */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-vm-red/40 to-transparent mb-8" />

        {/* Today */}
        <p className="text-gold-dim text-xs tracking-widest mb-2">{today}</p>

        {/* Hadith */}
        <blockquote className="text-text-dim text-sm leading-relaxed italic border-l-2 border-gold/30 pl-4 text-left mb-10">
          {hadith}
        </blockquote>

        {/* CTA */}
        <button
          id="file-log-btn"
          onClick={() => router.push('/log')}
          className="group relative px-12 py-4 border border-vm-red/60 hover:border-vm-red text-vm-red hover:text-white hover:bg-vm-red/20 tracking-[0.4em] text-sm font-bold transition-all duration-300 overflow-hidden"
        >
          <span className="relative z-10">FILE YOUR LOG</span>
          <div className="absolute inset-0 bg-vm-red/0 group-hover:bg-vm-red/10 transition-colors" />
        </button>

        <p className="text-text-dim/40 text-[10px] tracking-widest mt-6">
          {dailyQuote}
        </p>
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-between px-8 z-10">
        <p className="text-[10px] text-text-dim/30 tracking-widest">NAFS AL-AMMORAH MONITORING ACTIVE</p>
        <p className="text-[10px] text-text-dim/30 tracking-widest">A.O.S. 2.0 // KERNEL STANDBY</p>
      </div>
    </main>
  );
}
