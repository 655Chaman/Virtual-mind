import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const Brain = ({ onOpen }) => {
  const groupRef = useRef();
  const nodesRef = useRef([]);
  const linesRef = useRef();
  const [hoveredNode, setHoveredNode] = useState(null);
  
  const [stats, setStats] = useState({ totalLogs: 0, streak: 0 });
  
  useEffect(() => {
    const parseStats = () => {
      const logsStr = localStorage.getItem('virtual_mind_logs');
      const logs = logsStr ? JSON.parse(logsStr) : {};
      const totalLogs = Object.keys(logs).length;
      
      let currentStreak = 0;
      let d = new Date();
      const todayStr = d.toLocaleDateString('en-CA');
      if (!logs[todayStr]) d.setDate(d.getDate() - 1);
      
      while (true) {
        const dateStr = d.toLocaleDateString('en-CA');
        if (logs[dateStr]) {
          currentStreak++;
          d.setDate(d.getDate() - 1);
        } else { break; }
      }
      setStats({ totalLogs, streak: currentStreak });
    };

    parseStats();
    window.addEventListener('storage', parseStats);
    const interval = setInterval(parseStats, 5000);
    return () => {
      window.removeEventListener('storage', parseStats);
      clearInterval(interval);
    };
  }, []);

  const { totalLogs, streak } = stats;
  
  // HUD-centric sizing: Large but contained
  const nodeCount = Math.min(180, 40 + totalLogs * 4);
  const radius = 3.5; 
  const rotationSpeed = 0.0015 + streak * 0.0003;

  const { nodes, lines, clusters } = useMemo(() => {
    const rawNodes = [];
    const clusters = [];
    
    // 1. Core dense cluster (The Singularity)
    const centerCount = Math.floor(nodeCount * 0.6);
    for (let i = 0; i < centerCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const r = Math.pow(Math.random(), 2) * radius * 0.45;
        rawNodes.push(new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        ));
    }

    // 2. Peripheral "Satellite" Clusters (The Synapses)
    const clusterCount = 3 + Math.floor(totalLogs / 20);
    for (let c = 0; c < clusterCount; c++) {
        const cTheta = Math.random() * Math.PI * 2;
        const cPhi = Math.acos(Math.random() * 2 - 1);
        const cPos = new THREE.Vector3(
            radius * 0.8 * Math.sin(cPhi) * Math.cos(cTheta),
            radius * 0.8 * Math.sin(cPhi) * Math.sin(cTheta),
            radius * 0.8 * Math.cos(cPhi)
        );
        clusters.push(cPos);

        const subNodes = 4 + Math.floor(Math.random() * 6);
        for (let i = 0; i < subNodes; i++) {
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 0.8,
                (Math.random() - 0.5) * 0.8,
                (Math.random() - 0.5) * 0.8
            );
            rawNodes.push(cPos.clone().add(offset));
        }
    }

    const lines = [];
    for (let i = 0; i < rawNodes.length; i++) {
        const distances = rawNodes.map((n, idx) => ({ dist: n.distanceTo(rawNodes[i]), idx }))
            .sort((a, b) => a.dist - b.dist);
            
        const connections = 2 + Math.floor(Math.random() * 3);
        for (let j = 1; j <= connections; j++) {
            if (distances[j].dist < 2.0) {
                lines.push(rawNodes[i], rawNodes[distances[j].idx]);
            }
        }
    }
    
    return { nodes: rawNodes, lines, clusters };
  }, [nodeCount, totalLogs]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    
    groupRef.current.rotation.y += rotationSpeed;
    groupRef.current.rotation.z = Math.sin(time * 0.1) * 0.05;
    
    const pulse = 1 + Math.sin(time * 2) * 0.05;
    groupRef.current.scale.set(pulse, pulse, pulse);

    nodes.forEach((pos, i) => {
        const mesh = nodesRef.current[i];
        if (!mesh) return;

        const isHovered = hoveredNode === i;
        const scaleBase = i < (nodeCount * 0.6) ? 0.8 : 0.4;
        const targetScale = isHovered ? scaleBase * 2.5 : scaleBase;
        
        mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        
        // Deadly glow color logic
        const baseColor = new THREE.Color(i % 5 === 0 ? "#ff4444" : "#c9a84c"); // Red accents
        const intensity = 0.5 + Math.sin(time * 3 + i) * 0.5;
        
        mesh.material.emissiveIntensity = THREE.MathUtils.lerp(
            mesh.material.emissiveIntensity, 
            isHovered ? 8 : intensity * 4, 
            0.1
        );
        
        if (isHovered) {
          mesh.material.emissive.setHex(0xffffff);
        } else {
          mesh.material.emissive.copy(baseColor);
        }
    });

    if (linesRef.current) {
        linesRef.current.material.opacity = 0.15 + Math.sin(time * 1.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef} onClick={onOpen}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          {nodes.map((pos, i) => (
            <mesh 
                key={i} 
                position={pos}
                ref={(el) => (nodesRef.current[i] = el)}
                onPointerOver={(e) => { e.stopPropagation(); setHoveredNode(i); }}
                onPointerOut={(e) => { e.stopPropagation(); setHoveredNode(null); }}
            >
              <icosahedronGeometry args={[0.12, 0]} />
              <meshStandardMaterial 
                color="#c9a84c" 
                emissive="#c9a84c" 
                emissiveIntensity={2}
                metalness={1}
                roughness={0}
              />
            </mesh>
          ))}
          
          <lineSegments key={`lines-${lines.length}`} ref={linesRef}>
            <bufferGeometry attach="geometry">
              <bufferAttribute
                attach="attributes-position"
                count={lines.length}
                array={new Float32Array(lines.flatMap(v => [v.x, v.y, v.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#c9a84c" transparent opacity={0.2} blending={THREE.AdditiveBlending} />
          </lineSegments>

          <Sparkles 
            count={40} 
            scale={radius * 1.5} 
            size={2} 
            speed={0.4} 
            opacity={0.6} 
            color="#ff4444" 
          />
          <Sparkles 
            count={60} 
            scale={radius * 2} 
            size={1.5} 
            speed={0.1} 
            opacity={0.3} 
            color="#c9a84c" 
          />

          {/* Deadly Inner Core Glow - NOW INSIDE FLOAT */}
          <mesh scale={[1.2, 1.2, 1.2]}>
             <sphereGeometry args={[1, 32, 32]} />
             <MeshDistortMaterial 
                color="#ff0000" 
                emissive="#ff0000" 
                emissiveIntensity={0.5} 
                transparent 
                opacity={0.05} 
                distort={0.4} 
                speed={2} 
             />
          </mesh>
      </Float>
    </group>
  );
};

export default Brain;

