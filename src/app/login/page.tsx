"use client";

import React, { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

const playTumDum = () => {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const g = ctx.createGain(); g.connect(ctx.destination);
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 350; f.connect(g);
    const o1 = ctx.createOscillator(); o1.type = "triangle";
    o1.frequency.setValueAtTime(65, ctx.currentTime);
    o1.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);
    const v1 = ctx.createGain(); v1.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.05);
    v1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    o1.connect(v1); v1.connect(f); o1.start(); o1.stop(ctx.currentTime + 0.7);
  } catch (e) {}
};

function Particles() {
  const mesh = useRef<THREE.Points>(null);
  const count = 15000;
  const [pos, col, initial] = useMemo(() => {
    const p = new Float32Array(count * 3);
    const c = new Float32Array(count * 3);
    const init = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = 1.2 + Math.sin(a * 5) * 0.15 + (Math.random() * 0.2);
      p[i*3] = init[i*3] = Math.cos(a) * r;
      p[i*3+1] = init[i*3+1] = Math.sin(a) * r;
      p[i*3+2] = init[i*3+2] = (Math.random() - 0.5) * 0.5;
      const bright = Math.random() > 0.5;
      c[i*3] = bright ? 0.9 : 0.1; c[i*3+1] = bright ? 0.98 : 0.4; c[i*3+2] = 1.0;
    }
    return [p, c, init];
  }, []);

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.getElapsedTime();
    const pAttr = mesh.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pAttr[i3] = initial[i3] + Math.sin(t * 0.5 + i) * 0.005;
      pAttr[i3+1] = initial[i3+1] + Math.cos(t * 0.5 + i) * 0.005;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
    mesh.current.rotation.z = t * 0.04;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={pos} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={col} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.013} vertexColors transparent opacity={0.6} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export default function LoginPage() {
  const handleLogin = async () => {
    playTumDum();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account', access_type: 'offline' }
      }
    });
  };

  return (
    <main style={{ background: "#000", height: "100vh", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: "100%", height: "100%", zIndex: 1 }}>
        <Canvas camera={{ position: [0, 0, 4] }}><Particles /></Canvas>
      </div>
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <img src="/logo-ouvi.svg" alt="OUVI" style={{ width: "210px", marginBottom: "60px", filter: "drop-shadow(0 0 20px rgba(0,242,254,0.2))" }} />
        <button onClick={handleLogin} style={btnStyle}>CONTINUE WITH GOOGLE</button>
      </div>
    </main>
  );
}

const btnStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "20px 50px", letterSpacing: "5px", fontSize: "11px", fontWeight: "900", cursor: "pointer", backdropFilter: "blur(15px)" };