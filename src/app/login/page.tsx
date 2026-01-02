"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

/**
 * PROJETO OUVI – Sintonização com Delay Sensorial [cite: 2026-01-01]
 */
const playSensorialSound = () => {
  if (typeof window === "undefined") return;
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const startTime = context.currentTime;

    const delay = context.createDelay();
    delay.delayTime.value = 0.25; 
    const feedback = context.createGain();
    feedback.gain.value = 0.4; 
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200;

    delay.connect(feedback);
    feedback.connect(filter);
    filter.connect(delay);
    delay.connect(context.destination);

    for (let i = 0; i < 5; i++) {
      const osc = context.createOscillator();
      const gain = context.createGain();
      const time = startTime + i * 0.1;
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120 + i * 40, time);
      osc.frequency.exponentialRampToValueAtTime(500 + i * 100, time + 0.08);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.15, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      osc.connect(gain);
      gain.connect(context.destination);
      gain.connect(delay); 
      osc.start(time);
      osc.stop(time + 0.1);
    }
  } catch (e) { console.warn("Áudio bloqueado."); }
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
          // O segredo para evitar o erro de fragmento (#) é o redirectTo para o callback [cite: 2025-12-29]
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });
    } catch (e) {
      console.error("Erro na sintonização:", e);
    }
  };

  return (
    <div style={styles.container} onClick={playSensorialSound}>
      <div style={styles.content}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}>
          <h1 style={styles.logoText}>OUVI</h1>
          <p style={styles.tagline}>A FREQUÊNCIA DO SEU MUNDO</p>
        </motion.div>

        <div style={styles.buttonGroup}>
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleLogin('google')} 
            style={styles.premiumBtn}
          >
            <span style={styles.btnText}>CONTINUE WITH GOOGLE</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: "rgba(88,101,242,0.1)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleLogin('discord')} 
            style={{...styles.premiumBtn, borderColor: "rgba(88,101,242,0.3)"}}
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
  logoText: { color: "#fff", fontSize: "42px", fontWeight: "900", letterSpacing: "18px", margin: 0 },
  tagline: { color: "#fff", fontSize: "9px", letterSpacing: "8px", opacity: 0.4, marginTop: "10px", fontWeight: "900" },
  buttonGroup: { display: "flex", flexDirection: "column" as const, gap: "15px", marginTop: "60px" },
  premiumBtn: { background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "20px", borderRadius: "15px", cursor: "pointer", color: "#fff", transition: "all 0.3s ease" },
  btnText: { fontSize: "10px", fontWeight: "800", letterSpacing: "2px" },
  footer: { position: "absolute" as const, bottom: "40px", fontSize: "8px", color: "#222", letterSpacing: "4px", fontWeight: "900" },
};