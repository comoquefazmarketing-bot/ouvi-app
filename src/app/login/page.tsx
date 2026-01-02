"use client";

import React, { useEffect, Suspense, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

// --- MOTOR SENSORIAL DE ÁUDIO (SEU CÓDIGO) ---
const playSensorialSound = () => {
  if (typeof window === "undefined") return;
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const masterGain = context.createGain();
    masterGain.connect(context.destination);
    masterGain.gain.setValueAtTime(0.6, context.currentTime);

    const delay = context.createDelay();
    delay.delayTime.value = 0.2;
    const feedback = context.createGain();
    feedback.gain.value = 0.25; 
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;

    delay.connect(feedback);
    feedback.connect(filter);
    filter.connect(delay);
    delay.connect(masterGain);

    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(45, context.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(90, context.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(masterGain);
    gain.connect(delay); 

    osc.start();
    osc.stop(context.currentTime + 0.7);
  } catch (e) { console.warn("Sinal sensorial bloqueado."); }
};

// --- MOTOR DE PARTÍCULAS (A AREIA QUE MUDA DE FORMA) ---
function ParticlesLogo() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 12000; // Milhares de grãos

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 1.2 + Math.random() * 0.4;
      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = Math.sin(theta) * r;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.2;

      // Cores: tons de ciano e branco para brilho de elite
      col[i * 3] = 0.8; 
      col[i * 3 + 1] = 0.95; 
      col[i * 3 + 2] = 1.0;
    }
    return [pos, col];
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Vibração sonora simulada na areia
      const wave = Math.sin(t * 1.5 + (posArr[i3] * 2)) * 0.005;
      posArr[i3 + 1] += wave;
      posArr[i3 + 2] += Math.cos(t + i) * 0.002;
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
      <pointMaterial size={0.012} vertexColors transparent opacity={0.4} blending={THREE.AdditiveBlending} sizeAttenuation={true} />
    </points>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const invite = searchParams.get("convite");
    if (invite) localStorage.setItem("ouvi_invite_code", invite);
  }, [searchParams]);

  const handleLogin = async (provider: 'google' | 'discord') => {
    playSensorialSound(); 
    await supabase.auth.signInWithOAuth({
      provider,
      options: { 
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'select_account' }
      },
    });
  };

  return (
    <div style={styles.container} onClick={playSensorialSound}>
      {/* AREIA CINÉTICA AO FUNDO */}
      <div style={styles.canvasContainer}>
        <Canvas camera={{ position: [0, 0, 4] }}>
          <ParticlesLogo />
        </Canvas>
      </div>

      <div style={styles.content}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }}>
          <h1 style={styles.logoText}>OUVI</h1>
          <p style={styles.tagline}>A FREQUÊNCIA DO SEU MUNDO</p>
        </motion.div>

        <div style={styles.buttonGroup}>
          <motion.button whileHover={{ scale: 1.02 }} onClick={() => handleLogin('google')} style={styles.premiumBtn}>
            <span style={styles.btnText}>CONTINUE WITH GOOGLE</span>
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} onClick={() => handleLogin('discord')} style={{...styles.premiumBtn, borderColor: "rgba(88,101,242,0.15)"}}>
            <span style={{...styles.btnText, color: "#5865F2"}}>CONNECT DISCORD</span>
          </motion.button>
        </div>

        <footer style={styles.footer}>ACCESSED BY INVITE ONLY [2026]</footer>
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
  content: { zIndex: 10, textAlign: "center" as const, width: "100%", maxWidth: "320px", pointerEvents: "none" as const },
  logoText: { color: "#fff", fontSize: "48px", fontWeight: "900", letterSpacing: "22px", margin: 0, paddingLeft: "22px", textShadow: "0 0 40px rgba(0,242,254,0.2)" },
  tagline: { color: "#fff", fontSize: "9px", letterSpacing: "8px", opacity: 0.4, marginTop: "15px", fontWeight: "900" },
  buttonGroup: { display: "flex", flexDirection: "column" as const, gap: "15px", marginTop: "80px", pointerEvents: "auto" as const },
  premiumBtn: { background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "20px", borderRadius: "2px", cursor: "pointer", color: "#fff", backdropFilter: "blur(10px)" },
  btnText: { fontSize: "10px", fontWeight: "800", letterSpacing: "3px" },
  footer: { position: "absolute" as const, bottom: "40px", fontSize: "8px", color: "#222", letterSpacing: "4px", fontWeight: "900" },
};