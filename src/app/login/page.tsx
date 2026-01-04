"use client";
import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const ParticlesBackground = () => {
  const particleCount = 150; 
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 18 + Math.random() * 6; 
      return {
        id: i,
        size: Math.random() * 2 + 0.5,
        initialX: Math.random() * 100,
        initialY: Math.random() * 100,
        targetX: 50 + radius * Math.cos(angle),
        targetY: 45 + radius * Math.sin(angle) * 1.3,
        duration: 3 + Math.random() * 5,
        delay: Math.random() * -20,
      };
    });
  }, []);

  return (
    <div style={styles.particleContainer}>
      <div style={styles.nebulaOverlay} />
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{ 
            ...styles.particle, 
            width: p.size, 
            height: p.size,
            boxShadow: `0 0 ${p.size * 4}px #00f2fe` 
          }}
          animate={{
            left: [`${p.initialX}%`, `${p.targetX}%`, `${p.initialX}%`],
            top: [`${p.initialY}%`, `${p.targetY}%`, `${p.initialY}%`],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
};

export default function LoginPage() {
  const [formData, setFormData] = useState({ nome: "", email: "", whats: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const sessionId = localStorage.getItem("ouvi_session_id");
    if (sessionId && sessionId !== "temp_id") {
      router.push("/dashboard");
    }
  }, [router]);

  const playDuuummTuuumm = () => {
    if (typeof window === "undefined") return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const beat = (freq: number, vol: number, start: number, dur: number, isDum: boolean) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        if (isDum) osc.frequency.exponentialRampToValueAtTime(freq * 0.3, start + dur);
        gain.gain.setValueAtTime(vol, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start); osc.stop(start + dur);
      };
      beat(110, 0.2, audioCtx.currentTime, 0.6, false); 
      beat(55, 0.4, audioCtx.currentTime + 0.5, 1.0, true); 
    } catch (e) { console.error("Audio blocked"); }
  };

  const handleGoogleLogin = async () => {
    playDuuummTuuumm();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error(error.message);
      setLoading(false);
    }
  };

  const handleAcessoManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    playDuuummTuuumm();
    // ... (seu código de acesso manual permanece o mesmo)
    router.push("/dashboard"); // Simplificado para o exemplo
  };

  return (
    <div style={styles.container}>
      <ParticlesBackground />
      <div style={styles.content}>
        <motion.img 
          src="/logo-ouvi.svg" 
          style={styles.logo} 
          animate={{ scale: [1, 1.05, 1], filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] }} 
          transition={{ duration: 4, repeat: Infinity }} 
        />
        <p style={styles.tagline}>A FREQUÊNCIA DO SEU MUNDO</p>
        
        <form onSubmit={handleAcessoManual} style={styles.form}>
          <input type="text" placeholder="NOME" required style={styles.input} />
          <button style={styles.mainBtn} disabled={loading}>
            {loading ? "SINTONIZANDO..." : "ENTRAR NO SINAL"}
          </button>
        </form>

        <div style={styles.divider}>OU</div>

        <button onClick={handleGoogleLogin} style={styles.googleBtn} disabled={loading}>
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" style={styles.googleIcon} alt="G" />
          CONTINUAR COM GOOGLE
        </button>

        <div style={styles.credibilidade}>
          <span style={styles.breveText}>CONEXÃO SEGURA</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { background: "#000", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", position: "relative" as "relative", color: "#fff", fontFamily: "sans-serif" },
  particleContainer: { position: "absolute" as "absolute", width: "100%", height: "100%", zIndex: 1 },
  nebulaOverlay: { position: "absolute" as "absolute", width: "100%", height: "100%", background: "radial-gradient(circle, rgba(0,242,254,0.05) 0%, rgba(0,0,0,0) 70%)", zIndex: 1 },
  particle: { position: "absolute" as "absolute", background: "#00f2fe", borderRadius: "50%" },
  content: { width: "100%", maxWidth: "320px", display: "flex", flexDirection: "column" as "column", alignItems: "center", zIndex: 10 },
  logo: { width: "150px", marginBottom: "15px" },
  tagline: { fontSize: "8px", fontWeight: "900", letterSpacing: "6px", marginBottom: "40px", opacity: 0.4, textAlign: "center" as "center" },
  form: { width: "100%", display: "flex", flexDirection: "column" as "column", gap: "12px" },
  input: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", padding: "18px", borderRadius: "20px", color: "#fff", fontSize: "11px", letterSpacing: "1px", textAlign: "center" as "center", outline: "none" },
  mainBtn: { background: "#fff", color: "#000", border: "none", padding: "18px", borderRadius: "20px", fontWeight: "900", fontSize: "11px", letterSpacing: "3px", cursor: "pointer" },
  divider: { margin: "20px 0", fontSize: "10px", opacity: 0.3, letterSpacing: "2px" },
  googleBtn: { width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.2)", padding: "15px", borderRadius: "20px", color: "#fff", fontSize: "10px", fontWeight: "800", letterSpacing: "1px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" },
  googleIcon: { width: "18px", height: "18px" },
  credibilidade: { marginTop: "40px", opacity: 0.25 },
  breveText: { fontSize: "8px", fontWeight: "800", letterSpacing: "1px" }
};