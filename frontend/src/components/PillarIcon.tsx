'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PillarIconProps {
  type: 'DEEN' | 'ELESIUM' | 'INFLUENCE' | 'SELF';
  color?: string;
}

export function PillarIcon({ type, color = '#c9a84c' }: PillarIconProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      const speed = hovered ? 0.02 : 0.005;
      meshRef.current.rotation.y += speed;
      meshRef.current.rotation.x += speed * 0.5;
    }
  });

  const getGeometry = () => {
    switch (type) {
      case 'DEEN':
        // Crescent proxy (Torus)
        return <torusGeometry args={[0.8, 0.3, 16, 100, Math.PI * 1.5]} />;
      case 'ELESIUM':
        // Octahedron
        return <octahedronGeometry args={[0.8, 0]} />;
      case 'INFLUENCE':
        // Torus Knot
        return <torusKnotGeometry args={[0.5, 0.2, 100, 16]} />;
      case 'SELF':
        // Icosahedron
        return <icosahedronGeometry args={[0.8, 0]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <mesh
      ref={meshRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {getGeometry()}
      <meshStandardMaterial 
        color={hovered ? '#ffffff' : color} 
        emissive={color}
        emissiveIntensity={hovered ? 0.8 : 0.2}
        metalness={0.8}
        roughness={0.2}
      />
      {type === 'ELESIUM' && (
        <mesh>
          <octahedronGeometry args={[0.801, 0]} />
          <meshBasicMaterial color={color} wireframe />
        </mesh>
      )}
    </mesh>
  );
}
