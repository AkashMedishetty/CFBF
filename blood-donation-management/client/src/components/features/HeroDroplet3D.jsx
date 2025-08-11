import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, MeshReflectorMaterial, Lightformer } from '@react-three/drei';

function DropletMesh() {
  const meshRef = useRef();

  // Lathe profile tailored to the reference: sharp tip, full belly, tight round base
  const geometryArgs = useMemo(() => {
    const points = [];
    const total = 64;
    for (let i = 0; i <= total; i += 1) {
      const t = i / total; // 0..1 top->bottom
      // Ease curves for radius
      const sharpTip = Math.pow(t, 0.35); // slow start for sharp top
      const belly = Math.sin(Math.PI * Math.min(1, t)) ** 1.25;
      // Emphasize mid-bulge and tighten base
      const radius = 0.02 + 1.02 * belly * (1 - 0.18 * t) * (0.75 + 0.25 * sharpTip);
      // Height: slightly stretched near the top
      const y = -1.28 + 2.56 * t + (t < 0.10 ? -0.22 * (1 - t / 0.10) : 0);
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
    <mesh ref={meshRef} castShadow receiveShadow rotation={[0.03, 0.9, 0]} position={[0, 0.34, 0]}>
      <latheGeometry
        args={[
          geometryArgs.points.map(([x, y]) => new THREE.Vector2(x, y)),
          192,
        ]}
      />
      <meshPhysicalMaterial
        color="#c51212"
        roughness={0.08}
        metalness={0.0}
        clearcoat={1}
        clearcoatRoughness={0.02}
        transmission={0.1}
        thickness={1.1}
        ior={1.4}
        reflectivity={0.75}
        envMapIntensity={1.35}
        attenuationColor="#f51414"
        attenuationDistance={2.2}
      />
    </mesh>
  );
}

function RippleRing({ delay = 0 }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = (clock.getElapsedTime() + delay) % 2.5; // loop
    const k = t / 2.5; // 0..1
    const scale = 0.6 + k * 2.2;
    const opacity = 0.35 * (1 - k);
    if (ref.current) {
      ref.current.scale.set(scale, scale, scale);
      ref.current.material.opacity = opacity;
    }
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]}>
      <ringGeometry args={[0.35, 0.37, 128]} />
      <meshBasicMaterial color="#ffb3b3" transparent opacity={0.3} />
    </mesh>
  );
}

function BackdropParticles({ count = 350 }) {
  const points = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const r = 3 + Math.random() * 1.2; // radius ring around droplet
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() * 0.7 + 0.15) * Math.PI; // avoid poles
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = (Math.random() - 0.5) * 2.2; // vertical spread
      const z = r * Math.sin(phi) * Math.sin(theta) - 0.6; // slightly behind
      positions.set([x, y, z], i * 3);
    }
    return positions;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={points} count={points.length / 3} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#ffb3b3" size={0.02} transparent opacity={0.22} depthWrite={false} />
    </points>
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

      {/* Deep-red reflective liquid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]} receiveShadow>
        <circleGeometry args={[3.2, 128]} />
        <MeshReflectorMaterial
          color="#3a0505"
          blur={[300, 120]}
          mixBlur={0.85}
          mixStrength={1.2}
          depthScale={0.12}
          minDepthThreshold={0.7}
          maxDepthThreshold={1.2}
          resolution={512}
          mirror={0.2}
        />
      </mesh>

      {/* Animated ripple rings */}
      <RippleRing delay={0} />
      <RippleRing delay={0.8} />
      <RippleRing delay={1.6} />

      {/* Soft ground contact shadow */}
      <ContactShadows
        position={[0, -1.08, 0]}
        opacity={0.3}
        scale={6}
        blur={2.2}
        far={3.6}
      />

      {/* Environment with lightformers to create premium highlights */}
      <Environment resolution={1024} preset="sunset">
        <Lightformer position={[2, 2.5, 3]} scale={[3.2, 1.2]} color="#ffffff" intensity={3.5} form="rect" />
        <Lightformer position={[-3, 1.5, -2]} rotation={[0, Math.PI / 2.5, 0]} scale={[2.5, 0.9]} color="#ffbdbd" intensity={2.2} form="rect" />
      </Environment>

      {/* Subtle particle field inspired by reference */}
      <BackdropParticles />
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


