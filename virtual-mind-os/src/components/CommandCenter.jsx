import React, { useState, useEffect, Suspense } from 'react';
import { View, PerspectiveCamera, Environment } from '@react-three/drei';
import Brain from './Brain';
import PillarCard from './PillarCard';
import DailyLogModal from './DailyLogModal';
import CalendarView from './CalendarView';
import { differenceInDays, format } from 'date-fns';

const PILLARS = [
  { id: 0, name: 'DEEN', subtitle: 'SPIRITUAL ANCHOR', color: '#c9a84c' },
  { id: 1, name: 'ELESIUM', subtitle: 'ECONOMIC POWER', color: '#4c7ec9' },
  { id: 2, name: 'INFLUENCE', subtitle: 'STRATEGIC DOMINANCE', color: '#c94c4c' },
  { id: 3, name: 'SELF', subtitle: 'PHYSICAL EXCELLENCE', color: '#4caa6e' },
];

const CommandCenter = () => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [logs, setLogs] = useState(() => JSON.parse(localStorage.getItem('virtual_mind_logs') || '{}'));
  const [now, setNow] = useState(new Date());
  const [elesiumMetrics, setElesiumMetrics] = useState({
    emailsSentToday: 0,
    emailsSentTotal: 0,
    mrrUsd: 0,
    mrrTarget: 1000,
    daysSinceFirstEmail: 'NEVER SENT',
    hasError: false
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    
    const fetchElesium = async () => {
      try {
        const metRes = await fetch('http://localhost:8000/api/elesium/metrics');
        const accRes = await fetch('http://localhost:8000/api/elesium/accountability');
        if (metRes.ok && accRes.ok) {
          const metrics = await metRes.json();
          const acc = await accRes.json();
          setElesiumMetrics({
            emailsSentToday: metrics.emails_sent_today || 0,
            emailsSentTotal: metrics.emails_sent_total || 0,
            mrrUsd: metrics.mrr_usd || 0,
            mrrTarget: metrics.mrr_target || 1000,
            daysSinceFirstEmail: acc.days_since_first_email,
            hasError: false
          });
        }
      } catch (err) {
        setElesiumMetrics(prev => ({ ...prev, hasError: true }));
      }
    };
    
    fetchElesium();
    const interval = setInterval(fetchElesium, 300000);
    
    return () => {
      clearInterval(timer);
      clearInterval(interval);
    };
  }, []);

  const phaseStart = new Date('2026-02-22');
  const checkpointDate = new Date('2026-05-22');
  const dayInPhase = differenceInDays(now, phaseStart);
  const daysToCheckpoint = differenceInDays(checkpointDate, now);
  
  const todayStr = now.toLocaleDateString('en-CA');
  const submittedToday = !!logs[todayStr];
  
  const secondsToMidnight = () => {
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.floor((midnight - now) / 1000);
  };

  const formatCountdown = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateStreak = (pillarId) => {
    let streak = 0;
    let d = new Date(now);
    const dateStr = d.toLocaleDateString('en-CA');
    if (!logs[dateStr] || !logs[dateStr].folders.includes(pillarId)) {
        d.setDate(d.getDate() - 1);
    }
    
    while (true) {
      const dateStr = d.toLocaleDateString('en-CA');
      if (logs[dateStr] && logs[dateStr].folders.includes(pillarId)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const handleLogSubmit = async (data) => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const logEntry = { ...data, date: todayStr, timestamp: new Date().toISOString() };
    const updatedLogs = { ...logs, [todayStr]: logEntry };
    
    setLogs(updatedLogs);
    localStorage.setItem('virtual_mind_logs', JSON.stringify(updatedLogs));
    
    try {
      await fetch('http://localhost:8000/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      });
    } catch (err) {
      console.error("Failed to sync", err);
    }
    
    setShowLogModal(false);
  };

  if (selectedFolder !== null) {
    return (
      <CalendarView 
        pillar={PILLARS[selectedFolder]} 
        logs={logs} 
        onBack={() => setSelectedFolder(null)} 
      />
    );
  }

  return (
    <div className="hud-container">
      {/* Background Grid Overlay */}
      <div className="hud-background-grid" />
      
      {/* Absolute Header Overlay */}
      <header className="hud-header">
        <div className="phase-indicator">
          <span className="mono-text">PHASE 0 — BECOME UNDENIABLE</span>
          <span className="day-count">DAY {dayInPhase}</span>
        </div>
        <div className="current-date mono-text">
          {format(now, 'EEE, MMM dd, yyyy').toUpperCase()}
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="hud-grid">
        
        {/* Left Column: Metrics & Status */}
        <div className="hud-column left-col">
          
          <div className="glass-panel elesium-panel">
            <div className="panel-corner top-left" />
            <div className="panel-header">
               <span className="mono-text">ELESIUM LOGIC</span>
               <span className={`days-counter ${elesiumMetrics.daysSinceFirstEmail === 'NEVER SENT' ? 'danger' : ''}`}>
                 {elesiumMetrics.daysSinceFirstEmail === 'NEVER SENT' 
                    ? 'FLAW #1: NO OUTBOUND' 
                    : `${elesiumMetrics.daysSinceFirstEmail} D SINC OUTBOUND`}
               </span>
            </div>
            <div className="metrics-grid">
              <div className="metric">
                <label>EMAILS TODAY</label>
                <span className="value">{elesiumMetrics.emailsSentToday}</span>
              </div>
              <div className="metric">
                <label>TOTAL SENT</label>
                <span className="value">{elesiumMetrics.emailsSentTotal}</span>
              </div>
            </div>
            <div className="metric-row mrr-box">
              <div className="mrr-labels">
                <label>MRR (${elesiumMetrics.mrrUsd} / ${elesiumMetrics.mrrTarget})</label>
              </div>
              <div className="progress-bg">
                <div className="progress-fill" style={{ width: `${Math.min((elesiumMetrics.mrrUsd / elesiumMetrics.mrrTarget) * 100, 100)}%`}}></div>
              </div>
            </div>
          </div>

          <div className={`glass-panel status-banner ${submittedToday ? 'submitted' : 'pending'}`}>
            <div className="panel-corner top-right" />
            <div className="status-top">
              <div className="status-label">
                {submittedToday ? 'SYSTEM: OPERATIONAL' : 'SYSTEM: LOG REQUIRED'}
              </div>
              <div className="countdown">
                {submittedToday ? 'LOGGED' : `DL: ${formatCountdown(secondsToMidnight())}`}
              </div>
            </div>
            {!submittedToday && (
              <button className="log-btn" onClick={() => setShowLogModal(true)}>
                SUBMIT DAILY LOG
              </button>
            )}
          </div>

        </div>

        {/* Center Canvas: The Brain (The Singularity) */}
        <div className="hud-center">
          <div className="brain-viewport-frame">
            {/* HUD Targeting Frames */}
            <div className="targeting-corners">
               <div className="corner tl" />
               <div className="corner tr" />
               <div className="corner bl" />
               <div className="corner br" />
            </div>
            <div className="crosshair-v" />
            <div className="crosshair-h" />
            
            <div className="brain-wrapper">
               <div className="brain-glow-ring"></div>
               <View className="three-view">
                 <ambientLight intensity={0.5} />
                 <pointLight position={[10, 10, 10]} intensity={2} color="#c9a84c" />
                 <pointLight position={[-10, 0, -10]} intensity={1} color="#ff4444" />
                <Suspense fallback={null}>
                  <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={45} />
                  <Brain radius={3.5} />
                  <Environment preset="city" />
                </Suspense>
               </View>
            </div>
          </div>
        </div>

        {/* Right Column: The 4 Pillars Grid */}
        <div className="hud-column right-col">
          <div className="pillars-grid-hud">
            {PILLARS.map((p) => (
              <PillarCard 
                key={p.id}
                id={p.id}
                name={p.name}
                subtitle={p.subtitle}
                streak={calculateStreak(p.id)}
                onClick={() => setSelectedFolder(p.id)}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Telemetry Bar */}
      <footer className="telemetry-bar">
        <div className="t-stat">
          <label>TOTAL LOGS</label>
          <span>{Object.keys(logs).length}</span>
        </div>
        <div className="t-stat highlight">
          <label>GLOBAL STREAK</label>
          <span>{calculateStreak(0) + calculateStreak(1) + calculateStreak(2) + calculateStreak(3)}</span>
        </div>
        <div className="t-stat">
          <label>PHASE 0 PROGRESS</label>
          <span>DAY {dayInPhase}</span>
        </div>
        <div className="t-stat">
          <label>TO CHECKPOINT</label>
          <span>{daysToCheckpoint}D</span>
        </div>
      </footer>

      {showLogModal && (
        <DailyLogModal 
          onClose={() => setShowLogModal(false)} 
          onSubmit={handleLogSubmit}
        />
      )}

      <style jsx>{`
        .hud-container {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          background: #030303;
        }

        .hud-background-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(201, 168, 76, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201, 168, 76, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
          z-index: 1;
        }

        .hud-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2.5rem;
          position: absolute;
          top: 0; left: 0; right: 0;
          z-index: 10;
          background: linear-gradient(to bottom, rgba(3,3,3,0.95) 0%, transparent 100%);
          pointer-events: none;
        }

        .phase-indicator {
          display: flex;
          gap: 1.5rem;
          align-items: center;
          text-shadow: 0 0 15px rgba(201,168,76,0.4);
        }

        .day-count {
          color: var(--gold);
          font-size: 1.2rem;
          font-weight: bold;
          border-left: 1px solid var(--gold-dim);
          padding-left: 1rem;
        }
        .hud-grid {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-columns: 400px 1fr 400px;
          gap: 3rem;
          padding: 7rem 4rem;
          align-items: center;
          z-index: 2;
        }

        .hud-column {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          height: 100%;
          justify-content: center;
          animation: slideInSide 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .left-col { transform: translateX(-60px); opacity: 0; }
        .right-col { transform: translateX(60px); opacity: 0; }

        @keyframes slideInSide {
          to { transform: translateX(0); opacity: 1; }
        }

        .glass-panel {
          position: relative;
          background: rgba(10, 10, 12, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(201, 168, 76, 0.15);
          padding: 2rem;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6), inset 0 0 40px rgba(201,168,76,0.02);
          transition: var(--transition-normal);
        }

        .panel-corner {
          position: absolute;
          width: 10px;
          height: 10px;
          border-color: var(--gold);
          border-style: solid;
        }
        .top-left { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
        .top-right { top: -1px; right: -1px; border-width: 2px 2px 0 0; }

        .glass-panel:hover {
          border-color: rgba(201, 168, 76, 0.4);
          transform: scale(1.02);
          box-shadow: 0 25px 80px rgba(0,0,0,0.8), inset 0 0 50px rgba(201,168,76,0.05);
        }

        /* Center Section: The Master HUD */
        .hud-center {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .brain-viewport-frame {
          position: relative;
          width: 700px;
          height: 700px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .targeting-corners {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .corner {
          position: absolute;
          width: 60px;
          height: 60px;
          border: 1px solid rgba(201, 168, 76, 0.4);
        }
        .tl { top: -10px; left: -10px; border-right: none; border-bottom: none; }
        .tr { top: -10px; right: -10px; border-left: none; border-bottom: none; }
        .bl { bottom: -10px; left: -10px; border-right: none; border-top: none; }
        .br { bottom: -10px; right: -10px; border-left: none; border-top: none; }

        .crosshair-v, .crosshair-h {
          position: absolute;
          background: rgba(201, 168, 76, 0.15);
          pointer-events: none;
        }
        .crosshair-v { width: 1px; height: 100%; left: 50%; }
        .crosshair-h { height: 1px; width: 100%; top: 50%; }

        .brain-wrapper {
          width: 700px;
          height: 700px;
          position: relative;
          z-index: 5;
        }

        .three-view {
          width: 100%;
          height: 100%;
        }

        .pillars-grid-hud {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }

        /* Telemetry Bar */
        .telemetry-bar {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          display: flex;
          justify-content: space-between;
          padding: 1.5rem 4rem;
          background: rgba(3, 3, 3, 0.95);
          border-top: 1px solid rgba(201, 168, 76, 0.1);
          backdrop-filter: blur(15px);
          z-index: 10;
        }

        .t-stat {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .t-stat label {
          font-size: 0.65rem;
          color: var(--text-muted);
          letter-spacing: 0.3em;
        }

        .t-stat span {
          font-size: 1.2rem;
          color: var(--text);
          font-family: var(--font-mono);
          text-shadow: 0 0 15px rgba(255,255,255,0.1);
        }

        .t-stat.highlight span {
          color: var(--gold);
          font-weight: bold;
          text-shadow: 0 0 20px rgba(201,168,76,0.3);
        }

        /* Custom spacing for cards */
        :global(.pillar-card) {
          margin-bottom: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default CommandCenter;

