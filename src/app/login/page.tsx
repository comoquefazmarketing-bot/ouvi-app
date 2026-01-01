/**
 * PROJETO OUVI – Tela de Login (VISUAL + LÓGICA SUPABASE + GUARDIÃO)
 * Autor: Felipe Makarios
 * Nível: Primeiro Nível (A) - Acesso Restrito com Expulsão Automática
 */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

// ... (Componente ImmersiveBackground mantido igual)

export default function LoginPage() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    const checkInvite = () => {
      const hasInvite = localStorage.getItem("ouvi_invite_code");
      
      if (!hasInvite) {
        // Se não tem convite, manda pro silêncio sem dó
        router.replace("/manifesto");
      } else {
        // Se tem o sinal, libera a visão do login
        setAutorizado(true);
      }
    };
    checkInvite();
  }, [router]);

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
    }
  };

  // Se ainda não verificou ou não está autorizado, renderiza o vazio (preto)
  // Isso impede que o intruso veja os botões por 1 segundo [cite: 2026-01-01]
  if (!autorizado) return <div style={{ background: "#000", height: "100vh" }} />;

  return (
    <div style={styles.container}>
      <ImmersiveBackground />

      <div style={styles.content}>
        <motion.img 
          src="/logo-dashboard.svg" 
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
        
        <p style={styles.tagline}>A FREQUÊNCIA DO SEU MUNDO</p>

        <div style={styles.buttonGroup}>
          <motion.button
            onClick={() => handleLogin('google')}
            style={styles.premiumBtn}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.07)" }}
            whileTap={{ scale: 0.98 }}
          >
            <span style={styles.btnText}>GOOGLE ACCESS</span>
          </motion.button>

          <motion.button
            onClick={() => handleLogin('tiktok' as any)}
            style={styles.premiumBtn}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.07)" }}
            whileTap={{ scale: 0.98 }}
          >
            <span style={styles.btnText}>TIKTOK SYNC</span>
          </motion.button>

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

// ... (Styles mantidos iguais)