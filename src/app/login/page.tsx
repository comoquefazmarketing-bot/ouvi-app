/**
 * PROJETO OUVI – Tela de Login (SENSORIAL V3)
 * Autor: Felipe Makarios
 * Foco: Experiência Impecável, Guardião de Acesso e Provedores Elite
 */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    // GUARDIÃO: Expulsa intrusos sem convite [cite: 2026-01-01]
    const hasInvite = localStorage.getItem("ouvi_invite_code");
    if (!hasInvite) {
      router.replace("/manifesto");
    } else {
      setAutorizado(true);
    }
  }, [router]);

  const handleLogin = async (provider: 'google' | 'discord') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Erro na sintonização:", error);
    }
  };

  if (!autorizado) return <div style={{ background: "#000", height: "100vh" }} />;

  return (
    <div style={styles.container}>
      <ImmersiveBackground />

      <div style={styles.content}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5 }}
          style={styles.centerBlock}
        >
          <motion.img 
            src="/logo-dashboard.svg" 
            alt="OUVI"
            style={styles.logoMaster}
            animate={{ 
              filter: [
                "drop-shadow(0 0 10px rgba(0, 242, 254, 0.2))",
                "drop-shadow(0 0 30px rgba(0, 242, 254, 0.6))",
                "drop-shadow(0 0 10px rgba(0, 242, 254, 0.2))"
              ]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <p style={styles.tagline}>A FREQUÊNCIA DO SEU MUNDO</p>
        </motion.div>

        <div style={styles.buttonGroup}>
          {/* GOOGLE - ATIVO */}
          <LoginButton 
            label="CONTINUE WITH GOOGLE" 
            color="#fff" 
            hoverColor="#00f2fe" 
            onClick={() => handleLogin('google')} 
          />

          {/* DISCORD - ATIVO (Configurar no Supabase) */}
          <LoginButton 
            label="CONNECT DISCORD" 
            color="#5865F2" 
            hoverColor="#5865F2" 
            onClick={() => handleLogin('discord')} 
          />

          {/* APPLE - EXCLUSIVO (Em breve) */}
          <motion.button
            style={{ ...styles.premiumBtn, opacity: 0.3, cursor: "not-allowed", borderColor: "#FFD70022" }}
            whileTap={{ x: [-2, 2, -2, 2, 0] }}
          >
            <span style={{ ...styles.btnText, color: "#FFD700" }}>APPLE ID (SOON)</span>
          </motion.button>
        </div>

        <footer style={styles.footer}>
          ACCESSED BY INVITE ONLY [2026]
        </footer>
      </div>
    </div>
  );
}

const LoginButton = ({ label, onClick, color, hoverColor }: any) => (
  <motion.button
    onClick={onClick}
    style={{ ...styles.premiumBtn, borderColor: `${color}22` }}
    whileHover={{ 
      scale: 1.02, 
      borderColor: hoverColor,
      backgroundColor: `${hoverColor}05`,
      boxShadow: `0 0 20px ${hoverColor}15` 
    }}
    whileTap={{ scale: 0.98 }}
  >
    <span style={styles.btnText}>{label}</span>
  </motion.button>
);

const styles = {
  container: { background: "#000", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", position: "relative" as const },
  grainContainer: { position: "absolute" as const, width: "100%", height: "100%", zIndex: 1 },
  grain: { position: "absolute" as const, background: "#00f2fe", borderRadius: "50%", boxShadow: "0 0 10px rgba(0, 242, 254, 0.8)" },
  content: { width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column" as const, alignItems: "center", zIndex: 10, padding: "0 20px" },
  centerBlock: { textAlign: "center" as const, marginBottom: "50px" },
  logoMaster: { width: "140px", height: "auto", marginBottom: "20px" },
  tagline: { color: "#fff", fontSize: "9px", fontWeight: "900" as const, letterSpacing: "8px", opacity: 0.4 },
  buttonGroup: { width: "100%", display: "flex", flexDirection: "column" as const, gap: "14px" },
  premiumBtn: { background: "rgba(255, 255, 255, 0.01)", border: "1px solid", padding: "18px", borderRadius: "15px", cursor: "pointer", backdropFilter: "blur(10px)", color: "#fff", transition: "all 0.4s ease" },
  btnText: { fontSize: "10px", fontWeight: "800" as const, letterSpacing: "2px", pointerEvents: "none" as const },
  footer: { position: "absolute" as const, bottom: "40px", fontSize: "8px", color: "#333", letterSpacing: "3px", fontWeight: "900" as const },
};