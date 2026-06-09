import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload, AdaptiveDpr, View } from '@react-three/drei';
import WelcomeScreen from './components/WelcomeScreen';
import CommandCenter from './components/CommandCenter';

function App() {
  const [screen, setScreen] = useState('command');
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    setIsChecking(false);
  }, []);

  if (isChecking) return null;

  return (
    <div className="app-container">
      <div className="light-leak" />
      
      {/* Global Canvas for shared WebGL Views */}
      <Canvas
        style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 100 }}
        eventSource={document.getElementById('root')}
        eventPrefix="client"
      >
        <View.Port />
        <Suspense fallback={null}>
          <Preload all />
        </Suspense>
        <AdaptiveDpr pixelated />
      </Canvas>

      <CommandCenter />


      <style jsx global>{`
        canvas {
          z-index: 100 !important;
        }
      `}</style>
    </div>
  );
}

export default App;
