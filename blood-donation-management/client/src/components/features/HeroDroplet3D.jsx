import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, MeshDistortMaterial } from '@react-three/drei';

function DropletMesh() {
  const meshRef = useRef();

  // Create a lathe geometry that approximates a blood droplet profile
  const geometryArgs = useMemo(() => {
    // Generate profile points for lathe: x = radius, y = height
    // Top is pointy, bottom is round. Height ~ 2.6 units
    const points = [];
    const total = 40;
    for (let i = 0; i <= total; i += 1) {
      const t = i / total; // 0..1 from top to bottom
      // Radius curve: start near 0, bulge in middle, taper near bottom edge
      const bulge = Math.sin(Math.PI * Math.min(1, t * 1.05)) ** 1.6;
      const radius = 0.02 + 0.9 * bulge * (1 - 0.1 * t);
      // Height curve: make top more stretched to form a point
      const y = -1.3 + 2.6 * t + (t < 0.12 ? -0.18 * (1 - t / 0.12) : 0);
      points.push([radius, y]);
    }
    return { points };
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.25;
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow rotation={[0.05, 0.7, 0]} position={[0, 0.28, 0]}>
      <latheGeometry
        args={[
          geometryArgs.points.map(([x, y]) => new THREE.Vector2(x, y)),
          128,
        ]}
      />
      <meshPhysicalMaterial
        color="#c51212"
        roughness={0.12}
        metalness={0.0}
        clearcoat={1}
        clearcoatRoughness={0.03}
        transmission={0.18}
        thickness={0.8}
        ior={1.35}
        reflectivity={0.6}
        envMapIntensity={1.1}
        attenuationColor="#f51414"
        attenuationDistance={2.2}
      />
    </mesh>
  );
}

function Scene() {
  const lightColor = '#ff2a2a';
  return (
    <>
      {/* Key and rim lights for glossy look */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.2}
        color={lightColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-5, 3, -2]} intensity={0.45} color="#ffffff" />
      <spotLight position={[0, 5, -4]} angle={0.35} penumbra={0.7} intensity={0.6} color="#ffd1d1" />

      <DropletMesh />

      {/* Subtle circular water surface with gentle ripples */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.02, 0]} receiveShadow>
        <circleGeometry args={[2.3, 96]} />
        <MeshDistortMaterial
          color="#6f0c0c"
          transparent
          opacity={0.55}
          roughness={0.9}
          metalness={0}
          distort={0.08}
          speed={0.8}
        />
      </mesh>

      {/* Soft ground contact shadow */}
      <ContactShadows
        position={[0, -1.08, 0]}
        opacity={0.3}
        scale={6}
        blur={2.2}
        far={3.6}
      />

      {/* Subtle environment reflections */}
      <Environment preset="sunset" />
    </>
  );
}

const HeroDroplet3D = () => {
  return (
    <div className="relative aspect-[4/5] w-full max-w-[520px] mx-auto">
      <Canvas
        shadows
        camera={{ position: [0, 0.5, 4.3], fov: 35 }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>
      {/* Vignette / gradient background for depth */}
      <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.15),transparent_55%)]" />
    </div>
  );
};

export default HeroDroplet3D;


