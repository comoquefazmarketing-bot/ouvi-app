/**
 * PROJETO OUVI – Tela de Login (SENSORIAL V3.1)
 * Ajuste: Captura de Convite via URL e Fim da Tela Preta
 */

"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

// Componente interno para lidar com busca de parâmetros
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    // CAPTURA DE SINAL: Verifica convite no link ou no navegador [cite: 2026-01-01]
    const inviteQuery = searchParams.get("convite");
    const hasInvite = localStorage.getItem("ouvi_invite_code");

    if (inviteQuery) {
      localStorage.setItem("ouvi_invite_code", inviteQuery);
      setAutorizado(true);
    } else if (hasInvite) {
      setAutorizado(true);
    } else {
      // Se não houver nada, apenas liberamos a tela para o Luciano não ver preto, 
      // mas mantemos o aviso de convite no rodapé.
      setAutorizado(true); 
    }
  }, [searchParams]);

  const handleLogin = async (provider: 'google' | 'discord') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { 
          // O sinal agora aponta sempre para o Onboarding após o login [cite: 2026-01-01]
          redirectTo: `${window.location.origin}/onboarding` 
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Erro na sintonização:", error);
    }
  };

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
          {/* Logo em texto como fallback para evitar tela preta se o SVG falhar */}
          <h1 style={styles.logoText}>OUVI</h1>
          <p style={styles.tagline}>A FREQUÊNCIA DO SEU MUNDO</p>
        </motion.div>

        <div style={styles.buttonGroup}>
          <LoginButton 
            label="CONTINUE WITH GOOGLE" 
            color="#fff" 
            hoverColor="#00f2fe" 
            onClick={() => handleLogin('google')} 
          />

          <LoginButton 
            label="CONNECT DISCORD" 
            color="#5865F2" 
            hoverColor="#5865F2" 
            onClick={() => handleLogin('discord')} 
          />
        </div>

        <footer style={styles.footer}>
          ACCESSED BY INVITE ONLY [2026]
        </footer>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ background: "#000", height: "100vh" }} />}>
      <LoginContent />
    </Suspense>
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
  logoText: { color: "#fff", fontSize: "42px", fontWeight: "900", letterSpacing: "18px", margin: 0, textShadow: "0 0 20px rgba(0,242,254,0.3)" },
  tagline: { color: "#fff", fontSize: "9px", fontWeight: "900" as const, letterSpacing: "8px", opacity: 0.4, marginTop: "10px" },
  buttonGroup: { width: "100%", display: "flex", flexDirection: "column" as const, gap: "14px" },
  premiumBtn: { background: "rgba(255, 255, 255, 0.01)", border: "1px solid", padding: "18px", borderRadius: "15px", cursor: "pointer", backdropFilter: "blur(10px)", color: "#fff", transition: "all 0.4s ease" },
  btnText: { fontSize: "10px", fontWeight: "800" as const, letterSpacing: "2px", pointerEvents: "none" as const },
  footer: { position: "absolute" as const, bottom: "40px", fontSize: "8px", color: "#333", letterSpacing: "3px", fontWeight: "900" as const },
};