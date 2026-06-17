import React, { Suspense } from 'react';
import { View } from '@react-three/drei';
import { DeenIcon, ElesiumIcon, InfluenceIcon, SelfIcon } from './PillarIcons';

const PillarCard = ({ id, name, subtitle, streak, onClick }) => {
  const getIcon = () => {
    switch (id) {
      case 0: return <DeenIcon />;
      case 1: return <ElesiumIcon />;
      case 2: return <InfluenceIcon />;
      case 3: return <SelfIcon />;
      default: return null;
    }
  };

  const getColor = () => {
    switch (id) {
      case 0: return '#c9a84c';
      case 1: return '#4c7ec9';
      case 2: return '#c94c4c';
      case 3: return '#4caa6e';
      default: return '#c9a84c';
    }
  };

  const getRGB = () => {
    switch (id) {
      case 0: return '201, 168, 76';
      case 1: return '76, 126, 201';
      case 2: return '201, 76, 76';
      case 3: return '76, 170, 110';
      default: return '201, 168, 76';
    }
  };


  return (
    <div className="pillar-card" onClick={onClick} style={{ '--accent': getColor(), '--accent-rgb': getRGB() }}>
      <div className="pillar-3d-container">
        <View className="three-view">
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 5, 5]} intensity={1} color={getColor()} />
          <Suspense fallback={null}>
            {getIcon()}
          </Suspense>
        </View>
      </div>
      
      <div className="pillar-info">
        <h3>{name}</h3>
        <p className="subtitle">{subtitle}</p>
        <div className="streak-tag">
          <span className="dot" />
          {streak} DAY STREAK
        </div>
      </div>

      <style jsx>{`
        .pillar-card {
          background: var(--surface);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 1rem 1.5rem;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 1.25rem;
          cursor: pointer;
          transition: var(--transition-slow);
          position: relative;
          overflow: hidden;
        }
        .pillar-card:hover {
          transform: translateX(10px) perspective(1000px) rotateY(-5deg);
          border-color: var(--accent);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(var(--accent-rgb), 0.1);
        }
        .pillar-3d-container {
          width: 80px;
          height: 80px;
          position: relative;
          flex-shrink: 0;
        }
        .three-view {
          width: 100%;
          height: 100%;
        }
        .pillar-info {
          text-align: left;
          flex: 1;
        }
        h3 {
          font-family: var(--font-heading);
          font-size: 1.2rem;
          margin-bottom: 0.5rem;
          color: var(--accent);
        }
        .subtitle {
          font-size: 0.7rem;
          color: var(--text-muted);
          letter-spacing: 0.1em;
          margin-bottom: 1rem;
        }
        .streak-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--accent);
          background: rgba(0, 0, 0, 0.3);
          padding: 0.3rem 0.8rem;
          border-radius: 100px;
          border: 1px solid rgba(var(--accent-rgb), 0.2);
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 5px var(--accent);
        }
      `}</style>
    </div>
  );
};

export default PillarCard;
