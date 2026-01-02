"use client";

import React, { useEffect, Suspense, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

// --- MOTOR SENSORIAL "TUM DUM" (VÁCUO AQUÁTICO) ---
const playSensorialImpact = () => {
  if (typeof window === "undefined") return;
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const masterGain = context.createGain();
    masterGain.connect(context.destination);
    masterGain.gain.setValueAtTime(0.8, context.currentTime);

    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(350, context.currentTime); 
    filter.connect(masterGain);

    // TUM (O Impacto/Vácuo)
    const osc1 = context.createOscillator();
    const gain1 = context.createGain();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(65, context.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(40, context.currentTime + 0.1);
    gain1.gain.setValueAtTime(0, context.currentTime);
    gain1.gain.linearRampToValueAtTime(0.7, context.currentTime + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
    osc1.connect(gain1);
    gain1.connect(filter);

    // DUM (A Massa d'água)
    const osc2 = context.createOscillator();
    const gain2 = context.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(45, context.currentTime + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(30, context.currentTime + 0.5);
    gain2.gain.setValueAtTime(0, context.currentTime + 0.05);
    gain2.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.8);
    osc2.connect(gain2);
    gain2.connect(filter);

    osc1.start(); osc2.start();
    osc1.stop(context.currentTime + 0.3);
    osc2.stop(context.currentTime + 0.9);
  } catch (e) { console.warn("Sinal bloqueado."); }
};

function ParticlesLogo({ isImpact }: { isImpact: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 15000;
  const impactFactor = useRef(1);

  const [positions, colors, initialPositions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const initial = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 1.2 + Math.sin(angle * 5) * 0.15 + (Math.random() * 0.1);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = (Math.random() - 0.5) * 0.5;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      initial[i * 3] = x; initial[i * 3 + 1] = y; initial[i * 3 + 2] = z;
      const isBright = Math.random() > 0.5;
      col[i * 3] = isBright ? 0.9 : 0.1; 
      col[i * 3 + 1] = isBright ? 0.98 : 0.4; 
      col[i * 3 + 2] = isBright ? 1.0 : 0.6; 
    }
    return [pos, col, initial];
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array;

    // Lógica de impacto (Vácuo)
    if (isImpact) {
      impactFactor.current = THREE.MathUtils.lerp(impactFactor.current, 0.5, 0.2);
    } else {
      impactFactor.current = THREE.MathUtils.lerp(impactFactor.current, 1.0, 0.05);
    }

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const noiseX = Math.sin(t * 0.8 + i * 0.1) * 0.01;
      const noiseY = Math.cos(t * 0.7 + i * 0.1) * 0.01;
      const wave = Math.sin(t * 2 + initialPositions[i3]) * 0.005;

      posArr[i3] = (initialPositions[i3] + noiseX + wave) * impactFactor.current;
      posArr[i3 + 1] = (initialPositions[i3 + 1] + noiseY + wave) * impactFactor.current;
      posArr[i3 + 2] = initialPositions[i3 + 2] + Math.sin(t + i) * 0.005;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.z = t * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.013} vertexColors transparent opacity={0.6} blending={THREE.AdditiveBlending} sizeAttenuation={true} />
    </points>
  );
}

function LoginContent() {
  const router = useRouter();
  const [isImpact, setIsImpact] = React.useState(false);

  const triggerImpact = () => {
    playSensorialImpact();
    setIsImpact(true);
    setTimeout(() => setIsImpact(false), 200);
  };

  const handleLogin = async () => {
    triggerImpact();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleBypass = () => {
    triggerImpact();
    setTimeout(() => router.push('/dashboard'), 400);
  };

  return (
    <div style={styles.container}>
      <div style={styles.canvasContainer}>
        <Canvas camera={{ position: [0, 0, 4] }}>
          <color attach="background" args={["#000"]} />
          <ParticlesLogo isImpact={isImpact} />
        </Canvas>
      </div>
      <div style={styles.content}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}>
          <img src="/logo-ouvi.svg" alt="OUVI" style={{ width: "220px", height: "auto" }} />
          <p style={styles.tagline}>A SINTONIA DA MATÉRIA</p>
        </motion.div>
        <div style={styles.buttonGroup}>
          <button onClick={handleLogin} style={styles.premiumBtn}>
            <span style={styles.btnText}>CONTINUE WITH GOOGLE</span>
          </button>
          <button onClick={handleBypass} style={{...styles.premiumBtn, borderColor: "#ff4d4d"}}>
            <span style={{...styles.btnText, color: "#ff4d4d"}}>ACESSAR DASHBOARD (BYPASS)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ background: "#000", height: "100vh" }} />}>
      <LoginContent />
    </Suspense>
  );
}

const styles = {
  container: { background: "#000", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", position: "relative" as const, overflow: "hidden" },
  canvasContainer: { position: "absolute" as const, top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 },
  content: { zIndex: 10, textAlign: "center" as const, width: "100%", maxWidth: "320px" },
  tagline: { color: "#fff", fontSize: "10px", letterSpacing: "12px", opacity: 0.3, marginTop: "25px", fontWeight: "900" },
  buttonGroup: { display: "flex", flexDirection: "column" as const, gap: "15px", marginTop: "80px" },
  premiumBtn: { background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "18px", borderRadius: "2px", cursor: "pointer", color: "#fff", backdropFilter: "blur(12px)" },
  btnText: { fontSize: "10px", fontWeight: "800", letterSpacing: "4px" },
};