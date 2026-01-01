/**
 * PROJETO OUVI – Plataforma Social de Voz
 * Maestro de Redirecionamento (Home) v2 - Felipe Makarios
 * Estratégia: Filtro de Convite (Landing) vs Login vs Dashboard
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [isSintonizando, setIsSintonizando] = useState(true);

  useEffect(() => {
    const sintonizarEntrada = async () => {
      // 1. Verifica se há uma sessão ativa [cite: 2025-12-29]
      const { data: { session } } = await supabase.auth.getSession();
      
      // 2. Lógica de Convite (Primeiro Nível: Landing vs Login) [cite: 2026-01-01]
      const urlParams = new URLSearchParams(window.location.search);
      const inviteFromUrl = urlParams.get("invite");
      const hasStoredInvite = localStorage.getItem("ouvi_invite_code");

      if (inviteFromUrl) {
        localStorage.setItem("ouvi_invite_code", inviteFromUrl);
      }

      // 3. Delay sensorial de 2s para a logo respirar [cite: 2026-01-01]
      const timer = setTimeout(() => {
        setIsSintonizando(false);

        if (session) {
          // Nível 3: Dashboard [cite: 2025-12-30]
          router.push("/dashboard");
        } else if (inviteFromUrl || hasStoredInvite) {
          // Nível 1 (A): Login (Para convidados) [cite: 2026-01-01]
          router.push("/login");
        } else {
          // Nível 1 (B): Landing Page / Manifesto (Sem convite) [cite: 2026-01-01]
          // Aqui você redireciona para a rota da sua Landing
          router.push("/manifesto"); 
        }
      }, 2000);

      return () => clearTimeout(timer);
    };
    
    sintonizarEntrada();
  }, [router]);

  return (
    <div style={styles.mainContainer}>
      <AnimatePresence>
        {isSintonizando && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            style={styles.splash}
          >
            {/* LOGO SENSORIAL: Respiração neon [cite: 2026-01-01] */}
            <motion.img 
              src="/logo-dashboard.svg" 
              alt="OUVI" 
              animate={{ 
                opacity: [0.4, 1, 0.4], 
                scale: [0.98, 1, 0.98],
                filter: ["blur(2px)", "blur(0px)", "blur(2px)"]
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              style={styles.logo} 
            />
            
            {/* BARRA DE PROGRESSO [cite: 2026-01-01] */}
            <div style={styles.loaderTrack}>
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                style={styles.loaderBar} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <span style={styles.versionTag}>OUVI SENSORIAL 2026 v1.0 - SAFE POINT ACTIVE</span>
    </div>
  );
}

const styles = {
  mainContainer: { 
    background: "#000", 
    height: "100vh", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center",
    overflow: "hidden",
    position: "relative" as const
  },
  splash: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "30px"
  },
  logo: { 
    width: "120px", 
    filter: "drop-shadow(0 0 30px rgba(0,242,254,0.2))" 
  },
  loaderTrack: {
    width: "80px",
    height: "1px",
    background: "rgba(255, 255, 255, 0.03)",
    position: "relative" as const,
    overflow: "hidden"
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
    color: "#111",
    fontSize: "8px",
    fontWeight: "900" as const,
    letterSpacing: "2px"
  }
};