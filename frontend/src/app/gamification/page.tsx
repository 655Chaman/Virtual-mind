'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Gamification() {
  const router = useRouter();
  const [xp, setXp] = useState(1450);
  const [screenTimeMinutes, setScreenTimeMinutes] = useState(0);
  const [activeTab, setActiveTab] = useState<'STAKES' | 'STORE'>('STAKES');

  const [wagerTask, setWagerTask] = useState('');
  const [wagerXp, setWagerXp] = useState('');

  const buyScreenTime = () => {
    if (xp >= 100) {
      setXp(x => x - 100);
      setScreenTimeMinutes(m => m + 15);
    }
  };

  const lockStake = () => {
    const val = parseInt(wagerXp);
    if (!wagerTask.trim() || isNaN(val) || val < 100) {
      alert("Minimum stake is 100 XP.");
      return;
    }
    // In production, this posts to /api/xp/lock
    setWagerTask('');
    setWagerXp('');
  };

  return (
    <div className="min-h-[100dvh] w-full bg-black text-white overflow-y-auto font-sans pb-20">
      
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.push('/home')} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition-transform">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#FF3366]">THE CRUCIBLE</span>
          <span className="text-xl font-black tracking-widest">{xp} XP</span>
        </div>
      </div>

      {/* TABS */}
      <div className="px-6 py-6 flex gap-4">
        <button 
          onClick={() => setActiveTab('STAKES')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold tracking-[0.1em] transition-all duration-300 ${activeTab === 'STAKES' ? 'bg-[#FF3366] text-white shadow-[0_0_20px_rgba(255,51,102,0.4)]' : 'bg-white/5 text-white/50 border border-white/10'}`}
        >
          PAIN OF LOSS
        </button>
        <button 
          onClick={() => setActiveTab('STORE')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold tracking-[0.1em] transition-all duration-300 ${activeTab === 'STORE' ? 'bg-[#22D3EE] text-black shadow-[0_0_20px_rgba(34,211,238,0.4)]' : 'bg-white/5 text-white/50 border border-white/10'}`}
        >
          XP STORE
        </button>
      </div>

      <div className="px-6">
        
        {activeTab === 'STAKES' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 relative overflow-hidden">
              <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-[#FF3366]/20 rounded-full blur-[50px]"></div>
              <h2 className="text-sm font-bold tracking-[0.2em] text-white/60 mb-2">ACTIVE WAGER</h2>
              <h3 className="text-3xl font-black text-white mb-1">Deep Work Block</h3>
              <p className="text-sm text-white/50 mb-6">Complete 2 hours of focused work before 5 PM.</p>
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-black/50 border border-red-500/30 mb-6">
                <div>
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-red-400 mb-1">AT STAKE</span>
                  <span className="block text-xl font-black text-white">-500 XP</span>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 text-xs font-bold tracking-[0.1em] text-white/50 hover:bg-white/10">FORFEIT</button>
                <button className="flex-1 py-4 rounded-xl bg-white text-black text-xs font-bold tracking-[0.1em] hover:bg-gray-200">VALIDATE WORK</button>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h2 className="text-sm font-bold tracking-[0.2em] text-white/60 mb-4">NEW WAGER</h2>
              <div className="flex flex-col gap-4">
                <input 
                  type="text" 
                  value={wagerTask}
                  onChange={(e) => setWagerTask(e.target.value)}
                  placeholder="What is the task?" 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-[#FF3366]" 
                />
                <div className="flex items-center gap-4">
                  <input 
                    type="number" 
                    value={wagerXp}
                    onChange={(e) => setWagerXp(e.target.value)}
                    placeholder="Min 100 XP" 
                    className="w-1/2 bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-[#FF3366]" 
                  />
                  <button 
                    onClick={lockStake}
                    className="w-1/2 py-4 rounded-xl bg-[#FF3366] text-white text-xs font-bold tracking-[0.1em] shadow-[0_0_15px_rgba(255,51,102,0.3)] hover:scale-105 transition-transform"
                  >
                    LOCK STAKE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'STORE' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="flex flex-col items-center justify-center mb-2">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2" className="mb-2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
               <h2 className="text-xl font-black tracking-[0.3em] text-[#22D3EE]">XP STORE</h2>
            </div>

            <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-b from-[#22D3EE]/20 to-black border border-[#22D3EE]/30 relative overflow-hidden">
               <span className="text-[10px] font-bold tracking-[0.2em] text-[#22D3EE] mb-2 z-10">AVAILABLE SCREEN TIME</span>
               <span className="text-7xl font-black text-white tracking-tighter z-10">{screenTimeMinutes}<span className="text-3xl text-white/50 ml-2">m</span></span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={buyScreenTime} className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 active:scale-95 transition-all">
                <span className="text-2xl font-black text-white mb-1">+15m</span>
                <span className="text-[10px] font-bold tracking-[0.1em] text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-1 rounded">COST: 100 XP</span>
              </button>
              <button className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 active:scale-95 transition-all opacity-50">
                <span className="text-2xl font-black text-white mb-1">+1hr</span>
                <span className="text-[10px] font-bold tracking-[0.1em] text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-1 rounded">COST: 350 XP</span>
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mt-6">
              <h2 className="text-sm font-bold tracking-[0.2em] text-white/60 mb-4">START CARDS (MODIFIERS)</h2>
              <div className="space-y-3">
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-transparent border border-purple-500/30">
                  <div>
                    <span className="block text-sm font-bold text-white mb-1">Deep State</span>
                    <span className="block text-[10px] text-white/60 uppercase">1.5x XP for next 2 hours</span>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-purple-500 text-white text-[10px] font-bold tracking-[0.1em]">ACTIVATE</button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-transparent border border-orange-500/30">
                  <div>
                    <span className="block text-sm font-bold text-white mb-1">Forgiveness</span>
                    <span className="block text-[10px] text-white/60 uppercase">Cancel 1 failed wager</span>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-orange-500 text-white text-[10px] font-bold tracking-[0.1em]">USE (1 LEFT)</button>
                </div>

                {/* BANKRUPTCY PROTOCOL */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-red-900/40 to-transparent border border-red-500/50 mt-4">
                  <div>
                    <span className="block text-sm font-bold text-red-500 mb-1">Bankruptcy Protocol</span>
                    <span className="block text-[10px] text-white/60 uppercase">Reset 300% Tax via 500 Pushups</span>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-red-900/80 border border-red-500 text-red-200 text-[10px] font-bold tracking-[0.1em] hover:bg-red-500 hover:text-white transition-colors">INITIATE PLEDGE</button>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
