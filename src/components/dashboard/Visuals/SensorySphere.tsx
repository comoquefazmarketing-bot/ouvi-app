"use client";
import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";

export default function SensoryBackground() {
  return (
    <div style={{
      position: "fixed", // Mudamos para fixed para garantir que fique no fundo
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      zIndex: -1,
      background: "#000", // Garante fundo preto se falhar
    }}>
      <Canvas camera={{ position: [0, 0, 3] }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Sphere args={[1, 100, 100]} scale={1.8}>
            <MeshDistortMaterial
              color="#00FFFF"
              speed={2}
              distort={0.4}
              radius={1}
              emissive="#00FFFF"
              emissiveIntensity={0.2}
            />
          </Sphere>
        </Suspense>
      </Canvas>
    </div>
  );
}
