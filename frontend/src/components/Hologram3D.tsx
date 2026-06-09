'use client';

import { Canvas } from '@react-three/fiber';
import { BrainCanvas } from './BrainCanvas';
import { ErrorBoundary } from './ErrorBoundary';

export default function Hologram3D() {
  return (
    <ErrorBoundary>
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }} className="w-full h-full">
        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#f0c96a" />
        <pointLight position={[-5, -5, 5]} intensity={0.3} color="#c94c4c" />
        <BrainCanvas />
      </Canvas>
    </ErrorBoundary>
  );
}
