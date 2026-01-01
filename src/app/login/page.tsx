/**
 * PROJETO OUVI €” Tela de Login (VISUAL + L“GICA SUPABASE)
 * Autor: Felipe Makarios
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient"; // Verifique se este caminho est¡ correto no seu projeto

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
  
  // FUN‡ƒO REAL DE LOGIN DO SUPABASE
  const handleLogin = async (provider: 'google' | 'tiktok' | 'instagram') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Erro ao logar:", error);
      alert("Erro ao conectar com o provedor social.");
    }
  };

  return (
    <div style={styles.container}>
      <ImmersiveBackground />

      <div style={styles.content}>
        <motion.img 
          src="/logo-ouvi.svg" 
          alt="OUVI"
          style={styles.logoMaster}
          animate={{ 
            scale: [1, 1.05, 1],
            filter: [
              "drop-shadow(0 0 20px rgba(0, 242, 254, 0.2))",
              "drop-shadow(0 0 40px rgba(0, 242, 254, 0.5))",
              "drop-shadow(0 0 20px rgba(0, 242, 254, 0.2))"
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <p style={styles.tagline}>A FREQUŠNCIA DO SEU MUNDO</p>

        <div style={styles.buttonGroup}>
          {/* BOTƒO GOOGLE FUNCIONAL */}
          <motion.button
            onClick={() => handleLogin('google')}
            style={styles.premiumBtn}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.07)" }}
            whileTap={{ scale: 0.98 }}
          >
            <span style={styles.btnText}>GOOGLE ACCESS</span>
          </motion.button>

          {/* BOTƒO TIKTOK */}
          <motion.button
            onClick={() => handleLogin('tiktok' as any)}
            style={styles.premiumBtn}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.07)" }}
            whileTap={{ scale: 0.98 }}
          >
            <span style={styles.btnText}>TIKTOK SYNC</span>
          </motion.button>

          {/* BOTƒO INSTAGRAM */}
          <motion.button
            onClick={() => handleLogin('instagram' as any)}
            style={{ ...styles.premiumBtn, color: "#f09433", borderColor: "rgba(240, 148, 51, 0.4)" }}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(240, 148, 51, 0.05)" }}
            whileTap={{ scale: 0.98 }}
          >
            <span style={styles.btnText}>INSTAGRAM FLOW</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "#000",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative" as "relative",
  },
  grainContainer: {
    position: "absolute" as "absolute",
    width: "100%", height: "100%",
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 1,
  },
  grain: {
    position: "absolute" as "absolute",
    background: "#00f2fe",
    borderRadius: "50%",
    boxShadow: "0 0 10px rgba(0, 242, 254, 0.8)",
  },
  content: {
    width: "100%", maxWidth: "500px",
    display: "flex", flexDirection: "column" as "column",
    alignItems: "center", zIndex: 10,
  },
  logoMaster: {
    width: "160px", 
    height: "auto",
    marginBottom: "15px",
  },
  tagline: {
    color: "#fff", fontSize: "10px", fontWeight: "900",
    letterSpacing: "10px", marginBottom: "60px",
    opacity: 0.3,
  },
  buttonGroup: {
    width: "100%", display: "flex", flexDirection: "column" as "column",
    gap: "16px", padding: "0 60px",
  },
  premiumBtn: {
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    padding: "16px",
    borderRadius: "20px",
    cursor: "pointer",
    backdropFilter: "blur(20px)",
    display: "flex", justifyContent: "center",
    color: "#fff",
    transition: "all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)",
  },
  btnText: {
    fontSize: "11px", fontWeight: "800",
    letterSpacing: "2px",
    pointerEvents: "none" as "none",
  }
};
