import React, { useState, Suspense } from 'react';
import { View, OrbitControls } from '@react-three/drei';
import Brain from './Brain';
import { DeenIcon, ElesiumIcon, InfluenceIcon, SelfIcon } from './PillarIcons';

const WelcomeScreen = ({ onEnter }) => {
  const [isEntering, setIsEntering] = useState(false);

  const handleEnter = () => {
    if (isEntering) return;
    setIsEntering(true);
    // Flash is 80ms, total fade is 400ms.
    setTimeout(() => {
      onEnter();
    }, 480);
  };

  return (
    <div className={`welcome-screen ${isEntering ? 'entering' : ''}`}>
      <div className="grain-noise"></div>
      
      <div className="center-layout">
        <h1 className="small-label">VIRTUAL MIND</h1>
        <h2 className="large-name">CHAMAN SHAH</h2>
        
        <div className="brain-section" onClick={handleEnter}>
          <div className="brain-rings">
            <div className="brain-ring ring-1"></div>
            <div className="brain-ring ring-2"></div>
          </div>
          
          <div className="brain-canvas-wrapper">
            <View className="three-view">
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} color="#c9a84c" />
              <Suspense fallback={null}>
                <Brain />
              </Suspense>
              <OrbitControls enableZoom={false} enablePan={false} />
            </View>
          </div>
        </div>

        <div className="enter-button-container" onClick={handleEnter}>
          <div className="blinking-label">
            [ PRESS TO ENTER ]
          </div>
        </div>
      </div>

      <div className="quote-bottom">
        "Knowing what you can be and not doing what it takes is a form of Hell."
      </div>

      {isEntering && <div className="flash-overlay"></div>}

      <style jsx>{`
        .welcome-screen {
          position: absolute;
          top: 0; left: 0;
          height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 4rem 2rem;
          background: radial-gradient(circle at center, #0a0a0a 0%, #000000 100%);
          overflow: hidden;
          transition: opacity 400ms ease;
          z-index: 50;
        }
        
        .welcome-screen.entering {
          opacity: 0;
        }

        .grain-noise {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none;
          z-index: 1;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        .center-layout {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-grow: 1;
          z-index: 10;
        }

        .small-label {
          font-family: 'Cinzel', serif;
          color: rgba(201, 168, 76, 0.5);
          font-size: 0.75rem;
          letter-spacing: 0.8em;
          margin-bottom: 0.1rem;
          font-weight: 400;
          text-transform: uppercase;
        }

        .large-name {
          font-family: 'Cinzel', serif;
          font-weight: 900;
          font-size: clamp(2.2rem, 7vw, 4.5rem);
          color: #c9a84c;
          text-shadow: 0 0 60px rgba(201, 168, 76, 0.2), 0 0 120px rgba(201, 168, 76, 0.1);
          margin-bottom: 2.5rem;
          letter-spacing: 0.1em;
        }

        .brain-section {
          position: relative;
          width: 320px;
          height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          margin-bottom: 3rem;
        }

        .brain-rings {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .brain-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(201,168,76,0.15);
          animation: rpulse 4s ease-in-out infinite;
        }

        .ring-1 {
          width: 320px;
          height: 320px;
        }

        .ring-2 {
          width: 360px;
          height: 360px;
          border-color: rgba(201,168,76,0.06);
          animation-delay: 1.2s;
        }

        @keyframes rpulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }

        .brain-canvas-wrapper {
          position: relative;
          width: 280px;
          height: 280px;
          z-index: 5;
        }

        .blinking-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.7rem;
          color: rgba(201, 168, 76, 0.7);
          letter-spacing: 0.3em;
          animation: blink 2s infinite;
          cursor: pointer;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .quote-bottom {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1rem;
          color: #6b6352;
          z-index: 10;
          padding-bottom: 2rem;
          text-align: center;
        }

        .flash-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: white;
          z-index: 999;
          animation: flash 80ms ease-out forwards;
          pointer-events: none;
        }

        @keyframes flash {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;
