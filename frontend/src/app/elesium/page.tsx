'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap, Target, TrendingUp, Mail, DollarSign, Calendar, RefreshCw, PenTool, Hash, Save, ShieldAlert, CheckCircle, Activity } from 'lucide-react';

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8001`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
};
const API_BASE = getApiBase();

export default function ElesiumPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Data
  const [summary, setSummary] = useState<any>(null);
  const [content, setContent] = useState<any>(null);
  const [pipelineStatus, setPipelineStatus] = useState<any>(null);

  // Forms
  const [outreachForm, setOutreachForm] = useState({ emails: 0, replies: 0, positive: 0 });
  const [contentForm, setContentForm] = useState({ carousels: 0, tweets: 0, threads: 0, notes: '', bestHook: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, conRes, pipelineRes] = await Promise.all([
        fetch(`${API_BASE}/api/elesium/summary`).then(r => r.json()),
        fetch(`${API_BASE}/api/elesium/content/summary`).then(r => r.json()),
        fetch(`${API_BASE}/api/elesium/content-pipeline/status`).then(r => r.json()).catch(() => null)
      ]);
      setSummary(sumRes);
      setContent(conRes);
      if (pipelineRes) setPipelineStatus(pipelineRes);
    } catch (err) {
      console.error('Elesium Data Load Error:', err);
      setStatusMessage({ type: 'error', text: 'HQ DISCONNECTED. FAILED TO LOAD METRICS.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogOutreach = async () => {
    if (outreachForm.emails <= 0 && outreachForm.replies <= 0) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      await fetch(`${API_BASE}/api/elesium/log-outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emails_sent: outreachForm.emails, 
          replies: outreachForm.replies, 
          positive: outreachForm.positive 
        })
      });
      setStatusMessage({ type: 'success', text: 'OUTREACH LOGGED SUCCESSFULLY.' });
      setOutreachForm({ emails: 0, replies: 0, positive: 0 });
      loadData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'FAILED TO LOG OUTREACH.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogContent = async () => {
    if (contentForm.carousels <= 0 && contentForm.tweets <= 0 && contentForm.threads <= 0) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      await fetch(`${API_BASE}/api/elesium/content/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carousels: contentForm.carousels,
          tweets: contentForm.tweets,
          threads: contentForm.threads,
          best_hook: contentForm.bestHook,
          notes: contentForm.notes,
        })
      });
      setStatusMessage({ type: 'success', text: 'CONTENT ARTIFACTS LOGGED.' });
      setContentForm({ carousels: 0, tweets: 0, threads: 0, notes: '', bestHook: '' });
      loadData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'FAILED TO LOG CONTENT.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="min-h-screen bg-[#020813] flex flex-col items-center justify-center font-mono gap-6">
        <div className="w-16 h-16 border border-cyan-500/20 border-t-cyan-500/80 rounded-full animate-spin" />
        <p className="text-cyan-400 text-xs tracking-[0.4em] animate-pulse">SYNCING ELESIUM HQ...</p>
      </div>
    );
  }

  const mrrTarget = summary?.phase_target_mrr || 1000;
  const mrrCurrent = summary?.mrr_proxy || 0;
  const mrrPct = Math.min(100, (mrrCurrent / mrrTarget) * 100);

  return (
    <div className="min-h-screen bg-[#020813] text-gray-300 font-mono relative pb-32 overflow-x-hidden">
      {/* Deep Cyber Aesthetic Overlays */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.05)_0%,transparent_50%)]" />
      <div className="scanline-overlay opacity-30" />

      <div className="px-4 pb-12 pt-safe max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-cyan-900/40 pb-5 gap-4">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-3 flex items-center gap-2 text-[10px] tracking-widest text-cyan-600 hover:text-cyan-400 transition-colors uppercase font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> BACK TO COMMAND
            </button>
            <h1 className="text-3xl font-heading text-cyan-400 tracking-[0.2em] drop-shadow-[0_0_12px_rgba(6,182,212,0.4)] flex items-center gap-3">
              <Zap className="w-8 h-8" /> ELESIUM
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <p className="text-[10px] text-cyan-700 tracking-widest uppercase">
                BUSINESS OPERATIONS & OUTREACH ENGINE
              </p>
            </div>
          </div>
          
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-cyan-950/30 border border-cyan-800/50 flex items-center gap-2 text-xs transition-colors hover:bg-cyan-900/50 hover:text-cyan-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> SYNC
          </button>
        </header>

        {statusMessage && (
          <div className={`p-4 text-xs font-bold border text-center uppercase tracking-widest ${
            statusMessage.type === 'error' 
              ? 'bg-red-950/40 border-red-900/50 text-red-400' 
              : 'bg-cyan-950/40 border-cyan-800/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
          }`}>
            {statusMessage.text}
          </div>
        )}

        {/* TOP ROW: North Star Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 bg-[#050c18] border border-cyan-900/40 p-5 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
            <div className="flex justify-between items-end mb-2 relative z-10">
              <div>
                <div className="text-[10px] text-cyan-600 tracking-[0.3em] uppercase mb-1 flex items-center gap-1.5">
                  <Target className="w-3 h-3" /> PHASE MRR TARGET
                </div>
                <div className="text-3xl font-bold text-white tracking-wider">${mrrCurrent}</div>
              </div>
              <div className="text-right">
                <div className="text-cyan-400 text-sm font-bold">${mrrTarget}</div>
                <div className="text-[9px] text-cyan-700 tracking-widest">GOAL</div>
              </div>
            </div>
            <div className="h-1.5 bg-cyan-950/50 rounded-full overflow-hidden mt-2 relative z-10">
              <div 
                className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all duration-1000"
                style={{ width: `${mrrPct}%` }}
              />
            </div>
          </div>

          <div className="bg-[#050c18] border border-cyan-900/40 p-5 flex flex-col justify-between">
            <div className="text-[10px] text-cyan-600 tracking-[0.3em] uppercase flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> TOTAL OUTREACH
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{summary?.outreach_7d ?? 0}</div>
              <div className="text-[9px] text-cyan-700 tracking-widest uppercase mt-1">LAST 7 DAYS</div>
            </div>
          </div>

          <div className="bg-[#050c18] border border-cyan-900/40 p-5 flex flex-col justify-between">
            <div className="text-[10px] text-cyan-600 tracking-[0.3em] uppercase flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" /> REPLY RATE
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{summary?.reply_rate ?? '0'}%</div>
              <div className="text-[9px] text-cyan-700 tracking-widest uppercase mt-1">CONVERSION</div>
            </div>
          </div>
        </div>

        {/* SPLIT VIEW: Outreach vs Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          
          {/* COLUMN 1: SALES & OUTREACH ENGINE */}
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-cyan-300 tracking-[0.3em] border-b border-cyan-900/50 pb-2 flex items-center gap-2 uppercase">
              <DollarSign className="w-4 h-4" /> SALES ENGINE
            </h2>
            
            <div className="bg-[#050c18] border border-cyan-900/30 p-5 space-y-4">
              <h3 className="text-xs text-cyan-600 tracking-widest uppercase mb-4">Log Daily Volume</h3>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[9px] text-cyan-700 uppercase tracking-widest block mb-1">Emails Sent</label>
                  <input 
                    type="number" min="0"
                    value={outreachForm.emails || ''}
                    onChange={e => setOutreachForm(prev => ({...prev, emails: parseInt(e.target.value) || 0}))}
                    className="w-full bg-[#020813] border border-cyan-900/50 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 text-center text-lg"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-cyan-700 uppercase tracking-widest block mb-1">Replies</label>
                  <input 
                    type="number" min="0"
                    value={outreachForm.replies || ''}
                    onChange={e => setOutreachForm(prev => ({...prev, replies: parseInt(e.target.value) || 0}))}
                    className="w-full bg-[#020813] border border-cyan-900/50 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 text-center text-lg"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-cyan-700 uppercase tracking-widest block mb-1">Positive</label>
                  <input 
                    type="number" min="0"
                    value={outreachForm.positive || ''}
                    onChange={e => setOutreachForm(prev => ({...prev, positive: parseInt(e.target.value) || 0}))}
                    className="w-full bg-[#020813] border border-cyan-900/50 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 text-center text-lg"
                  />
                </div>
              </div>

              <button
                onClick={handleLogOutreach}
                disabled={saving || (outreachForm.emails === 0 && outreachForm.replies === 0)}
                className="w-full py-3 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/50 text-cyan-300 font-bold text-xs tracking-[0.2em] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
              >
                <Save className="w-3.5 h-3.5" /> SYNC OUTREACH
              </button>
            </div>

            {/* Live Pipeline HUD */}
            {summary?.live?.is_connected ? (
              <div className="bg-[#050c18] border border-cyan-900/30 p-5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-cyan-500 tracking-widest uppercase mb-1 flex items-center gap-2">
                    <Activity className="w-3 h-3 animate-pulse" /> LIVE PIPELINE LINKED
                  </div>
                  <div className="text-xs text-white">Scraped Leads: {summary.live.leads_scraped_total}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-cyan-700 tracking-widest uppercase mb-1">Last Activity</div>
                  <div className="text-xs text-cyan-200">{summary.live.last_activity || '—'}</div>
                </div>
              </div>
            ) : (
              <div className="bg-red-950/10 border border-red-900/30 p-4 flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-red-500/70 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-red-400 font-bold tracking-widest mb-1">PIPELINE DISCONNECTED</div>
                  <div className="text-[10px] text-red-500/50 tracking-wider">No active CRM or scraping pipeline detected in the last 24h.</div>
                </div>
              </div>
            )}
          </div>

          {/* COLUMN 2: CONTENT CREATION ENGINE */}
          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-cyan-900/50 pb-2">
              <h2 className="text-sm font-bold text-cyan-300 tracking-[0.3em] flex items-center gap-2 uppercase">
                <PenTool className="w-4 h-4" /> CONTENT ENGINE
              </h2>
              {content?.streak?.current_days > 0 && (
                <div className="flex items-center gap-1.5 bg-cyan-950/50 px-2 py-1 border border-cyan-800/40 rounded">
                  <span className="text-[10px] font-bold text-cyan-400">{content.streak.current_days} DAY STREAK</span>
                  <span className="text-sm">🔥</span>
                </div>
              )}
            </div>

            <div className="bg-[#050c18] border border-cyan-900/30 p-5 space-y-4">
              <h3 className="text-xs text-cyan-600 tracking-widest uppercase mb-4">Log Content Output</h3>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[9px] text-cyan-700 uppercase tracking-widest block mb-1">Carousels</label>
                  <input 
                    type="number" min="0"
                    value={contentForm.carousels || ''}
                    onChange={e => setContentForm(prev => ({...prev, carousels: parseInt(e.target.value) || 0}))}
                    className="w-full bg-[#020813] border border-cyan-900/50 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 text-center text-lg"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-cyan-700 uppercase tracking-widest block mb-1">Tweets</label>
                  <input 
                    type="number" min="0"
                    value={contentForm.tweets || ''}
                    onChange={e => setContentForm(prev => ({...prev, tweets: parseInt(e.target.value) || 0}))}
                    className="w-full bg-[#020813] border border-cyan-900/50 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 text-center text-lg"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-cyan-700 uppercase tracking-widest block mb-1">Threads</label>
                  <input 
                    type="number" min="0"
                    value={contentForm.threads || ''}
                    onChange={e => setContentForm(prev => ({...prev, threads: parseInt(e.target.value) || 0}))}
                    className="w-full bg-[#020813] border border-cyan-900/50 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 text-center text-lg"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] text-cyan-700 uppercase tracking-widest block mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Best Hook Used
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Stop doing X if you want Y"
                  value={contentForm.bestHook}
                  onChange={e => setContentForm(prev => ({...prev, bestHook: e.target.value}))}
                  className="w-full bg-[#020813] border border-cyan-900/50 rounded px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <button
                onClick={handleLogContent}
                disabled={saving || (contentForm.carousels === 0 && contentForm.tweets === 0 && contentForm.threads === 0)}
                className="w-full py-3 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/50 text-cyan-300 font-bold text-xs tracking-[0.2em] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
              >
                <Save className="w-3.5 h-3.5" /> SYNC CONTENT
              </button>
            </div>

            {/* Content Stats Box */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#050c18] border border-cyan-900/30 p-4">
                <div className="text-[9px] text-cyan-600 tracking-widest uppercase mb-1">LIFETIME CAROUSELS</div>
                <div className="text-xl font-bold text-cyan-200">{content?.totals?.carousels ?? 0}</div>
              </div>
              <div className="bg-[#050c18] border border-cyan-900/30 p-4">
                <div className="text-[9px] text-cyan-600 tracking-widest uppercase mb-1">LONGEST STREAK</div>
                <div className="text-xl font-bold text-cyan-200">{content?.streak?.longest_days ?? 0}</div>
              </div>
            </div>
          </div>
          
        </div>

        {/* AUTOMATION ENGINE: DRIVE -> BUFFER */}
        <div className="mt-8 border border-cyan-900/40 bg-[#050c18] p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.03)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="flex justify-between items-center mb-6 border-b border-cyan-900/50 pb-3">
            <h2 className="text-sm font-bold text-cyan-300 tracking-[0.3em] flex items-center gap-2 uppercase">
              <Activity className="w-4 h-4 text-cyan-400" /> AUTOMATED CONTENT PIPELINE
            </h2>
            <div className="text-[10px] text-cyan-600 tracking-widest uppercase flex items-center gap-1.5">
               DRIVE <ArrowLeft className="w-3 h-3 rotate-180" /> BUFFER
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Health Meter */}
            <div className="md:col-span-1 space-y-2">
              <div className="text-[9px] text-cyan-700 tracking-widest uppercase">7-Day Buffer Health</div>
              <div className="flex items-end gap-3">
                <div className={`text-4xl font-bold ${
                  (pipelineStatus?.buffer_health_days ?? 0) >= 7 ? 'text-cyan-400' : 'text-red-400'
                }`}>
                  {pipelineStatus?.buffer_health_days ?? 0} <span className="text-lg text-cyan-700">/ 7</span>
                </div>
                <div className="text-[10px] uppercase text-cyan-700 pb-1">Days Scheduled</div>
              </div>
              
              <div className="h-1.5 w-full bg-cyan-950/50 rounded-full overflow-hidden mt-2">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    (pipelineStatus?.buffer_health_days ?? 0) >= 7 ? 'bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                  }`}
                  style={{ width: `${Math.min(100, ((pipelineStatus?.buffer_health_days ?? 0) / 7) * 100)}%` }}
                />
              </div>
            </div>

            {/* Queue Stats */}
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#020813] border border-cyan-900/30 p-3 flex flex-col justify-between">
                 <div className="text-[9px] text-cyan-600 tracking-widest uppercase">DETECTED (DRIVE)</div>
                 <div className="text-xl text-white font-bold">{pipelineStatus?.status_counts?.DETECTED ?? 0}</div>
              </div>
              <div className="bg-[#020813] border border-cyan-900/30 p-3 flex flex-col justify-between">
                 <div className="text-[9px] text-cyan-600 tracking-widest uppercase">UPLOADING</div>
                 <div className="text-xl text-cyan-300 font-bold flex items-center gap-2">
                    {pipelineStatus?.status_counts?.UPLOADING ?? 0}
                    {((pipelineStatus?.status_counts?.UPLOADING ?? 0) > 0 || (pipelineStatus?.status_counts?.DOWNLOADING ?? 0) > 0) && (
                      <RefreshCw className="w-3 h-3 animate-spin text-cyan-500" />
                    )}
                 </div>
              </div>
              <div className="bg-[#020813] border border-cyan-900/30 p-3 flex flex-col justify-between">
                 <div className="text-[9px] text-cyan-600 tracking-widest uppercase">SCHEDULED (BUFFER)</div>
                 <div className="text-xl text-white font-bold">{pipelineStatus?.status_counts?.SCHEDULED ?? 0}</div>
              </div>
              <div className="bg-red-950/10 border border-red-900/30 p-3 flex flex-col justify-between">
                 <div className="text-[9px] text-red-500/70 tracking-widest uppercase">FAILED</div>
                 <div className="text-xl text-red-400 font-bold">{pipelineStatus?.status_counts?.FAILED ?? 0}</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-cyan-900/30">
            <div className="flex items-center gap-2 text-[10px] text-cyan-700 tracking-widest uppercase mb-3">
              <CheckCircle className="w-3 h-3" /> System Status: <span className="text-cyan-500">Awaiting API Keys (Google Drive & Buffer) to activate worker loop.</span>
            </div>
          </div>
        </div>

      </div>
    </div>

  );
}
