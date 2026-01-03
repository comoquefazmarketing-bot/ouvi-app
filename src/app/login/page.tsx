"use client";
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const ParticlesBackground = () => {
  // 15.000 partículas simuladas para performance fluida [cite: 2026-01-02]
  const particles = useMemo(() => {
    return Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      size: Math.random() * 2 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 10 + Math.random() * 20,
    }));
  }, []);

  return (
    <div style={styles.particleContainer}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{
            ...styles.particle,
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            x: [0, Math.random() * 200 - 100, 0],
            y: [0, Math.random() * 200 - 100, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

export default function LoginPage() {
  const [formData, setFormData] = useState({ nome: "", email: "", whats: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const playDuuummTuuumm = () => {
    if (typeof window === "undefined") return;
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
    beat(110, 0.3, audioCtx.currentTime, 0.7, false); // Tuuumm
    beat(60, 0.6, audioCtx.currentTime + 0.6, 1.2, true); // Duuumm (mais lento) [cite: 2026-01-02]
  };

  const handleAcesso = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    playDuuummTuuumm();
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ email: formData.email, username: formData.nome, whatsapp: formData.whats }, { onConflict: 'email' })
        .select().single();
      if (error) throw error;
      localStorage.setItem("ouvi_session_id", data.id);
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (err) {
      alert("Falha na sintonização. Verifique o SQL no Supabase.");
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.container}>
      <ParticlesBackground />
      <div style={styles.content}>
        <motion.img src="/logo-ouvi.svg" style={styles.logo} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 8, repeat: Infinity }} />
        <p style={styles.tagline}>A FREQUÊNCIA DO SEU MUNDO</p>
        
        <form onSubmit={handleAcesso} style={styles.form}>
          <input type="text" placeholder="NOME" required style={styles.input} onChange={(e) => setFormData({...formData, nome: e.target.value})} />
          <input type="email" placeholder="E-MAIL" required style={styles.input} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          <input type="tel" placeholder="WHATSAPP" required style={styles.input} onChange={(e) => setFormData({...formData, whats: e.target.value})} />
          <button style={styles.mainBtn}>{loading ? "SINTONIZANDO..." : "ENTRAR NO SINAL"}</button>
        </form>

        <div style={styles.credibilidade}>
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" style={styles.icon} />
          <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" style={{...styles.icon, filter: 'invert(1)'}} />
          <span style={styles.breveText}>ACESSO EM MANUTENÇÃO</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { background: "#000", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", position: "relative" as "relative", color: "#fff", fontFamily: "sans-serif" },
  particleContainer: { position: "absolute" as "absolute", width: "100%", height: "100%", zIndex: 1 },
  particle: { position: "absolute" as "absolute", background: "#00f2fe", borderRadius: "50%", boxShadow: "0 0 8px rgba(0, 242, 254, 0.5)" },
  content: { width: "100%", maxWidth: "320px", display: "flex", flexDirection: "column" as "column", alignItems: "center", zIndex: 10 },
  logo: { width: "140px", marginBottom: "10px", filter: "drop-shadow(0 0 20px rgba(0,242,254,0.3))" },
  tagline: { fontSize: "8px", fontWeight: "900", letterSpacing: "6px", marginBottom: "50px", opacity: 0.3, textAlign: "center" as "center" },
  form: { width: "100%", display: "flex", flexDirection: "column" as "column", gap: "12px" },
  input: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "18px", borderRadius: "20px", color: "#fff", fontSize: "10px", letterSpacing: "2px", outline: "none", textAlign: "center" as "center" },
  mainBtn: { background: "#fff", color: "#000", border: "none", padding: "20px", borderRadius: "20px", fontWeight: "900", fontSize: "10px", letterSpacing: "4px", cursor: "pointer", marginTop: "10px" },
  credibilidade: { marginTop: "40px", display: "flex", alignItems: "center", gap: "15px", opacity: 0.15 },
  icon: { width: "14px", height: "14px" },
  breveText: { fontSize: "7px", fontWeight: "800", letterSpacing: "2px" }
};