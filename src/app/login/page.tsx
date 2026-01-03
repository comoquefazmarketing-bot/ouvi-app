"use client";

import React from "react";
import { motion } from "framer-motion";
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
  
  // Função que reconstrói o som com o "Dum" mais presente
  const playTumDum = () => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const createBeat = (freq: number, volume: number, start: number, duration: number, isDum: boolean) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      
      // O segredo do Dum: rampa de frequência para dar peso
      if (isDum) {
        osc.frequency.exponentialRampToValueAtTime(freq * 0.4, start + duration);
      }

      gain.gain.setValueAtTime(volume, start);
      // Sustentação maior para o Dum não sumir
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    // "Tum" - Rápido e seco
    createBeat(150, 0.4, audioCtx.currentTime, 0.15, false);
    
    // "Dum" - Frequência mais baixa, maior volume e maior duração
    // Começa 150ms depois para simular o coração
    createBeat(90, 0.7, audioCtx.currentTime + 0.15, 0.5, true); 
  };

  const handleLogin = async (provider: 'google' | 'tiktok' | 'instagram') => {
    // Toca o som sintetizado reforçado
    playTumDum();

    // Pequeno delay para o usuário sentir o som antes do redirecionamento
    setTimeout(async () => {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: provider as any,
          options: {
            // Garante que o redirecionamento aponte para o callback que blindamos
            redirectTo: `https://ouvi.ia.br/auth/callback`,
          },
        });
        if (error) throw error;
      } catch (error) {
        console.error("Erro ao logar:", error);
      }
    }, 200);
  };

  return (
    <div style={styles.container}>
      <ImmersiveBackground />
      <div style={styles.content}>
        <motion.img 
          src="/logo-ouvi.svg" 
          alt="OUVI"
          style={styles.logoMaster}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <p style={styles.tagline}>A FREQUÊNCIA DO SEU MUNDO</p>
        <div style={styles.buttonGroup}>
          <motion.button
            onClick={() => handleLogin('google')}
            style={styles.premiumBtn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span style={styles.btnText}>GOOGLE ACCESS</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { background: "#000", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", position: "relative" as "relative" },
  grainContainer: { position: "absolute" as "absolute", width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1 },
  grain: { position: "absolute" as "absolute", background: "#00f2fe", borderRadius: "50%", boxShadow: "0 0 10px rgba(0, 242, 254, 0.8)" },
  content: { width: "100%", maxWidth: "500px", display: "flex", flexDirection: "column" as "column", alignItems: "center", zIndex: 10 },
  logoMaster: { width: "160px", height: "auto", marginBottom: "15px" },
  tagline: { color: "#fff", fontSize: "10px", fontWeight: "900", letterSpacing: "10px", marginBottom: "60px", opacity: 0.3 },
  buttonGroup: { width: "100%", display: "flex", flexDirection: "column" as "column", gap: "16px", padding: "0 60px" },
  premiumBtn: { background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.15)", padding: "16px", borderRadius: "20px", cursor: "pointer", backdropFilter: "blur(20px)", display: "flex", justifyContent: "center", color: "#fff" },
  btnText: { fontSize: "11px", fontWeight: "800", letterSpacing: "2px" }
};