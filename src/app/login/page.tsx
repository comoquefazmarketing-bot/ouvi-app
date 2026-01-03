"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const ImmersiveBackground = () => {
  const layers = [
    { count: 40, size: 1, speed: 6, opacity: 0.3 },
    { count: 30, size: 2, speed: 4, opacity: 0.6 },
    { count: 15, size: 3, speed: 3, opacity: 0.8 },
  ];

  return (
    <div style={styles.grainContainer}>
      {layers.map((layer, layerIdx) => (
        <React.Fragment key={layerIdx}>
          {Array.from({ length: layer.count }).map((_, i) => (
            <motion.div
              key={`${layerIdx}-${i}`}
              style={{
                ...styles.grain,
                width: layer.size,
                height: layer.size,
                opacity: layer.opacity,
              }}
              animate={{
                x: [0, Math.cos(i) * 400, 0],
                y: [0, Math.sin(i) * 400, 0],
              }}
              transition={{
                duration: layer.speed + Math.random() * 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};

export default function LoginPage() {
  const [formData, setFormData] = useState({ nome: "", email: "", whats: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const playTumDum = () => {
    if (typeof window === "undefined") return;
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const createBeat = (freq: number, volume: number, start: number, duration: number, isDum: boolean) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      if (isDum) osc.frequency.exponentialRampToValueAtTime(freq * 0.4, start + duration);
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };
    createBeat(150, 0.4, audioCtx.currentTime, 0.15, false);
    createBeat(90, 0.7, audioCtx.currentTime + 0.15, 0.5, true); 
  };

  const handleAcessoDireto = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    playTumDum();

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ 
          email: formData.email, 
          username: formData.nome, 
          whatsapp: formData.whats,
          welcome_sent: true 
        }, { onConflict: 'email' })
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem("ouvi_session_id", data.id);
      localStorage.setItem("ouvi_user_name", data.username);

      setTimeout(() => router.push("/dashboard"), 800);
    } catch (err) {
      console.error("Erro na sintonização:", err);
      alert("Falha na sintonização do sinal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <ImmersiveBackground />
      <div style={styles.content}>
        <motion.h1 
          style={styles.logoText}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        >OUVI</motion.h1>
        <p style={styles.tagline}>A FREQUÊNCIA DO SEU MUNDO</p>
        
        <form onSubmit={handleAcessoDireto} style={styles.form}>
          <input 
            type="text" placeholder="NOME" required style={styles.input}
            onChange={(e) => setFormData({...formData, nome: e.target.value})}
          />
          <input 
            type="email" placeholder="E-MAIL" required style={styles.input}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <input 
            type="tel" placeholder="WHATSAPP" required style={styles.input}
            onChange={(e) => setFormData({...formData, whats: e.target.value})}
          />
          <button disabled={loading} style={styles.mainBtn}>
            {loading ? "SINTONIZANDO..." : "ENTRAR NO SINAL"}
          </button>
        </form>

        <div style={styles.divider}>OU</div>

        <div style={styles.buttonGroup}>
          <div style={styles.disabledBtn}>
            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" style={styles.icon} alt="" />
            <span style={styles.btnText}>GOOGLE (BREVE)</span>
          </div>
          <div style={styles.disabledBtn}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" style={{...styles.icon, filter: 'invert(1)'}} alt="" />
            <span style={styles.btnText}>APPLE ID (BREVE)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { background: "#000", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", position: "relative" as "relative", color: "#fff" },
  grainContainer: { position: "absolute" as "absolute", width: "100%", height: "100%", zIndex: 1 },
  grain: { position: "absolute" as "absolute", background: "#00f2fe", borderRadius: "50%", boxShadow: "0 0 10px rgba(0, 242, 254, 0.8)" },
  content: { width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column" as "column", alignItems: "center", zIndex: 10, padding: "0 40px" },
  logoText: { fontSize: "42px", fontWeight: "900", letterSpacing: "12px", marginBottom: "10px", fontStyle: "italic" },
  tagline: { fontSize: "9px", fontWeight: "900", letterSpacing: "6px", marginBottom: "40px", opacity: 0.3 },
  form: { width: "100%", display: "flex", flexDirection: "column" as "column", gap: "12px" },
  input: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "16px", borderRadius: "18px", color: "#fff", fontSize: "11px", letterSpacing: "2px", outline: "none" },
  mainBtn: { background: "#fff", color: "#000", border: "none", padding: "18px", borderRadius: "18px", fontWeight: "900", fontSize: "10px", letterSpacing: "3px", cursor: "pointer", marginTop: "10px" },
  divider: { margin: "20px 0", fontSize: "10px", opacity: 0.2, letterSpacing: "4px" },
  buttonGroup: { width: "100%", display: "flex", flexDirection: "column" as "column", gap: "12px", opacity: 0.2 },
  disabledBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.2)", padding: "14px", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" },
  icon: { width: "16px", height: "16px" },
  btnText: { fontSize: "9px", fontWeight: "800", letterSpacing: "2px" }
};