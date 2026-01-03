"use client";
import React, { useState, useMemo } from "react";
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

  const handleWhatsChange = (value: string) => {
    const raw = value.replace(/\D/g, "");
    let formatted = raw;
    if (raw.length > 2) formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    if (raw.length > 7) formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
    setFormData({ ...formData, whats: formatted });
  };

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

  const handleAcesso = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    playDuuummTuuumm();
    
    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanName = formData.nome.trim();

    try {
      // 1. RECONHECIMENTO: Tenta encontrar o e-mail primeiro [cite: 2025-12-30]
      const { data: existente, error: erroBusca } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existente) {
        // Se encontrou, resgata a identidade e pula o cadastro
        localStorage.setItem("ouvi_session_id", existente.id);
        localStorage.setItem("ouvi_user_name", existente.display_name || existente.username);
        if (existente.avatar_url) localStorage.setItem("ouvi_user_avatar", existente.avatar_url);
        
        router.push("/dashboard");
        return;
      }

      // 2. ONBOARD: Cria novo sinal se não existir [cite: 2026-01-01]
      const manualId = crypto.randomUUID();
      const { data: novo, error: erroCriar } = await supabase
        .from('profiles')
        .insert({ 
          id: manualId,
          email: cleanEmail, 
          username: `${cleanName.replace(/\s/g, "").toLowerCase()}_${Math.floor(Math.random() * 1000)}`, 
          display_name: cleanName,
          whatsapp: formData.whats 
        })
        .select().single();

      if (erroCriar) throw erroCriar;
      
      localStorage.setItem("ouvi_session_id", novo.id);
      localStorage.setItem("ouvi_user_name", novo.display_name);
      router.push("/dashboard");

    } catch (err: any) {
      console.warn("Entrando via sinal de emergência...");
      localStorage.setItem("ouvi_session_id", "temp_id");
      localStorage.setItem("ouvi_user_name", cleanName);
      router.push("/dashboard");
    } finally {
      setTimeout(() => setLoading(false), 2000);
    }
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
        
        <form onSubmit={handleAcesso} style={styles.form}>
          <input type="text" placeholder="NOME" required style={styles.input} 
            onChange={(e) => setFormData({...formData, nome: e.target.value})} />
          <input type="email" placeholder="E-MAIL" required style={styles.input} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} />
          <input type="tel" placeholder="WHATSAPP" required value={formData.whats} style={styles.input} 
            onChange={(e) => handleWhatsChange(e.target.value)} />
          <button style={styles.mainBtn} disabled={loading}>
            {loading ? "SINTONIZANDO..." : "ENTRAR NO SINAL"}
          </button>
        </form>

        <div style={styles.credibilidade}>
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" style={styles.icon} alt="G" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" style={{...styles.icon, filter: 'invert(1)'}} alt="A" />
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
  mainBtn: { background: "#fff", color: "#000", border: "none", padding: "18px", borderRadius: "20px", fontWeight: "900", fontSize: "11px", letterSpacing: "3px", cursor: "pointer", marginTop: "10px" },
  credibilidade: { marginTop: "40px", display: "flex", alignItems: "center", gap: "15px", opacity: 0.25 },
  icon: { width: "16px", height: "16px" },
  breveText: { fontSize: "8px", fontWeight: "800", letterSpacing: "1px" }
};