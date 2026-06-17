import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial } from '@react-three/drei';

export const DeenIcon = ({ color = "#c9a84c" }) => {
  const meshRef = useRef();
  useFrame(() => (meshRef.current.rotation.y += 0.01));
  return (
    <group ref={meshRef}>
      <mesh>
        <torusGeometry args={[0.6, 0.05, 16, 100, Math.PI * 1.5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.4, 0.4, 0]} rotation={[0, 0, Math.PI / 4]}>
        <octahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};

export const ElesiumIcon = ({ color = "#4c7ec9" }) => {
  const meshRef = useRef();
  useFrame(() => (meshRef.current.rotation.y += 0.01));
  return (
    <group ref={meshRef}>
      <mesh>
        <cylinderGeometry args={[0.1, 0.1, 1.2, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.5, 0, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};

export const InfluenceIcon = ({ color = "#c94c4c" }) => {
  const meshRef = useRef();
  useFrame(() => (meshRef.current.rotation.y += 0.01));
  return (
    <group ref={meshRef}>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.1, 1.2, 0.05]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[0.6, 0.1, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};

export const SelfIcon = ({ color = "#4caa6e" }) => {
  const meshRef = useRef();
  useFrame(() => (meshRef.current.rotation.y += 0.01));
  return (
    <group ref={meshRef}>
      <mesh>
        <octahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} wireframe />
      </mesh>
      <mesh>
        <octahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
      </mesh>
    </group>
  );
};
