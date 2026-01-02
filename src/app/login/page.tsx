"use client";

import React, { useEffect, Suspense, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

// --- MOTOR SENSORIAL DE ÁUDIO ---
const playSensorialSound = () => {
  if (typeof window === "undefined") return;
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const masterGain = context.createGain();
    masterGain.connect(context.destination);
    masterGain.gain.setValueAtTime(0.4, context.currentTime);
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(45, context.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(80, context.currentTime + 0.6);
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(context.currentTime + 0.6);
  } catch (e) { console.warn("Sinal bloqueado."); }
};

// --- MOTOR DE PARTÍCULAS (FORMA DA LOGO + CAOS) ---
function ParticlesLogo() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 15000;

  const [positions, colors, initialPositions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const initial = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const isChaotic = i > count / 2;
      const angle = (i / count) * Math.PI * 2;
      
      // Forma orgânica da logo
      const radius = isChaotic ? 1.4 + Math.random() * 0.4 : 1.2 + Math.sin(angle * 5) * 0.15;
      
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = (Math.random() - 0.5) * 0.4;

      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      initial[i * 3] = x; initial[i * 3 + 1] = y; initial[i * 3 + 2] = z;

      if (isChaotic) {
        col[i * 3] = 0.1; col[i * 3 + 1] = 0.4; col[i * 3 + 2] = 0.6; 
      } else {
        col[i * 3] = 0.9; col[i * 3 + 1] = 0.98; col[i * 3 + 2] = 1.0; 
      }
    }
    return [pos, col, initial];
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      if (i > count / 2) {
        posArr[i3] += Math.sin(t * 0.4 + i) * 0.004;
        posArr[i3 + 1] += Math.cos(t * 0.4 + i) * 0.004;
      } else {
        const noise = Math.sin(t * 1.5 + initialPositions[i3]) * 0.003;
        posArr[i3] = initialPositions[i3] + noise;
        posArr[i3 + 1] = initialPositions[i3 + 1] + noise;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.z = t * 0.03;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.012} vertexColors transparent opacity={0.5} blending={THREE.AdditiveBlending} sizeAttenuation={true} />
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
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { 
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { 
            access_type: 'offline',
            prompt: 'select_account' // Força a escolha da conta Google
          }
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error("Erro no login:", err);
      alert("Erro ao conectar. Tente novamente.");
    }
  };

  return (
    <div style={styles.container} onClick={playSensorialSound}>
      <div style={styles.canvasContainer}>
        <Canvas camera={{ position: [0, 0, 4] }}>
          <color attach="background" args={["#000"]} />
          <ParticlesLogo />
        </Canvas>
      </div>

      <div style={styles.content}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }}>
          <img src="/logo-ouvi.svg" alt="OUVI" style={{ width: "200px", height: "auto", filter: "drop-shadow(0 0 20px rgba(0,242,254,0.3))" }} />
          <p style={styles.tagline}>A SINTONIA DA MATÉRIA</p>
        </motion.div>

        <div style={styles.buttonGroup}>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            onClick={() => handleLogin('google')} 
            style={styles.premiumBtn}
          >
            <span style={styles.btnText}>CONTINUE WITH GOOGLE</span>
          </motion.button>

          {/* BOTÃO APPLE - EM BREVE */}
          <button 
            disabled 
            style={{...styles.premiumBtn, opacity: 0.3, cursor: "not-allowed", border: "1px dashed rgba(255,255,255,0.2)"}}
          >
            <span style={styles.btnText}>APPLE ID [COMING SOON]</span>
          </button>
        </div>

        <footer style={styles.footer}>CORE ENGINE // ACCESS RESTRICTED [2026]</footer>
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
  content: { zIndex: 10, textAlign: "center" as const, width: "100%", maxWidth: "320px", pointerEvents: "auto" as const },
  tagline: { color: "#fff", fontSize: "10px", letterSpacing: "10px", opacity: 0.3, marginTop: "20px", fontWeight: "900" },
  buttonGroup: { display: "flex", flexDirection: "column" as const, gap: "15px", marginTop: "80px" },
  premiumBtn: { background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "18px", borderRadius: "2px", cursor: "pointer", color: "#fff", backdropFilter: "blur(12px)" },
  btnText: { fontSize: "10px", fontWeight: "800", letterSpacing: "4px" },
  footer: { position: "absolute" as const, bottom: "40px", fontSize: "8px", color: "#1a1a1a", letterSpacing: "5px", fontWeight: "900" },
};