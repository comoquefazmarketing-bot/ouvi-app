"use client";
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const ParticlesBackground = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      size: Math.random() * 2 + 1,
      initialX: Math.random() * 100,
      initialY: Math.random() * 100,
      logoX: 45 + Math.random() * 10, 
      logoY: 45 + Math.random() * 10,
      duration: 5 + Math.random() * 10,
      delay: Math.random() * 2,
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
          }}
          animate={{
            left: [`${p.initialX}%`, `${p.logoX}%`, `${Math.random() * 100}%`],
            top: [`${p.initialY}%`, `${p.logoY}%`, `${Math.random() * 100}%`],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
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
    beat(110, 0.3, audioCtx.currentTime, 0.8, false); 
    beat(60, 0.6, audioCtx.currentTime + 0.7, 1.3, true); 
  };

  const handleAcesso = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    playDuuummTuuumm();
    try {
      const manualId = crypto.randomUUID();
      const cleanUsername = `${formData.nome.toLowerCase().replace(/\s/g, "")}_${Math.floor(Math.random() * 1000)}`;

      const { data, error } = await supabase
        .from('profiles')
        .upsert({ 
          id: manualId,
          email: formData.email, 
          username: cleanUsername, 
          display_name: formData.nome,
          whatsapp: formData.whats 
        }, { onConflict: 'email' })
        .select().single();
      
      if (error) throw error;
      
      localStorage.setItem("ouvi_session_id", data.id);
      localStorage.setItem("ouvi_user_name", data.username);
      
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err: any) {
      alert(`Falha na sintonização. Verifique o SQL.`);
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.container}>
      <ParticlesBackground />
      <div style={styles.content}>
        <motion.img 
          src="/logo-ouvi.svg" 
          style={styles.logo} 
          animate={{ scale: [1, 1.05, 1] }} 
          transition={{ duration: 6, repeat: Infinity }} 
        />
        <p style={styles.tagline}>A FREQUÊNCIA DO SEU MUNDO</p>
        
        <form onSubmit={handleAcesso} style={styles.form}>
          <input type="text" placeholder="NOME" required style={styles.input} 
            onChange={(e) => setFormData({...formData, nome: e.target.value})} />
          <input type="email" placeholder="E-MAIL" required style={styles.input} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} />
          <input type="tel" placeholder="WHATSAPP (00) 00000-0000" required value={formData.whats} style={styles.input} 
            onChange={(e) => handleWhatsChange(e.target.value)} />
          <button style={styles.mainBtn} disabled={loading}>
            {loading ? "SINTONIZANDO..." : "ENTRAR NO SINAL"}
          </button>
        </form>

        <div style={styles.credibilidade}>
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" style={styles.icon} alt="G" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" style={{...styles.icon, filter: 'invert(1)'}} alt="A" />
          <span style={styles.breveText}>SINTONIZANDO</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { background: "#000", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", position: "relative" as "relative", color: "#fff", fontFamily: "sans-serif" },
  particleContainer: { position: "absolute" as "absolute", width: "100%", height: "100%", zIndex: 1 },
  particle: { position: "absolute" as "absolute", background: "#00f2fe", borderRadius: "50%", boxShadow: "0 0 12px rgba(0, 242, 254, 0.6)" },
  content: { width: "100%", maxWidth: "320px", display: "flex", flexDirection: "column" as "column", alignItems: "center", zIndex: 10 },
  logo: { width: "150px", marginBottom: "12px" },
  tagline: { fontSize: "8px", fontWeight: "900", letterSpacing: "6px", marginBottom: "50px", opacity: 0.4, textAlign: "center" as "center" },
  form: { width: "100%", display: "flex", flexDirection: "column" as "column", gap: "14px" },
  input: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", padding: "18px", borderRadius: "22px", color: "#fff", fontSize: "11px", letterSpacing: "2px", outline: "none", textAlign: "center" as "center" },
  mainBtn: { background: "#fff", color: "#000", border: "none", padding: "20px", borderRadius: "22px", fontWeight: "900", fontSize: "11px", letterSpacing: "4px", cursor: "pointer", marginTop: "12px" },
  credibilidade: { marginTop: "40px", display: "flex", alignItems: "center", gap: "15px", opacity: 0.2 },
  icon: { width: "16px", height: "16px" },
  breveText: { fontSize: "8px", fontWeight: "800", letterSpacing: "2px" }
};