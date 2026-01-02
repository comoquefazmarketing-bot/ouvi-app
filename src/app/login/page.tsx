"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

/**
 * MOTOR DE ÁUDIO SENSORIAL OUVI [cite: 2026-01-01]
 * Foco: Sistema Límbico e Córtex Pré-Frontal.
 * Som viciante, orgânico e premium.
 */
const playSensorialSound = () => {
  if (typeof window === "undefined") return;
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const masterGain = context.createGain();
    masterGain.connect(context.destination);
    masterGain.gain.setValueAtTime(0.5, context.currentTime);

    // Efeito de Espacialidade (Eco de Veludo)
    const delay = context.createDelay();
    delay.delayTime.value = 0.15;
    const feedback = context.createGain();
    feedback.gain.value = 0.3; 
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800; // Remove frequências irritantes

    delay.connect(feedback);
    feedback.connect(filter);
    filter.connect(delay);
    delay.connect(masterGain);

    // CAMADA 1: O PULSO (Grave Profundo - Segurança)
    const oscRoot = context.createOscillator();
    const gainRoot = context.createGain();
    oscRoot.type = "sine"; 
    oscRoot.frequency.setValueAtTime(55, context.currentTime); // Nota Lá Sub
    oscRoot.frequency.exponentialRampToValueAtTime(110, context.currentTime + 0.4);
    
    gainRoot.gain.setValueAtTime(0, context.currentTime);
    gainRoot.gain.linearRampToValueAtTime(0.4, context.currentTime + 0.05);
    gainRoot.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5);

    // CAMADA 2: O BRILHO (Cristalino - Recompensa)
    const oscSparkle = context.createOscillator();
    const gainSparkle = context.createGain();
    oscSparkle.type = "triangle"; 
    oscSparkle.frequency.setValueAtTime(440, context.currentTime); 
    oscSparkle.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.3);

    gainSparkle.gain.setValueAtTime(0, context.currentTime);
    gainSparkle.gain.linearRampToValueAtTime(0.12, context.currentTime + 0.1);
    gainSparkle.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.4);

    // Conexões e Disparo
    oscRoot.connect(gainRoot);
    gainRoot.connect(masterGain);
    
    oscSparkle.connect(gainSparkle);
    gainSparkle.connect(delay); 

    oscRoot.start();
    oscSparkle.start();
    oscRoot.stop(context.currentTime + 0.6);
    oscSparkle.stop(context.currentTime + 0.6);

  } catch (e) {
    console.warn("Sinal sensorial bloqueado pelo navegador.");
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
          // Redirecionamento blindado para evitar loop [cite: 2025-12-30]
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