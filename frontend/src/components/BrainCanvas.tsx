'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PillarIcon } from './PillarIcon';

export function BrainCanvas() {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const particleCount = 400; // Optimized for mobile
  const { size } = useThree();
  
  const isMobile = size.width < 768;
  const responsiveScale = isMobile ? 1.35 : 1.0;

  const [positions, lines] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const lineIndices = [];
    
    // Generate points in a sphere
    for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = 3.0 + Math.random() * 0.5; // Larger radius for mobile focus

        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta); // x
        pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta); // y
        pos[i * 3 + 2] = r * Math.cos(phi); // z
    }
    
    // Connect close points (Neural Network effect)
    for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
            const dx = pos[i*3] - pos[j*3];
            const dy = pos[i*3+1] - pos[j*3+1];
            const dz = pos[i*3+2] - pos[j*3+2];
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            if (dist < 1.4) {
                lineIndices.push(i, j);
            }
        }
    }
    
    // Convert to proper buffer attribute geometry
    const linePos = new Float32Array(lineIndices.length * 3);
    for (let i = 0; i < lineIndices.length; i++) {
        const index = lineIndices[i];
        linePos[i * 3] = pos[index * 3];
        linePos[i * 3 + 1] = pos[index * 3 + 1];
        linePos[i * 3 + 2] = pos[index * 3 + 2];
    }
    
    return [pos, linePos];
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      // Smooth majestic rotation
      groupRef.current.rotation.y += 0.003;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
    if (coreRef.current) {
      // Pulsing core effect
      const scale = 1.0 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      coreRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={groupRef} scale={responsiveScale}>
      {/* Inner Glowing Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color="#c9a84c" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Particles */}
      <points>
        <bufferGeometry>
          {/* @ts-ignore */}
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial 
          size={0.15} 
          color="#f0c96a" 
          transparent 
          opacity={1.0}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Neural connections */}
      <lineSegments>
        <bufferGeometry>
          {/* @ts-ignore */}
          <bufferAttribute
            attach="attributes-position"
            count={lines.length / 3}
            array={lines}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial 
          color="#c9a84c" 
          transparent 
          opacity={0.25} 
          blending={THREE.AdditiveBlending} 
        />
      </lineSegments>

      {/* The Pillars Inside the Orb - Rendered purely as 3D objects, no HTML! */}
      <group position={[0, 2.2, 0]} scale={0.7}>
        <pointLight intensity={0.8} distance={4} color="#c9a84c" />
        <PillarIcon type="DEEN" color="#c9a84c" />
      </group>

      <group position={[-2.0, -0.5, 1.5]} scale={0.7}>
        <pointLight intensity={0.8} distance={4} color="#4c7ec9" />
        <PillarIcon type="ELESIUM" color="#4c7ec9" />
      </group>

      <group position={[1.8, -1.0, -1.2]} scale={0.7}>
        <pointLight intensity={0.8} distance={4} color="#c94c4c" />
        <PillarIcon type="INFLUENCE" color="#c94c4c" />
      </group>

      <group position={[1.0, 0.8, 2.0]} scale={0.7}>
        <pointLight intensity={0.8} distance={4} color="#ffffff" />
        <PillarIcon type="SELF" color="#ffffff" />
      </group>
    </group>
  );
}
