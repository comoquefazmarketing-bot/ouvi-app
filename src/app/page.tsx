/**
 * PROJETO OUVI – Plataforma Social de Voz
 * Versão Final 2026 - Felipe Makarios
 * Componente: Maestro de Redirecionamento (Home)
 * Foco: Sintonização inicial e transição sensorial
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const sintonizarEntrada = async () => {
      // 1. Verifica a sessão de forma direta
      const { data: { session } } = await supabase.auth.getSession();
      
      // 2. Delay sensorial de 1.8s (tempo ideal para a logo respirar)
      const timer = setTimeout(() => {
        if (session) {
          // Usuário autenticado vai para o Feed Vivo
          router.push("/dashboard");
        } else {
          // Usuário novo vai para a Sintonização (Login)
          router.push("/login");
        }
      }, 1800);

      return () => clearTimeout(timer);
    };
    
    sintonizarEntrada();
  }, [router]);

  return (
    <div style={styles.mainContainer}>
      
      {/* LOGO SENSORIAL: Efeito de respiração neon */}
      <motion.img 
        src="/logo-dashboard.svg" 
        alt="OUVI" 
        initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
        animate={{ 
          opacity: [0.2, 1, 0.2], 
          scale: [0.98, 1, 0.98],
          filter: ["blur(5px)", "blur(0px)", "blur(5px)"]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        style={styles.logo} 
      />
      
      {/* BARRA DE PROGRESSO SENSORIAL: Carregamento infinito suave */}
      <div style={styles.loaderTrack}>
        <motion.div 
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          style={styles.loaderBar} 
        />
      </div>

      {/* Identificador de versão para o desenvolvedor */}
      <span style={styles.versionTag}>OUVI SENSORIAL 2026 v1.0</span>

      {/* Acessibilidade */}
      <h1 style={styles.hiddenTitle}>
        OUVI - Experiência Sensorial de Voz
      </h1>
    </div>
  );
}

const styles = {
  mainContainer: { 
    background: "#000", 
    height: "100vh", 
    display: "flex", 
    flexDirection: "column" as const,
    alignItems: "center", 
    justifyContent: "center",
    gap: "30px",
    overflow: "hidden"
  },
  logo: { 
    width: "100px", 
    filter: "drop-shadow(0 0 20px rgba(0,242,254,0.15))" 
  },
  loaderTrack: {
    width: "60px",
    height: "1px",
    background: "rgba(255, 255, 255, 0.05)",
    position: "relative" as const,
    overflow: "hidden",
    borderRadius: "10px"
  },
  loaderBar: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "linear-gradient(90deg, transparent, #00f2fe, transparent)"
  },
  versionTag: {
    position: "absolute" as const,
    bottom: "40px",
    color: "#222",
    fontSize: "8px",
    fontWeight: "900" as const,
    letterSpacing: "2px"
  },
  hiddenTitle: { 
    position: 'absolute' as const, width: '1px', height: '1px', padding: 0, 
    margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 
  }
};