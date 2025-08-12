import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, Lightformer } from '@react-three/drei';

function DropletMesh() {
  const meshRef = useRef();

  // Lathe profile tailored to studio reference: sharp tip, smooth belly, symmetric base
  const geometryArgs = useMemo(() => {
    const points = [];
    const total = 96;
    for (let i = 0; i <= total; i += 1) {
      const t = i / total; // 0..1 top->bottom
      // Smooth teardrop: very sharp top, wide spherical lower half
      const sharpTopEase = Math.pow(t, 0.28);
      const belly = Math.sin(Math.PI * Math.min(1, t)) ** 1.1;
      const radius = 0.015 + 0.98 * belly * (1 - 0.12 * t) * (0.75 + 0.25 * sharpTopEase);
      const y = -1.26 + 2.52 * t + (t < 0.08 ? -0.24 * (1 - t / 0.08) : 0);
      points.push([radius, y]);
    }
    return { points };
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    // Slow anti-clockwise rotation (brain reference style)
    meshRef.current.rotation.y -= delta * 0.18;
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow rotation={[0.015, 0.85, 0]} position={[0, 0.36, 0]}>
      <latheGeometry
        args={[
          geometryArgs.points.map(([x, y]) => new THREE.Vector2(x, y)),
          192,
        ]}
      />
      <meshPhysicalMaterial
        color="#cf1212"
        roughness={0.04}
        metalness={0.0}
        clearcoat={1}
        clearcoatRoughness={0.008}
        transmission={0}
        thickness={0}
        ior={1.5}
        reflectivity={0.85}
        envMapIntensity={1.15}
        sheen={0.25}
        sheenRoughness={0.6}
        sheenColor={new THREE.Color('#ffffff')}
        attenuationColor="#f51414"
        attenuationDistance={2.2}
      />
    </mesh>
  );
}

// Removed ripple rings / reflective pool to match the studio droplet reference

function Scene() {
  const lightColor = '#ff2a2a';
  return (
    <>
      {/* Key and rim lights for glossy look */}
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[2.4, 3.8, 3.2]}
        intensity={0.9}
        color={lightColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3.8, 2.6, -2.5]} intensity={0.35} color="#ffffff" />

      <group scale={0.75}>
        <DropletMesh />

        {/* Ground to catch a soft shadow only (no reflection) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.06, 0]} receiveShadow>
          <circleGeometry args={[2.2, 128]} />
          <meshStandardMaterial color="#ebebeb" roughness={1} metalness={0} />
        </mesh>
      </group>

      {/* Soft ground contact shadow */}
      <ContactShadows
        position={[0, -1.08, 0]}
        opacity={0.3}
        scale={6}
        blur={2.2}
        far={3.6}
      />

      {/* Environment with studio lightformers for crisp speculars */}
      <Environment resolution={1024} preset="studio">
        {/* Primary softbox (front-right) to create the large square highlight */}
        <Lightformer position={[1.7, 2.5, 2.2]} rotation={[0, 0.22, 0]} scale={[1.3, 1.3]} color="#ffffff" intensity={4.6} form="rect" />
        {/* Secondary fill (rear-left) for gentle rim */}
        <Lightformer position={[-2.2, 1.7, -1.8]} rotation={[0, Math.PI / 2.0, 0]} scale={[1.8, 0.9]} color="#ffffff" intensity={1.2} form="rect" />
        {/* Small kicker highlight */}
        <Lightformer position={[0.2, 1.4, 2.8]} rotation={[0, 0, 0]} scale={[0.35, 0.35]} color="#ffffff" intensity={2.6} form="rect" />
      </Environment>
    </>
  );
}

const HeroDroplet3D = () => {
  return (
    <div className="relative aspect-[4/5] w-full max-w-[520px] mx-auto">
      <Canvas
        shadows
        camera={{ position: [0, 0.45, 3.9], fov: 33 }}
        dpr={[1, 2]}
        gl={{ physicallyCorrectLights: true }}
      >
        <Scene />
      </Canvas>
      {/* Vignette / gradient background for depth */}
      <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.15),transparent_55%)]" />
    </div>
  );
};

export default HeroDroplet3D;


