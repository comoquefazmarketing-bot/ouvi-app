"use client";
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const ParticlesBackground = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 150 }).map((_, i) => {
      // Cálculo para formar um círculo (anel da logo)
      const angle = (i / 150) * Math.PI * 2;
      const radius = 15 + Math.random() * 5; // O tamanho do anel central
      
      return {
        id: i,
        size: Math.random() * 2 + 1,
        initialX: Math.random() * 100,
        initialY: Math.random() * 100,
        // Coordenadas do anel central
        targetX: 50 + radius * Math.cos(angle),
        targetY: 45 + radius * Math.sin(angle) * 1.2, // Ajuste leve para circularidade
        duration: 4 + Math.random() * 6,
        delay: Math.random() * 2,
      };
    });
  }, []);

  return (
    <div style={styles.particleContainer}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{ ...styles.particle, width: p.size, height: p.size }}
          animate={{
            // Ciclo: Espalhado -> Formando o Círculo da Logo -> Espalhado
            left: [`${p.initialX}%`, `${p.targetX}%`, `${p.initialX}%`],
            top: [`${p.initialY}%`, `${p.targetY}%`, `${p.initialY}%`],
            opacity: [0.1, 0.9, 0.1],
            scale: [1, 1.8, 1],
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
      // RECONHECIMENTO DE SINAL: Verifica se o e-mail já existe [cite: 2025-12-30]
      const { data: existente } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', formData.email)
        .maybeSingle();

      if (existente) {
        localStorage.setItem("ouvi_session_id", existente.id);
        localStorage.setItem("ouvi_user_name", existente.display_name || existente.username);
        router.push("/dashboard");
        return;
      }

      // CRIAÇÃO NA MARRA: Se não existe, cria novo ID [cite: 2025-12-30]
      const manualId = crypto.randomUUID();
      const { data: novo, error } = await supabase
        .from('profiles')
        .insert({ 
          id: manualId,
          email: formData.email, 
          username: `${formData.nome.toLowerCase().replace(/\s/g, "")}_${Math.floor(Math.random() * 1000)}`, 
          display_name: formData.nome,
          whatsapp: formData.whats 
        })
        .select().single();

      if (error) throw error;
      
      localStorage.setItem("ouvi_session_id", novo.id);
      localStorage.setItem("ouvi_user_name", novo.display_name);
      router.push("/dashboard");
    } catch (err: any) {
      // ENTRADA FORÇADA: Se o banco travar, entra como convidado [cite: 2025-12-30]
      localStorage.setItem("ouvi_user_name", formData.nome);
      router.push("/dashboard");
    } finally { setLoading(false); }
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
          <input type="tel" placeholder="WHATSAPP (17) 98803-1679" required value={formData.whats} style={styles.input} 
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
  particle: { position: "absolute" as "absolute", background: "#00f2fe", borderRadius: "50%", boxShadow: "0 0 15px rgba(0, 242, 254, 0.7)" },
  content: { width: "100%", maxWidth: "320px", display: "flex", flexDirection: "column" as "column", alignItems: "center", zIndex: 10 },
  logo: { width: "160px", marginBottom: "15px" },
  tagline: { fontSize: "8px", fontWeight: "900", letterSpacing: "6px", marginBottom: "50px", opacity: 0.5, textAlign: "center" as "center" },
  form: { width: "100%", display: "flex", flexDirection: "column" as "column", gap: "14px" },
  input: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "18px", borderRadius: "22px", color: "#fff", fontSize: "11px", letterSpacing: "2px", outline: "none", textAlign: "center" as "center" },
  mainBtn: { background: "#fff", color: "#000", border: "none", padding: "20px", borderRadius: "22px", fontWeight: "900", fontSize: "11px", letterSpacing: "4px", cursor: "pointer", marginTop: "12px" },
  credibilidade: { marginTop: "40px", display: "flex", alignItems: "center", gap: "15px", opacity: 0.3 },
  icon: { width: "18px", height: "18px" },
  breveText: { fontSize: "8px", fontWeight: "800", letterSpacing: "2px" }
};