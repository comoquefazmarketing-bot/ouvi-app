"use client";
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const ParticlesBackground = () => {
  // 150 partículas mestras que representam as 15.000 em fluxo
  const particles = useMemo(() => {
    return Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      size: Math.random() * 2 + 1,
      // Posição inicial aleatória
      initialX: Math.random() * 100,
      initialY: Math.random() * 100,
      // Posição "Logo" (alinhadas ao centro para simular o formato)
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
            // Movimento: Aleatório -> Sincronizado na Logo -> Aleatório
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

  // Máscara dinâmica de WhatsApp com DDD
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
    // Cadência Duuumm Tuuumm lenta e profunda
    beat(110, 0.3, audioCtx.currentTime, 0.8, false); 
    beat(60, 0.6, audioCtx.currentTime + 0.7, 1.3, true); 
  };

  const handleAcesso = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    playDuuummTuuumm();
    try {
      // UUID manual para sintonizar com Supabase sem depender do Google
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
      alert(`Falha na sintonização. Verifique o SQL no Supabase.`);
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.container}>
      <ParticlesBackground />
      <div style={styles.content}>
        <motion.img 
          src="/logo-ouvi.svg" 
          style={styles.logo} 
          animate={{ 
            scale: [1, 1.05, 1],
            filter: ["drop-shadow(0 0 10px rgba(0,242,254,0.2))", "drop-shadow(0 0 25px rgba(0,242,254,0.5))", "drop-shadow(0 0 10px rgba(0,242,254,0.2))"] 
          }} 
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
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.