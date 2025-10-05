import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function FloatingShape({ geometry, position, color, rotationSpeed, scale = 1 }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += rotationSpeed.x;
      meshRef.current.rotation.y += rotationSpeed.y;
      meshRef.current.rotation.z += rotationSpeed.z || 0;
      
      // More dramatic floating motion
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.3;
      meshRef.current.position.x = position[0] + Math.cos(state.clock.elapsedTime * 1.5 + position[1]) * 0.2;
      meshRef.current.position.z = position[2] + Math.sin(state.clock.elapsedTime * 1.2 + position[0]) * 0.15;
      
      // Pulsing scale effect
      const pulseScale = 1 + Math.sin(state.clock.elapsedTime * 3 + position[0]) * 0.1;
      meshRef.current.scale.setScalar(scale * pulseScale);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <primitive object={geometry} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.8} />
    </mesh>
  );
}

function ParticleField() {
  const pointsRef = useRef();
  
  const [positions, colors, velocities] = useMemo(() => {
    const count = 300; // More particles for activity
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    const colorPalette = [
      new THREE.Color('#667eea'),
      new THREE.Color('#764ba2'),
      new THREE.Color('#5a67d8'),
      new THREE.Color('#4a5568'),
      new THREE.Color('#2d3748'),
      new THREE.Color('#1a1f2e')
    ];
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
      
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    return [positions, colors, velocities];
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.005;
      pointsRef.current.rotation.x += 0.002;
      
      const positions = pointsRef.current.geometry.attributes.position.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        // More dynamic movement
        positions[i] += velocities[i] + Math.sin(state.clock.elapsedTime * 2 + i) * 0.003;
        positions[i + 1] += velocities[i + 1] + Math.cos(state.clock.elapsedTime * 1.5 + i) * 0.003;
        positions[i + 2] += velocities[i + 2] + Math.sin(state.clock.elapsedTime * 1.8 + i) * 0.002;
        
        // Boundary wrapping
        if (Math.abs(positions[i]) > 15) positions[i] *= -0.8;
        if (Math.abs(positions[i + 1]) > 15) positions[i + 1] *= -0.8;
        if (Math.abs(positions[i + 2]) > 8) positions[i + 2] *= -0.8;
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

function Scene() {
  const shapes = useMemo(() => [
    {
      geometry: new THREE.BoxGeometry(1.2, 0.8, 0.3),
      position: [-4, 2, 0],
      color: '#667eea',
      rotationSpeed: { x: 0.01, y: 0.02, z: 0.005 },
      scale: 1.2,
      type: 'database'
    },
    {
      geometry: new THREE.ConeGeometry(0.6, 1.2, 8),
      position: [4, 2, 0],
      color: '#764ba2',
      rotationSpeed: { x: 0.02, y: 0.01, z: 0.015 },
      scale: 1.2,
      type: 'chart'
    },
    {
      geometry: new THREE.CylinderGeometry(0.7, 0.7, 0.3, 8),
      position: [-4, -2, 0],
      color: '#5a67d8',
      rotationSpeed: { x: 0.015, y: 0.025, z: 0.01 },
      scale: 1.2,
      type: 'disk'
    },
    {
      geometry: new THREE.TorusGeometry(0.5, 0.2, 8, 16),
      position: [4, -2, 0],
      color: '#4a5568',
      rotationSpeed: { x: 0.03, y: 0.02, z: 0.025 },
      scale: 1.2,
      type: 'ring'
    },
    {
      geometry: new THREE.OctahedronGeometry(0.6, 0),
      position: [0, 0, -2],
      color: '#2d3748',
      rotationSpeed: { x: 0.01, y: 0.03, z: 0.02 },
      scale: 1.0,
      type: 'data'
    }
  ], []);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#667eea" />
      <pointLight position={[-10, -10, 5]} intensity={0.4} color="#764ba2" />
      
      {shapes.map((shape, index) => (
        <FloatingShape key={index} {...shape} />
      ))}
      
      <DataVisualization />
    </>
  );
}

function DataVisualization() {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });
  
  const bars = useMemo(() => {
    const data = [];
    for (let i = 0; i < 8; i++) {
      const height = 0.5 + Math.random() * 1.5;
      data.push({
        height,
        position: [(i - 3.5) * 0.4, height / 2, 0],
        color: new THREE.Color(`hsl(${220 + i * 10}, 70%, 60%)`)
      });
    }
    return data;
  }, []);
  
  return (
    <group ref={groupRef} position={[0, 0, -3]}>
      {bars.map((bar, index) => (
        <mesh key={index} position={bar.position}>
          <boxGeometry args={[0.3, bar.height, 0.3]} />
          <meshBasicMaterial color={bar.color} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

export default Scene;