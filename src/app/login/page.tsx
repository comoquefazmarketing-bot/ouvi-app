"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

/**
 * MOTOR DE ÁUDIO SENSORIAL OUVI [cite: 2026-01-02]
 * Frequência: Deep Bass (45Hz - 90Hz)
 * Objetivo: Impacto visceral e minimalista.
 */
const playSensorialSound = () => {
  if (typeof window === "undefined") return;
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const masterGain = context.createGain();
    masterGain.connect(context.destination);
    masterGain.gain.setValueAtTime(0.6, context.currentTime);

    // Espacialidade Sub-harmônica
    const delay = context.createDelay();
    delay.delayTime.value = 0.2;
    const feedback = context.createGain();
    feedback.gain.value = 0.25; 
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400; // Corta qualquer brilho metálico

    delay.connect(feedback);
    feedback.connect(filter);
    filter.connect(delay);
    delay.connect(masterGain);

    // A FUNDAMENTAL (Grave Orgânico e Aveludado)
    const osc = context.createOscillator();
    const gain = context.createGain();
    
    osc.type = "sine"; // Onda pura para evitar som de console antigo
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

  } catch (e) {
    console.warn("Sinal sensorial bloqueado.");
  }
};

function LoginContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const invite = searchParams.get("convite");
    if (invite) localStorage.setItem("ouvi_invite_code", invite);
  }, [searchParams]);

  const handleLogin = async (provider: 'google' | 'discord') => {
    playSensorialSound(); 
    try {
      await supabase.auth.signInWithOAuth({
        provider,
        options: { 
          // Redirecionamento blindado para o callback de servidor [cite: 2025-12-30]
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });
    } catch (e) {
      console.error("Erro na sintonização de login:", e);
    }
  };

  return (
    <div style={styles.container} onClick={playSensorialSound}>
      <div style={styles.content}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <h1 style={styles.logoText}>OUVI</h1>
          <p style={styles.tagline}>A FREQUÊNCIA DO SEU MUNDO</p>
        </motion.div>

        <div style={styles.buttonGroup}>
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLogin('google')} 
            style={styles.premiumBtn}
          >
            <span style={styles.btnText}>CONTINUE WITH GOOGLE</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: "rgba(88,101,242,0.05)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLogin('discord')} 
            style={{...styles.premiumBtn, borderColor: "rgba(88,101,242,0.2)"}}
          >
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
  container: { background: "#000", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", position: "relative" as const, cursor: "pointer", overflow: "hidden" },
  content: { zIndex: 10, textAlign: "center" as const, width: "100%", maxWidth: "320px" },
  logoText: { color: "#fff", fontSize: "42px", fontWeight: "900", letterSpacing: "18px", margin: 0, textShadow: "0 0 20px rgba(255,255,255,0.1)" },
  tagline: { color: "#fff", fontSize: "9px", letterSpacing: "8px", opacity: 0.4, marginTop: "10px", fontWeight: "900" },
  buttonGroup: { display: "flex", flexDirection: "column" as const, gap: "15px", marginTop: "60px" },
  premiumBtn: { background: "rgba(255, 255, 255, 0.01)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "20px", borderRadius: "12px", cursor: "pointer", color: "#fff", transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)" },
  btnText: { fontSize: "10px", fontWeight: "800", letterSpacing: "2px" },
  footer: { position: "absolute" as const, bottom: "40px", fontSize: "8px", color: "#333", letterSpacing: "4px", fontWeight: "900" },
};