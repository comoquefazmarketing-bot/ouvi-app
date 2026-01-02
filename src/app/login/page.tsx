"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

// Som de Transformação Sintetizado [cite: 2026-01-01]
const playTransformersSound = () => {
  if (typeof window === "undefined") return;
  const context = new (window.AudioContext || (window as any).webkitAudioContext)();
  const startTime = context.currentTime;

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
    osc.start(time);
    osc.stop(time + 0.1);
  }
};

function LoginContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const invite = searchParams.get("convite");
    if (invite) localStorage.setItem("ouvi_invite_code", invite);
  }, [searchParams]);

  const handleLogin = async (provider: 'google' | 'discord') => {
    playTransformersSound();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (e) {
      console.error("Erro no login:", e);
    }
  };

  return (
    <div style={styles.container} onClick={playTransformersSound}>
      <div style={styles.content}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}>
          <h1 style={styles.logoText}>OUVI</h1>
          <p style={styles.tagline}>A FREQUÊNCIA DO SEU MUNDO</p>
        </motion.div>

        <div style={styles.buttonGroup}>
          <button onClick={() => handleLogin('google')} style={styles.premiumBtn}>
            <span style={styles.btnText}>CONTINUE WITH GOOGLE</span>
          </button>
          <button onClick={() => handleLogin('discord')} style={styles.premiumBtn}>
            <span style={styles.btnText}>CONNECT DISCORD</span>
          </button>
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
  container: { background: "#000", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", position: "relative" as const, cursor: "pointer" },
  content: { zIndex: 10, textAlign: "center" as const },
  logoText: { color: "#fff", fontSize: "42px", fontWeight: "900", letterSpacing: "18px" },
  tagline: { color: "#fff", fontSize: "9px", letterSpacing: "8px", opacity: 0.4, marginTop: "10px" },
  buttonGroup: { display: "flex", flexDirection: "column" as const, gap: "15px", marginTop: "40px" },
  premiumBtn: { background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "18px 40px", borderRadius: "12px", cursor: "pointer", color: "#fff" },
  btnText: { fontSize: "10px", fontWeight: "800", letterSpacing: "2px" },
  footer: { position: "absolute" as const, bottom: "40px", fontSize: "8px", color: "#333", letterSpacing: "3px" },
};