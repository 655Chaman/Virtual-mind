'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Skull, RefreshCw, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { triggerHaptic } from '@/lib/utils';

export default function GraveyardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [postMortem, setPostMortem] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.graveyard.list();
      setProjects(res.projects || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleTouch = async (id: string) => {
    triggerHaptic('heavy');
    try {
      await api.graveyard.touch(id);
      setSelectedProject(null);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleKill = async (id: string) => {
    if (postMortem.length < 10) {
      alert("Post-mortem must be at least 10 characters.");
      return;
    }
    triggerHaptic('heavy');
    try {
      await api.graveyard.kill(id, postMortem);
      setSelectedProject(null);
      setPostMortem('');
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-gray-300 font-mono relative pb-10 overflow-x-hidden">
      <div className="scanline-overlay" />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-obsidian/95 backdrop-blur-sm border-b border-white/[0.04] px-4 py-4 pt-safe flex items-center gap-3">
        <button
          onClick={() => { triggerHaptic('light'); router.push('/'); }}
          className="p-2 -ml-2 text-text-dim hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-mono font-bold tracking-[0.3em] text-base flex items-center gap-2">
            <Skull className="w-4 h-4 text-red-500" />
            GRAVEYARD
          </h1>
          <p className="text-[9px] text-red-500/60 tracking-widest mt-0.5 uppercase">Kill or Commit. No ghosting.</p>
        </div>
      </header>

      <div className="px-4 pt-6 space-y-4">
        {loading ? (
          <p className="text-text-dim text-[10px] tracking-widest animate-pulse">LOADING GRAVEYARD...</p>
        ) : projects.length === 0 ? (
          <p className="text-text-dim text-[10px] tracking-widest">No projects tracked.</p>
        ) : (
          projects.map((p, i) => (
            <div 
              key={i} 
              className={`border p-4 transition-all duration-500 ${
                p.status === 'dead' ? 'border-white/[0.05] bg-surface/50 opacity-50' :
                p.flagged_for_graveyard ? 'border-red-500/40 bg-red-500/5 animate-pulse' :
                'border-white/[0.1] bg-surface'
              }`}
              onClick={() => {
                if (p.status !== 'dead') setSelectedProject(p);
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className={`text-sm font-bold tracking-wider ${p.flagged_for_graveyard ? 'text-red-500' : 'text-white'}`}>
                  {p.name}
                </h3>
                <span className={`text-[8px] tracking-[0.2em] px-2 py-0.5 border ${
                  p.status === 'dead' ? 'border-white/10 text-text-dim' :
                  p.flagged_for_graveyard ? 'border-red-500/50 text-red-500' : 'border-vm-green/50 text-vm-green'
                }`}>
                  {p.status.toUpperCase()}
                </span>
              </div>
              <p className="text-[10px] text-text-dim tracking-widest mb-1">
                LAST TOUCHED: {p.days_idle} DAYS AGO
              </p>
              {p.status === 'dead' && p.post_mortem && (
                <div className="mt-3 p-2 bg-black/40 border-l-2 border-text-dim/30">
                  <p className="text-[10px] text-text-dim italic">"{p.post_mortem}"</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm border border-red-500/30 bg-obsidian p-6 shadow-[0_0_40px_rgba(239,68,68,0.1)]">
            <h2 className="text-red-500 font-bold tracking-widest mb-2 text-center">KILL OR COMMIT</h2>
            <p className="text-white text-xs mb-6 text-center">{selectedProject.name} has been idle for {selectedProject.days_idle} days.</p>
            
            <div className="space-y-4">
              <button 
                onClick={() => handleTouch(selectedProject.id)}
                className="w-full py-3 bg-vm-green/10 border border-vm-green/40 text-vm-green text-[10px] tracking-[0.2em] font-bold hover:bg-vm-green/20 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> I COMMIT TO SHIPPING THIS
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                <div className="relative flex justify-center"><span className="bg-obsidian px-2 text-[8px] text-text-dim tracking-[0.2em]">OR DIE</span></div>
              </div>

              <div>
                <textarea 
                  value={postMortem}
                  onChange={(e) => setPostMortem(e.target.value)}
                  placeholder="Post-mortem. Why did it fail? Be honest..."
                  className="w-full h-24 bg-black/50 border border-white/10 text-xs p-3 text-white placeholder-text-dim focus:outline-none focus:border-red-500/50 font-mono mb-3"
                />
                <button 
                  onClick={() => handleKill(selectedProject.id)}
                  className="w-full py-3 bg-red-500/10 border border-red-500/40 text-red-500 text-[10px] tracking-[0.2em] font-bold hover:bg-red-500/20 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> KILL PROJECT
                </button>
              </div>
            </div>

            <button 
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 text-text-dim hover:text-white"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
